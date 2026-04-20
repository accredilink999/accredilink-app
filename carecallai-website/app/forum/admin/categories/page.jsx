'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useForum } from '@/lib/forumContext'
import { isFounder as isFounderFn, slugify } from '@/lib/forumAuth'
import { FolderPlus, MessageSquare, Loader2, Edit, Trash2 } from 'lucide-react'

const iconOptions = [
  'MessageSquare', 'HelpCircle', 'Bug', 'Lightbulb', 'Coffee',
  'Shield', 'BookOpen', 'Heart', 'Star', 'Zap', 'Award',
  'Megaphone', 'FileText', 'Settings', 'Users', 'Globe',
]

const colorOptions = [
  { value: 'text-teal-500', label: 'Teal' },
  { value: 'text-blue-500', label: 'Blue' },
  { value: 'text-purple-500', label: 'Purple' },
  { value: 'text-amber-500', label: 'Amber' },
  { value: 'text-red-500', label: 'Red' },
  { value: 'text-green-500', label: 'Green' },
  { value: 'text-pink-500', label: 'Pink' },
  { value: 'text-orange-500', label: 'Orange' },
]

export default function AdminCategories() {
  const { user, profile, token } = useForum()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [newCatName, setNewCatName] = useState('')
  const [newCatDesc, setNewCatDesc] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('MessageSquare')
  const [newCatColor, setNewCatColor] = useState('text-teal-500')
  const [creatingCat, setCreatingCat] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [editCatName, setEditCatName] = useState('')
  const [editCatDesc, setEditCatDesc] = useState('')
  const [savingCat, setSavingCat] = useState(false)

  const isFounder = profile?.forum_role === 'founder' || isFounderFn(user?.id)

  useEffect(() => {
    if (token) fetchData()
  }, [token])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/forum/admin?token=${token}`)
      const data = await res.json()
      if (!data.error) setCategories(data.categories || [])
    } catch {} finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!newCatName.trim()) return
    setCreatingCat(true)
    try {
      const res = await fetch('/api/forum/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token, action: 'create-category',
          categoryData: {
            name: newCatName.trim(), description: newCatDesc.trim() || null,
            slug: slugify(newCatName.trim()), icon: newCatIcon, color: newCatColor,
            sort_order: categories.length + 1,
          },
        }),
      })
      const data = await res.json()
      if (data.success) { setNewCatName(''); setNewCatDesc(''); fetchData() }
      else alert(data.error || 'Failed to create category')
    } catch { alert('Failed to create category') }
    finally { setCreatingCat(false) }
  }

  const handleEdit = (cat) => {
    setEditingCat(cat.id)
    setEditCatName(cat.name)
    setEditCatDesc(cat.description || '')
  }

  const handleSave = async (catId) => {
    setSavingCat(true)
    try {
      const res = await fetch('/api/forum/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'update-category', categoryId: catId, categoryData: { name: editCatName, description: editCatDesc } }),
      })
      const data = await res.json()
      if (data.success) { setEditingCat(null); fetchData() }
      else alert(data.error || 'Failed to save')
    } catch { alert('Failed to save category') }
    finally { setSavingCat(false) }
  }

  const handleDelete = async (catId, catName) => {
    if (!confirm(`Delete category "${catName}"? All threads in this category will also be deleted. This cannot be undone.`)) return
    try {
      const res = await fetch('/api/forum/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'delete-category', categoryId: catId }),
      })
      const data = await res.json()
      if (data.success) fetchData()
      else alert(data.error || 'Failed to delete')
    } catch { alert('Failed to delete category') }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-teal-400 animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      {/* Create new category */}
      <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 p-5">
        <div className="flex items-center gap-3 mb-4">
          <FolderPlus className="w-5 h-5 text-teal-400" />
          <h2 className="font-semibold text-white text-lg">Create New Category</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Category name..." className="w-full px-3 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
          </div>
          <select value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)} className="px-3 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30">
            {iconOptions.map(icon => <option key={icon} value={icon} className="bg-slate-800">{icon}</option>)}
          </select>
          <select value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} className="px-3 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30">
            {colorOptions.map(c => <option key={c.value} value={c.value} className="bg-slate-800">{c.label}</option>)}
          </select>
        </div>
        <input type="text" value={newCatDesc} onChange={(e) => setNewCatDesc(e.target.value)} placeholder="Category description (optional)..." className="w-full mt-3 px-3 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
        <button onClick={handleCreate} disabled={creatingCat || !newCatName.trim()} className="mt-3 flex items-center gap-1.5 text-sm px-4 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-sm">
          {creatingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
          Create Category
        </button>
      </div>

      {/* Existing categories */}
      <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <h2 className="font-semibold text-sm text-white">Existing Categories ({categories.length})</h2>
        </div>
        <div className="divide-y divide-white/5">
          {categories.map(cat => (
            <div key={cat.id} className="px-4 py-3 hover:bg-white/[0.03]">
              {editingCat === cat.id ? (
                <div className="space-y-2">
                  <input value={editCatName} onChange={(e) => setEditCatName(e.target.value)} className="w-full px-3 py-2 bg-white/[0.06] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30" placeholder="Category name" />
                  <input value={editCatDesc} onChange={(e) => setEditCatDesc(e.target.value)} className="w-full px-3 py-2 bg-white/[0.06] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30" placeholder="Description" />
                  <div className="flex gap-2">
                    <button onClick={() => handleSave(cat.id)} disabled={savingCat} className="text-xs px-3 py-1.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50">{savingCat ? 'Saving...' : 'Save'}</button>
                    <button onClick={() => setEditingCat(null)} className="text-xs px-3 py-1.5 text-slate-400 hover:text-white">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center ${cat.color || 'text-teal-400'}`}>
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{cat.name}</p>
                      <p className="text-[11px] text-slate-400">{cat.description || 'No description'} &middot; {cat.thread_count || 0} threads</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 hidden sm:inline">/{cat.slug}</span>
                    <button onClick={() => handleEdit(cat)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 rounded-lg transition-colors font-medium border border-teal-500/30">
                      <Edit className="w-3 h-3" /> Edit
                    </button>
                    {isFounder && (
                      <button onClick={() => handleDelete(cat.id, cat.name)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-lg transition-colors font-medium border border-red-500/30">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
