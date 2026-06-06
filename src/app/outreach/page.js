'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'

function OutreachContent() {
  const searchParams = useSearchParams()
  const leadId = searchParams.get('lead')
  const [leads, setLeads] = useState([])
  const [selected, setSelected] = useState(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('leads').select('*').order('score', { ascending: false }).then(({ data }) => {
      setLeads(data || [])
      if (leadId && data) setSelected(data.find(l => l.id === leadId) || null)
    })
  }, [leadId])

  async function generate() {
    if (!selected) return
    setGenerating(true)
    const res = await fetch('/api/generate-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lead: selected }) })
    const data = await res.json()
    if (data.subject) setSubject(data.subject)
    if (data.body) setBody(data.body)
    setGenerating(false)
  }

  async function saveDraft() {
    if (!selected || !body) return
    await supabase.from('outreach').insert({ lead_id: selected.id, type: 'email', subject, message: body, status: 'draft' })
    await supabase.from('leads').update({ status: 'contacted' }).eq('id', selected.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 animate-in">
        <h1 className="text-2xl font-semibold text-white">Outreach</h1>
        <p className="text-sm mt-1" style={{ color: '#4A5568' }}>AI-generated personalised emails for each lead</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Lead List */}
        <div className="rounded-2xl overflow-hidden animate-in" style={{ background: '#0F0F1A', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <h2 className="text-sm font-semibold text-white">Select Lead</h2>
          </div>
          <div className="p-2 space-y-1 max-h-[600px] overflow-y-auto">
            {leads.map(lead => (
              <button key={lead.id} onClick={() => { setSelected(lead); setSubject(''); setBody('') }}
                className="w-full text-left px-4 py-3 rounded-xl transition-all duration-150"
                style={{
                  background: selected?.id === lead.id ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${selected?.id === lead.id ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.03)'}`,
                }}>
                <p className="text-sm font-medium text-white truncate">{lead.full_name}</p>
                <p className="text-xs truncate mt-0.5" style={{ color: '#4A5568' }}>{lead.company} · {lead.country}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-bold" style={{ color: lead.score >= 8 ? '#48BB78' : '#C9A84C' }}>{lead.score}/10</span>
                  {lead.email && <span className="text-xs" style={{ color: '#48BB78' }}>✓ email</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Composer */}
        <div className="col-span-2 rounded-2xl animate-in" style={{ background: '#0F0F1A', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <h2 className="text-sm font-semibold text-white">Email Composer</h2>
            <button onClick={generate} disabled={!selected || generating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #F0C96B)', color: '#000' }}>
              {generating ? (
                <><svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Generating...</>
              ) : (
                <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> AI Generate</>
              )}
            </button>
          </div>

          <div className="p-6">
            {selected ? (
              <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #C9A84C, #F0C96B)' }}>
                  {(selected.first_name || 'X')[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">To: {selected.full_name}</p>
                  <p className="text-xs" style={{ color: '#4A5568' }}>{selected.title} @ {selected.company} {selected.email ? '· ' + selected.email : '· no email yet'}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <p className="text-sm" style={{ color: '#4A5568' }}>← Select a lead to get started</p>
              </div>
            )}

            <input value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="Subject line..."
              className="w-full px-4 py-3 rounded-xl text-sm text-white mb-3 focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
            />

            <textarea value={body} onChange={e => setBody(e.target.value)}
              placeholder={selected ? 'Click "AI Generate" to write a personalised email based on this lead\'s profile...' : 'Select a lead first...'}
              rows={14}
              className="w-full px-4 py-3 rounded-xl text-sm text-white mb-4 focus:outline-none transition-all resize-none"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', lineHeight: '1.7' }}
              onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
            />

            <button onClick={saveDraft} disabled={!selected || !body}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
              style={{ background: saved ? 'rgba(72,187,120,0.15)' : 'rgba(255,255,255,0.04)', color: saved ? '#48BB78' : '#718096', border: `1px solid ${saved ? 'rgba(72,187,120,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
              {saved ? '✓ Saved as Draft' : 'Save as Draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Outreach() {
  return <Suspense fallback={<div className="p-8 text-white">Loading...</div>}><OutreachContent /></Suspense>
}
