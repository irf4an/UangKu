# DESIGN SPEC: Wise-inspired Redesign for UangKu PWA
Date: 2026-07-10
Status: Draft

## 1. Visual Theme & Atmosphere
- **Wise-inspired**: High-trust, clean, friendly, with a vibrant green signal accent and comfortable spacing.
- **Surface Strategy**: Flat surfaces with subtle borders (`#E5E7EB` in light mode) over a very soft light-gray background (`#F8FAFC`).
- **Brand Colors**:
  - Primary (Wise Green): `#00D68F` (Main actions, positive balance)
  - Secondary: `#00B4D8` (Visual gradient pairings)
  - Danger (Expense Coral): `#FF6B6B` (Negative balance, spending)
  - Dark Slate: `#1A1A2E` (Display headers, high contrast)
  - Muted Slate: `#6B7280` (Paragraphs and secondary indicators)

---

## 2. Component Enhancements

### A. Balance Hero Card (Home Page)
- A gradient pill card at the top of the Home tab.
- Gradient: `from-[#00D68F] to-[#00B4D8]` with white text.
- Large Sora display typography for the balance amount.
- Mini row summary underneath:
  - `Masuk: Rp X` (Green soft badge)
  - `Keluar: Rp Y` (Red soft badge)
  - `Sisa: Rp Z`

### B. Quick Stats Row (Home Page)
- Horizontal grid of 3 pill-shaped status widgets:
  - `Hari Ini` (amount & txn count)
  - `Minggu Ini` (amount & txn count)
  - `Bulan Ini` (amount & txn count)

### C. Clean Transaction Rows
- Remove the bulky `rounded-2xl border bg-surface p-4` wrapper.
- Move to a clean line list with a subtle border divider between items.
- Bullet category icon (circular fill background using matching category colors).
- Amount in bold tabular numbers, styled based on transaction type (`+` in green, `-` in red).

### D. Category Progress Bar Redesign
- Custom horizontal pill progress bars.
- Filled portion uses custom color class mapping with smooth transition.

---

## 3. UI Implementation Specs

### Page: Home (`Home.tsx`)
- Replace the existing layout with the Balance Hero Card, followed by Quick Stats, then Clean Transaction Rows.
- Integrate active accounts summary (from `useAccounts` hook) directly below stats.

### Bottom Navigation (`BottomNav.tsx`)
- Update active state to use a soft green indicator badge (pill background for active item) and solid filled icon.

---

## 4. Verification Plan
- Build testing via `npm run build` from `wafin-pwa` dir.
- Verify production deployment of output files to Caddy's root `/var/www/wafin-pwa`.
