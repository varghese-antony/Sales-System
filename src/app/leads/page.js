'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const STATUS_STYLES = {
  new:          { bg: 'rgba(124,106,247,0.12)', color: '#7C6AF7' },
  contacted:    { bg: 'rgba(79,158,248,0.12)',  color: '#4F9EF8' },
  replied:      { bg: 'rgba(246,173,85,0.12)',  color: '#F6AD55' },
  interested:   { bg: 'rgba(72,187,120,0.12)',  color: '#48BB78' },
  not_interested:{ bg: 'rgba(252,129,74,0.12)', color: '#FC814A' },
  client:       { bg: 'rgba(201,168,76,0.15)',  color: '#C9A84C' },
}

const scoreColor = s => s >= 8 ? '#48BB78' : s >= 6 ? '#C9A84C' : '#718096'

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [finding, setFinding] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState(null)

  useEffect(() => { loadLeads() }, [])

  async function loadLeads() {
    setLoading(true)
    const { data } = await supabase.from('leads').select('*').order('score', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }

  async function findLeads() {
    setFinding(true)
    setMessage({ type: 'info', text: 'Scanning Apollo, Hunter & LinkedIn for ideal clients...' })
    const res = await fetch('/api/find-leads', { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      setMessage({ type: 'success', text: `✓ ${data.count} new leads added to your database` })
      await loadLeads()
    } else {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' })
    }
    setFinding(false)
    setTimeout(() => setMessage(null), 5000)
  }

  async function updateStatus(id, status) {
    await supabase.from('leads').update({ status }).eq('id', id)
    setLeads(leads.map(l => l.id === id ? { ...l, status } : l))
  }

  const filtered = leads.filter(l => {
    const matchFilter = filter === 'all' || l.status === filter
    const matchSearch = !search ||
      (l.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.company || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.country || '').toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-in">
        <div>
          <h1 className="text-2xl font-semibold text-white">Leads</h1>
          <p className="text-sm mt-1" style={{ color: '#4A5568' }}>{leads.length} leads in your database</p>
        </div>
        <button onClick={findLeads} disabled={finding}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
          style={{ background: finding ? 'rgba(201,168,76,0.1)' : 'linear-gradient(135deg, #C9A84C, #F0C96B)', color: finding ? '#C9A84C' : '#000', border: finding ? '1px solid rgba(201,168,76,0.3)' : 'none' }}>
          {finding ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Searching...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Find New Leads
            </>
          )}
        </button>
      </div>

      {/* Message Banner */}
      {message && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm animate-in"
          style={{
            background: message.type === 'success' ? 'rgba(72,187,120,0.08)' : message.type === 'error' ? 'rgba(252,129,74,0.08)' : 'rgba(201,168,76,0.08)',
            border: `1px solid ${message.type === 'success' ? 'rgba(72,187,120,0.2)' : message.type === 'error' ? 'rgba(252,129,74,0.2)' : 'rgba(201,168,76,0.2)'}`,
            color: message.type === 'success' ? '#48BB78' : message.type === 'error' ? '#FC814A' : '#C9A84C',
          }}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6 animate-in">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A5568" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, company or country..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white focus:outline-none transition-all"
            style={{ background: '#0F0F1A', border: '1px solid rgba(255,255,255,0.05)', color: '#E2E8F0' }}
            onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.05)'}
          />
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#0F0F1A', border: '1px solid rgba(255,255,255,0.05)' }}>
          {['all','new','contacted','interested','client'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
              style={{ background: filter === s ? 'rgba(201,168,76,0.15)' : 'transparent', color: filter === s ? '#C9A84C' : '#4A5568' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden animate-in" style={{ background: '#0F0F1A', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="grid text-xs font-medium uppercase tracking-widest px-5 py-3"
          style={{ gridTemplateColumns: '2fr 1.5fr 1.5fr 80px 100px 80px', color: '#2D3748', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span>Person</span><span>Company</span><span>Email</span><span>Score</span><span>Status</span><span>Action</span>
        </div>

        {loading ? (
          [1,2,3,4,5].map(i => (
            <div key={i} className="h-14 animate-pulse mx-5 my-2 rounded-lg" style={{ background: '#161625' }}/>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: '#4A5568' }}>No leads found. Click "Find New Leads" to get started.</p>
          </div>
        ) : filtered.map((lead, i) => (
          <div key={lead.id}
            className="grid items-center px-5 py-3.5 transition-all duration-150"
            style={{
              gridTemplateColumns: '2fr 1.5fr 1.5fr 80px 100px 80px',
              borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
            }}>
            <div className="min-w-0 pr-3">
              <p className="text-sm font-medium text-white truncate">{lead.full_name}</p>
              <p className="text-xs truncate mt-0.5" style={{ color: '#4A5568' }}>{lead.title}</p>
            </div>
            <div className="min-w-0 pr-3">
              <p className="text-sm text-white truncate">{lead.company}</p>
              <p className="text-xs truncate mt-0.5" style={{ color: '#4A5568' }}>{lead.country}</p>
            </div>
            <div className="min-w-0 pr-3">
              {lead.email ? (
                <div>
                  <p className="text-xs truncate" style={{ color: '#4F9EF8' }}>{lead.email}</p>
                  {lead.email_verified && <p className="text-xs mt-0.5" style={{ color: '#48BB78' }}>✓ verified</p>}
                </div>
              ) : (
                <span className="text-xs" style={{ color: '#2D3748' }}>—</span>
              )}
            </div>
            <div>
              <span className="text-sm font-bold" style={{ color: scoreColor(lead.score) }}>{lead.score}</span>
              <span className="text-xs" style={{ color: '#2D3748' }}>/10</span>
            </div>
            <div>
              <select value={lead.status} onChange={e => updateStatus(lead.id, e.target.value)}
                className="text-xs px-2 py-1 rounded-lg cursor-pointer border-0 focus:outline-none"
                style={{ background: STATUS_STYLES[lead.status]?.bg || 'rgba(255,255,255,0.05)', color: STATUS_STYLES[lead.status]?.color || '#718096' }}>
                {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Link href={`/outreach?lead=${lead.id}`}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>
                Email
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
