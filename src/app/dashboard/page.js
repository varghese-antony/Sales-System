'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const StatCard = ({ label, value, icon, accent, loading }) => (
  <div className="rounded-2xl p-5 animate-in" style={{ background: '#0F0F1A', border: '1px solid rgba(255,255,255,0.05)' }}>
    <div className="flex items-center justify-between mb-4">
      <span className="text-xs font-medium uppercase tracking-widest" style={{ color: '#4A5568' }}>{label}</span>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent + '18' }}>
        <span style={{ color: accent, fontSize: 16 }}>{icon}</span>
      </div>
    </div>
    <p className="text-3xl font-bold text-white">{loading ? '—' : value}</p>
    <div className="mt-3 h-0.5 rounded-full" style={{ background: accent + '30' }}>
      <div className="h-full rounded-full" style={{ background: accent, width: loading ? '0%' : '100%', transition: 'width 0.8s ease' }}/>
    </div>
  </div>
)

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, interested: 0, clients: 0 })
  const [topLeads, setTopLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('leads').select('*').order('score', { ascending: false })
      if (data) {
        setStats({
          total: data.length,
          new: data.filter(l => l.status === 'new').length,
          contacted: data.filter(l => l.status === 'contacted').length,
          interested: data.filter(l => l.status === 'interested').length,
          clients: data.filter(l => l.status === 'client').length,
        })
        setTopLeads(data.slice(0, 6))
      }
      setLoading(false)
    }
    load()
  }, [])

  const scoreColor = s => s >= 8 ? '#48BB78' : s >= 6 ? '#C9A84C' : '#718096'

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-in">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full pulse" style={{ background: '#48BB78' }}/>
          <span className="text-xs" style={{ color: '#4A5568' }}>System Active</span>
        </div>
        <h1 className="text-2xl font-semibold text-white">Good day, Varghese</h1>
        <p className="mt-1 text-sm" style={{ color: '#4A5568' }}>Here's your sales intelligence overview for today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Leads" value={stats.total} icon="◎" accent="#C9A84C" loading={loading}/>
        <StatCard label="New" value={stats.new} icon="✦" accent="#7C6AF7" loading={loading}/>
        <StatCard label="Contacted" value={stats.contacted} icon="→" accent="#4F9EF8" loading={loading}/>
        <StatCard label="Interested" value={stats.interested} icon="◈" accent="#F6AD55" loading={loading}/>
        <StatCard label="Clients" value={stats.clients} icon="◉" accent="#48BB78" loading={loading}/>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Top Leads */}
        <div className="col-span-2 rounded-2xl p-6 animate-in" style={{ background: '#0F0F1A', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-white">Priority Leads</h2>
              <p className="text-xs mt-0.5" style={{ color: '#4A5568' }}>Ranked by AI score — contact these first</p>
            </div>
            <Link href="/leads" className="text-xs font-medium transition-colors"
              style={{ color: '#C9A84C' }}>View all →</Link>
          </div>

          <div className="space-y-2">
            {loading ? (
              [1,2,3,4].map(i => (
                <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: '#161625' }}/>
              ))
            ) : topLeads.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm mb-3" style={{ color: '#4A5568' }}>No leads yet.</p>
                <Link href="/leads" className="text-sm font-medium px-4 py-2 rounded-lg"
                  style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C' }}>
                  Find your first leads →
                </Link>
              </div>
            ) : topLeads.map((lead, i) => (
              <div key={lead.id} className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #C9A84C, #F0C96B)' }}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{lead.full_name}</p>
                  <p className="text-xs truncate" style={{ color: '#4A5568' }}>{lead.title} · {lead.company}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {lead.email && (
                    <span className="text-xs" style={{ color: '#48BB78' }}>✓ email</span>
                  )}
                  <div className="text-right">
                    <span className="text-sm font-bold" style={{ color: scoreColor(lead.score) }}>{lead.score}</span>
                    <span className="text-xs" style={{ color: '#4A5568' }}>/10</span>
                  </div>
                  <div className="px-2 py-0.5 rounded-full text-xs" style={{
                    background: lead.status === 'new' ? 'rgba(124,106,247,0.15)' : 'rgba(72,187,120,0.15)',
                    color: lead.status === 'new' ? '#7C6AF7' : '#48BB78'
                  }}>{lead.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="rounded-2xl p-5 animate-in" style={{ background: '#0F0F1A', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 className="text-sm font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/leads?action=find" className="flex items-center gap-3 p-3 rounded-xl w-full transition-all duration-200"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
                <span style={{ color: '#C9A84C' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <span className="text-sm font-medium" style={{ color: '#C9A84C' }}>Find New Leads</span>
              </Link>
              <Link href="/outreach" className="flex items-center gap-3 p-3 rounded-xl w-full transition-all"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: '#718096' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <span className="text-sm font-medium" style={{ color: '#718096' }}>Write Outreach Email</span>
              </Link>
              <Link href="/pipeline" className="flex items-center gap-3 p-3 rounded-xl w-full transition-all"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: '#718096' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                </span>
                <span className="text-sm font-medium" style={{ color: '#718096' }}>View Pipeline</span>
              </Link>
            </div>
          </div>

          {/* Monthly Target */}
          <div className="rounded-2xl p-5 animate-in" style={{ background: '#0F0F1A', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 className="text-sm font-semibold text-white mb-4">June Target</h2>
            <div className="space-y-3">
              {[
                { label: 'Leads Found', current: stats.total, target: 50, color: '#C9A84C' },
                { label: 'Emails Sent', current: stats.contacted, target: 20, color: '#4F9EF8' },
                { label: 'Clients Won', current: stats.clients, target: 3, color: '#48BB78' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs" style={{ color: '#4A5568' }}>{item.label}</span>
                    <span className="text-xs font-medium text-white">{item.current}/{item.target}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ background: item.color, width: Math.min((item.current / item.target) * 100, 100) + '%' }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
