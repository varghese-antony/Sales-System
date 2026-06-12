'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const STAGES = [
  { key: 'new',          label: 'New',          color: '#7C6AF7', desc: 'Just found' },
  { key: 'contacted',    label: 'Contacted',    color: '#4F9EF8', desc: 'Email sent' },
  { key: 'interested',   label: 'Interested',   color: '#fb923c', desc: 'Replied positively' },
  { key: 'proposal',     label: 'Proposal',     color: '#00F6FF', desc: 'Sent proposal' },
  { key: 'client',       label: 'Client',       color: '#22d3a5', desc: 'Deal closed 🎉' },
  { key: 'unsubscribed', label: 'Unsubscribed', color: '#4A4F6A', desc: 'Opted out' },
]

const COUNTRY_FLAGS = {
  'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'Australia': '🇦🇺',
  'UAE': '🇦🇪', 'Canada': '🇨🇦', 'India': '🇮🇳', 'Germany': '🇩🇪',
  'France': '🇫🇷', 'Singapore': '🇸🇬', 'Netherlands': '🇳🇱',
}

function SeqBadge({ sequence }) {
  if (!sequence) return null
  if (sequence.replied) return <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#22d3a520', color: '#22d3a5' }}>Replied</span>
  if (sequence.complete) return <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#4A4F6A20', color: '#4A4F6A' }}>Done</span>
  return (
    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#4F9EF820', color: '#4F9EF8' }}>
      Step {sequence.step}/3
    </span>
  )
}

export default function Pipeline() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [moving, setMoving] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/pipeline')
      .then(r => r.json())
      .then(d => { setLeads(d.leads || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function moveStage(lead, newStatus) {
    setMoving(lead.id)
    try {
      await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, status: newStatus }),
      })
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: newStatus } : l))
    } finally {
      setMoving(null)
    }
  }

  const filtered = search
    ? leads.filter(l => (l.full_name + l.company + l.email).toLowerCase().includes(search.toLowerCase()))
    : leads

  const stageLeads = key => filtered.filter(l => l.status === key)

  // Totals for header bar
  const total = leads.length
  const contacted = leads.filter(l => l.status === 'contacted').length
  const interested = leads.filter(l => l.status === 'interested').length
  const clients = leads.filter(l => l.status === 'client').length

  return (
    <div style={{ padding: '32px 36px', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Pipeline</h1>
          <p style={{ fontSize: 13, color: '#4A4F6A', marginTop: 4 }}>Track every lead through your sales stages</p>
        </div>
        <input
          placeholder="Search leads…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#0d0d18', color: '#fff', fontSize: 13, width: 200 }}
        />
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total leads', value: total, color: '#7C6AF7' },
          { label: 'Contacted', value: contacted, color: '#4F9EF8' },
          { label: 'Interested', value: interested, color: '#fb923c' },
          { label: 'Clients', value: clients, color: '#22d3a5' },
          { label: 'Conv. rate', value: total ? `${Math.round(interested / total * 100)}%` : '0%', color: '#00F6FF' },
        ].map(stat => (
          <div key={stat.label} style={{ flex: 1, padding: '14px 16px', borderRadius: 12, background: '#0d0d18', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 11, color: '#4A4F6A', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 16 }}>
        {STAGES.map(stage => {
          const sl = stageLeads(stage.key)
          return (
            <div key={stage.key} style={{ flexShrink: 0, width: 240, borderRadius: 14, overflow: 'hidden', background: '#0d0d18', border: '1px solid rgba(255,255,255,0.05)' }}>

              {/* Column header */}
              <div style={{ padding: '14px 16px', borderBottom: `2px solid ${stage.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{stage.label}</div>
                    <div style={{ fontSize: 11, color: '#4A4F6A', marginTop: 2 }}>{stage.desc}</div>
                  </div>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${stage.color}20`, color: stage.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                    {sl.length}
                  </div>
                </div>
              </div>

              {/* Cards */}
              <div style={{ padding: 10, minHeight: 200, maxHeight: 600, overflowY: 'auto' }}>
                {loading ? (
                  <div style={{ height: 60, borderRadius: 10, background: '#111120', animation: 'pulse 1.5s infinite' }} />
                ) : sl.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '28px 0', fontSize: 12, color: '#2a2d4a' }}>Empty</div>
                ) : sl.map(lead => (
                  <div
                    key={lead.id}
                    style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 8, opacity: moving === lead.id ? 0.5 : 1 }}
                  >
                    {/* Name + flag */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                      <span style={{ fontSize: 14 }}>{COUNTRY_FLAGS[lead.country] || '🌐'}</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e8ecf0', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.full_name}
                      </div>
                    </div>

                    {/* Company */}
                    <div style={{ fontSize: 11, color: '#4A4F6A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
                      {lead.company}
                    </div>

                    {/* Score + email + seq badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {lead.score != null && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: lead.score >= 8 ? '#22d3a5' : '#4F9EF8' }}>
                          {lead.score}/10
                        </span>
                      )}
                      {lead.email && <span style={{ fontSize: 11, color: '#22d3a5' }}>✓ email</span>}
                      <SeqBadge sequence={lead.sequence} />
                    </div>

                    {/* Stage move buttons */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                      {STAGES.filter(s => s.key !== stage.key && s.key !== 'unsubscribed').slice(0, 2).map(s => (
                        <button
                          key={s.key}
                          onClick={() => moveStage(lead, s.key)}
                          disabled={moving === lead.id}
                          style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: `${s.color}18`, color: s.color, border: 'none', cursor: 'pointer' }}
                        >
                          → {s.label}
                        </button>
                      ))}
                      {stage.key === 'interested' && (
                        <Link
                          href="/smart-outreach"
                          style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: '#22d3a520', color: '#22d3a5', textDecoration: 'none', display: 'inline-block' }}
                        >
                          ✉ Outreach
                        </Link>
                      )}
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
