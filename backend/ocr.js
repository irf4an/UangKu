import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const API_KEY_PATH = '/home/ubuntu/.9router/db/api-key-cached.txt';
let apiKey = '';

// Load or cache API Key using better-sqlite3
try {
  if (fs.existsSync(API_KEY_PATH)) {
    apiKey = fs.readFileSync(API_KEY_PATH, 'utf8').trim();
  }
} catch (e) {
  // Ignore and read from db
}

if (!apiKey) {
  try {
    const db = new Database('/home/ubuntu/.9router/db/data.sqlite', { readonly: true });
    const row = db.prepare('SELECT key FROM apiKeys WHERE isActive = 1 LIMIT 1').get();
    db.close();
    if (row && row.key) {
      apiKey = row.key.trim();
      fs.writeFileSync(API_KEY_PATH, apiKey);
    }
  } catch (err) {
    console.error('OCR: Could not load API key from 9router database:', err.message);
  }
}

export async function extractReceiptInfo(imagePath) {
  try {
    const base64Image = fs.readFileSync(imagePath, { encoding: 'base64' });
    
    // Call 9router Vision API
    const response = await fetch('http://localhost:20128/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'ag/gemini-3-flash',
        stream: false,
        messages: [
          {
            role: 'system',
            content: 'You are a receipt/transfer proof data extractor. Always respond with ONLY valid JSON, no markdown, no code blocks, no explanation.'
          },
          {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: `Analyze this receipt or transfer proof image. Extract:
- type: "masuk" if money coming IN (transfer received, salary), "keluar" if money going OUT (shopping, payment)
- amount: the TOTAL amount as a number (no dots, no commas, no currency symbol)
- title: store name, merchant, or sender name
- accountName: bank or e-wallet name if visible (BCA, Dana, GoPay, etc), or empty string
- items: array of purchased items, each with "name" (string) and "price" (number). Include ALL items visible on the receipt. If no items are visible (e.g. transfer proof), use empty array []

Respond with ONLY this JSON object, nothing else:
{"type":"masuk|keluar","amount":number,"title":"string","accountName":"string","items":[{"name":"string","price":number}]}` 
              },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
            ]
          }
        ],
        temperature: 0.1
      })
    });
    
    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status}`);
    }
    
    const rawText = await response.text();
    let content = '';
    
    // Handle both SSE streaming format and regular JSON
    if (rawText.startsWith('data: ')) {
      const chunks = rawText.split('\n')
        .filter(line => line.startsWith('data: ') && !line.includes('[DONE]'))
        .map(line => {
          try {
            const obj = JSON.parse(line.slice(6));
            return obj.choices?.[0]?.delta?.content || '';
          } catch { return ''; }
        });
      content = chunks.join('');
    } else {
      const result = JSON.parse(rawText);
      content = result.choices[0].message.content;
    }
    
    // Extract JSON from response
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
    const rawJsonMatch = jsonMatch[1].match(/\{[\s\S]*\}/);
    const data = JSON.parse(rawJsonMatch ? rawJsonMatch[0] : jsonMatch[1]);
    
    if (!data.amount || typeof data.amount !== 'number') {
      throw new Error('Invalid amount in OCR response');
    }
    
    return data;
  } catch (err) {
    console.error('OCR Error:', err.message);
    return null;
  }
}
