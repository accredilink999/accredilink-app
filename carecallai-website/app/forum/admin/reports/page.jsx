'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useForum } from '@/lib/forumContext'
import { timeAgo } from '@/lib/forumAuth'
import { Flag, AlertTriangle, Eye, Trash2, Loader2 } from 'lucide-react'

export default function AdminReports() {
  const { token } = useForum()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('pending')
  const [loaded, setLoaded] = useState(false)

  const fetchReports = async (status = 'pending') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/forum/reports?token=${token}&status=${status}`)
      const data = await res.json()
      setReports(data.reports || [])
      setLoaded(true)
    } catch {} finally { setLoading(false) }
  }

  const handleResolve = async (reportId, action) => {
    try {
      await fetch('/api/forum/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reportId, action }),
      })
      fetchReports(filter)
    } catch { alert('Failed to resolve report') }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Flag className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-white text-lg">Content Reports</h2>
          </div>
          <div className="flex gap-1">
            {['pending', 'resolved', 'all'].map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); fetchReports(f) }}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${filter === f && loaded ? 'bg-teal-500/20 text-teal-300 font-medium' : 'text-slate-400 hover:bg-white/[0.06]'}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {!loaded && !loading && (
          <button onClick={() => fetchReports(filter)} className="w-full py-3 text-sm text-teal-400 hover:text-teal-300 font-medium">
            Load Reports
          </button>
        )}

        {loading && (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-teal-400 animate-spin" /></div>
        )}

        {reports.length > 0 && (
          <div className="space-y-3">
            {reports.map(report => (
              <div key={report.id} className="bg-white/[0.04] rounded-xl border border-white/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-amber-300">{report.reason}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${report.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">Reported by: {report.reporter_name} &middot; {timeAgo(report.created_at)}</p>
                    {report.details && <p className="text-xs text-slate-300 mb-2 italic">&quot;{report.details}&quot;</p>}
                    {report.content_preview && (
                      <div className="text-xs text-slate-400 bg-white/[0.04] rounded-lg p-3 border border-white/5">
                        <Eye className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                        {report.content_preview}
                      </div>
                    )}
                  </div>
                  {report.status === 'pending' && (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => handleResolve(report.id, 'dismiss')} className="text-xs px-3 py-1.5 bg-slate-500/20 text-slate-300 rounded-lg hover:bg-slate-500/30 transition-colors">
                        Dismiss
                      </button>
                      <button onClick={() => handleResolve(report.id, 'delete-content')} className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Delete Content
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {loaded && reports.length === 0 && !loading && (
          <p className="text-center text-sm text-slate-400 py-4">No {filter === 'all' ? '' : filter} reports</p>
        )}
      </div>
    </div>
  )
}
