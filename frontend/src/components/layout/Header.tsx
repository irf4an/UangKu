import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getPhone } from '../../api/client'
import { X, LogOut, Wallet, Check } from 'lucide-react'

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [workspace, setWorkspace] = useState('My Wallet')
  const [showModal, setShowModal] = useState(false)
  const [newWorkspace, setNewWorkspace] = useState('')
  const [saving, setSaving] = useState(false)
  const phone = getPhone()

  const fetchWorkspace = () => {
    if (!phone) return
    fetch(`http://119.28.110.163:3000/api/transactions?phone=${phone}&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data.user?.workspace) {
          setWorkspace(data.user.workspace)
          setNewWorkspace(data.user.workspace)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetchWorkspace()
  }, [phone])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !newWorkspace.trim()) return

    setSaving(true)
    try {
      const res = await fetch(`http://119.28.110.163:3000/api/user/workspace?phone=${encodeURIComponent(phone)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace: newWorkspace.trim() })
      })
      const data = await res.json()
      if (data.success) {
        setWorkspace(data.workspace)
        setNewWorkspace(data.workspace)
        setShowModal(false)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('wafin_phone')
    window.location.reload()
  }

  const now = new Date()
  const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000))
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const monthStr = `${months[wib.getMonth()]} ${wib.getFullYear()}`

  return (
    <>
      <header className="sticky top-0 z-40 flex h-[60px] items-center justify-between bg-bg/80 px-5 backdrop-blur-md">
        <div className="flex flex-col justify-center">
          <h1 className="font-display text-[19px] font-bold tracking-tight text-text leading-tight">{title}</h1>
          <p className="text-[11px] font-medium text-text-muted mt-0.5 uppercase tracking-wider">{monthStr}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setNewWorkspace(workspace)
              setShowModal(true)
            }}
            className="flex h-9 items-center justify-center rounded-full bg-surface px-4 shadow-sm border border-stone-200/50 hover:bg-stone-50 active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-[13px] font-semibold text-text">{workspace}</span>
          </button>
        </div>
      </header>

      {/* Workspace & Account Management Modal (Bottom Sheet style) */}
      {showModal && createPortal(
        <div 
          className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center modal-backdrop"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-surface w-full max-w-[480px] rounded-t-[28px] p-6 shadow-float modal-sheet"
            onClick={e => e.stopPropagation()}
          >
            {/* Grab handle/indicator for sheet modal */}
            <div className="mx-auto w-12 h-1.5 rounded-full bg-stone-200 mb-6" />

            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display font-bold text-lg text-text">Pengaturan Akun</h3>
                <p className="text-xs text-text-muted mt-0.5">Atur nama dompet atau keluar dari akun</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-1.5 rounded-xl hover:bg-stone-100 transition-colors"
              >
                <X className="h-5 w-5 text-text-muted" />
              </button>
            </div>

            {/* Account Metadata Info */}
            <div className="mb-6 rounded-2xl bg-stone-50 p-4 border border-stone-100 flex items-center gap-3">
              <div className="h-10 w-10 bg-accent-soft text-accent rounded-xl flex items-center justify-center">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Nomor Terdaftar (WA)</p>
                <p className="text-[14px] font-bold text-text font-mono mt-0.5">{phone}</p>
              </div>
            </div>

            {/* Form Edit Workspace */}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Nama Dompet / Workspace
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newWorkspace}
                    onChange={e => setNewWorkspace(e.target.value)}
                    placeholder="Nama Dompet (contoh: Dompet Utama)"
                    maxLength={30}
                    className="w-full rounded-xl border border-border bg-white pl-4 pr-10 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
                    required
                  />
                  {newWorkspace.trim() === workspace && (
                    <div className="absolute right-3.5 top-3.5 text-accent">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-100 transition-colors"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  Keluar
                </button>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={saving || !newWorkspace.trim() || newWorkspace.trim() === workspace}
                  className="flex-1 rounded-xl bg-accent py-3 text-sm font-bold text-white hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
