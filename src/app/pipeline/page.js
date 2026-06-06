'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const STAGES = [
  { key: 'new',        label: 'New',        color: '#7C6AF7', desc: 'Just found' },
  { key: 'contacted',  label: 'Contacted',  color: '#4F9EF8', desc: 'Email sent' },
  { key: 'interested', label: 'Interested', color: '#F6AD55', desc: 'Replied positively' },
  { key: 'proposal',   label: 'Proposal',   color: '#C9A84C', desc: 'Sent proposal' },
  { key: 'client',     label: 'Client',     color: '#48BB78', desc: 'Deal closed 🎉' },
]

export default function Pipeline() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('leads').select('*').then(({ data }) => { setLeads(data || []); setLoading(false) })
  }, [])

  async function moveStage(lead, stage) {
    await supabase.from('leads').update({ status: stage }).eq('id', lead.id)
    setLeads(leads.map(l => l.id === lead.id ? { ...l, status: stage } : l))
  }

  const stageLeads = key => leads.filter(l => l.status === key)

  return (
    <div className="p-8">
      <div className="mb-8 animate-in">
        <h1 className="text-2xl font-semibold text-white">Pipeline</h1>
        <p className="text-sm mt-1" style={{ color: '#4A5568' }}>Track every lead through your sales stages</p>
      </div>

      {/* Summary bar */}
      <div className="flex gap-3 mb-6 animate-in">
        {STAGES.map(stage => (
          <div key={stage.key} className="flex-1 px-4 py-3 rounded-xl" style={{ background: '#0F0F1A', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-xs mb-1" style={{ color: '#4A5568' }}>{stage.label}</p>
            <p className="text-xl font-bold" style={{ color: stage.color }}>{stageLeads(stage.key).length}</p>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 animate-in">
        {STAGES.map(stage => {
          const stageleads = stageLeads(stage.key)
          return (
            <div key={stage.key} className="flex-shrink-0 w-64 rounded-2xl overflow-hidden"
              style={{ background: '#0F0F1A', border: '1px solid rgba(255,255,255,0.05)' }}>

              {/* Column Header */}
              <div className="px-4 py-4" style={{ borderBottom: '2px solid ' + stage.color }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{stage.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#4A5568' }}>{stage.desc}</p>
                  </div>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: stage.color + '20', color: stage.color }}>
                    {stageleads.length}
                  </div>
                </div>
              </div>

              {/* Cards */}
              <div className="p-3 space-y-2 min-h-[200px]">
                {loading ? (
                  <div className="h-16 rounded-xl animate-pulse" style={{ background: '#161625' }}/>
                ) : stageleads.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs" style={{ color: '#2D3748' }}>No leads here</p>
                  </div>
                ) : stageleads.map(lead => (
                  <div key={lead.id} className="p-3 rounded-xl transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-sm font-medium text-white leading-tight">{lead.full_name}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: '#4A5568' }}>{lead.company}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-bold" style={{ color: lead.score >= 8 ? '#48BB78' : '#C9A84C' }}>{lead.score}/10</span>
                      {lead.email && <span className="text-xs" style={{ color: '#48BB78' }}>✓</span>}
                    </div>
                    {/* Move buttons */}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {STAGES.filter(s => s.key !== stage.key).slice(0, 2).map(s => (
                        <button key={s.key} onClick={() => moveStage(lead, s.key)}
                          className="text-xs px-2 py-0.5 rounded-md transition-all"
                          style={{ background: s.color + '15', color: s.color }}>
                          → {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
