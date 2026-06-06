'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'

const inp = { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, color:'#e8ecf0', fontSize:13, outline:'none', width:'100%' }

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
    const res = await fetch('/api/generate-email', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ lead: selected }) })
    const data = await res.json()
    if (data.subject) setSubject(data.subject)
    if (data.body) setBody(data.body)
    setGenerating(false)
  }

  async function saveDraft() {
    if (!selected || !body) return
    await supabase.from('outreach').insert({ lead_id:selected.id, type:'email', subject, message:body, status:'draft' })
    await supabase.from('leads').update({ status:'contacted' }).eq('id', selected.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{padding:'32px 36px', maxWidth:1300}}>
      <div style={{marginBottom:28}}>
        <h1 style={{fontSize:22,fontWeight:700,color:'#fff',letterSpacing:'-0.02em'}}>Outreach</h1>
        <p style={{fontSize:13,color:'#4A4F6A',marginTop:4}}>AI-generated personalised emails for each lead</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:18}}>
        {/* Lead List */}
        <div style={{background:'#0d0d18',border:'1px solid rgba(255,255,255,0.05)',borderRadius:14,overflow:'hidden'}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
            <div style={{fontSize:13,fontWeight:600,color:'#fff'}}>Select Lead</div>
          </div>
          <div style={{padding:8,maxHeight:600,overflowY:'auto'}}>
            {leads.map(lead => (
              <button key={lead.id} onClick={() => { setSelected(lead); setSubject(''); setBody('') }}
                style={{
                  width:'100%', textAlign:'left', padding:'10px 12px', borderRadius:10, marginBottom:4,
                  background: selected?.id === lead.id ? 'rgba(0,246,255,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${selected?.id === lead.id ? 'rgba(0,246,255,0.2)' : 'rgba(255,255,255,0.03)'}`,
                  cursor:'pointer', transition:'all 0.15s',
                }}>
                <div style={{fontSize:13,fontWeight:600,color:'#e8ecf0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{lead.full_name}</div>
                <div style={{fontSize:11,color:'#4A4F6A',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{lead.company} · {lead.country}</div>
                <div style={{display:'flex',gap:8,marginTop:6}}>
                  <span style={{fontSize:11,fontWeight:700,color:lead.score>=8?'#22d3a5':'#00F6FF'}}>{lead.score}/10</span>
                  {lead.email && <span style={{fontSize:11,color:'#22d3a5'}}>✓ email</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Composer */}
        <div style={{background:'#0d0d18',border:'1px solid rgba(255,255,255,0.05)',borderRadius:14,overflow:'hidden'}}>
          <div style={{padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontSize:13,fontWeight:600,color:'#fff'}}>Email Composer</div>
            <button onClick={generate} disabled={!selected||generating} style={{
              display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:8,border:'1px solid rgba(0,246,255,0.25)',
              background:'rgba(0,246,255,0.08)',color:'#00F6FF',fontSize:12,fontWeight:600,cursor:!selected||generating?'not-allowed':'pointer',opacity:!selected||generating?0.5:1,
            }}>
              {generating ? <>
                <span style={{display:'inline-block',width:11,height:11,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>Generating...
              </> : <>⚡ AI Generate</>}
            </button>
          </div>

          <div style={{padding:20}}>
            {selected ? (
              <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,background:'rgba(0,246,255,0.04)',border:'1px solid rgba(0,246,255,0.1)',marginBottom:16}}>
                <div style={{width:32,height:32,borderRadius:8,background:'rgba(0,246,255,0.12)',border:'1px solid rgba(0,246,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#00F6FF',flexShrink:0}}>
                  {(selected.first_name||'?')[0]}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:'#fff'}}>To: {selected.full_name}</div>
                  <div style={{fontSize:11,color:'#4A4F6A',marginTop:2}}>{selected.title} @ {selected.company} {selected.email ? '· '+selected.email : '· no email yet'}</div>
                </div>
              </div>
            ) : (
              <div style={{padding:'10px 14px',borderRadius:10,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.04)',marginBottom:16}}>
                <span style={{fontSize:13,color:'#4A4F6A'}}>← Select a lead to get started</span>
              </div>
            )}

            <input value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="Subject line..."
              style={{...inp, padding:'10px 14px', marginBottom:12}}
              onFocus={e=>e.target.style.borderColor='rgba(0,246,255,0.3)'}
              onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.06)'}
            />

            <textarea value={body} onChange={e => setBody(e.target.value)}
              placeholder={selected ? 'Click "AI Generate" to write a personalised email...' : 'Select a lead first...'}
              rows={14}
              style={{...inp, padding:'12px 14px', marginBottom:16, lineHeight:'1.7', resize:'none', display:'block'}}
              onFocus={e=>e.target.style.borderColor='rgba(0,246,255,0.3)'}
              onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.06)'}
            />

            <button onClick={saveDraft} disabled={!selected||!body} style={{
              width:'100%', padding:'12px 0', borderRadius:10, fontSize:13, fontWeight:600, cursor:!selected||!body?'not-allowed':'pointer',
              background: saved ? 'rgba(34,211,165,0.1)' : 'rgba(255,255,255,0.03)',
              color: saved ? '#22d3a5' : '#4A4F6A',
              border: `1px solid ${saved ? 'rgba(34,211,165,0.25)' : 'rgba(255,255,255,0.06)'}`,
              opacity: !selected||!body ? 0.4 : 1, transition:'all 0.2s',
            }}>
              {saved ? '✓ Saved as Draft' : 'Save as Draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Outreach() {
  return <Suspense fallback={<div style={{padding:32,color:'#fff'}}>Loading...</div>}><OutreachContent /></Suspense>
}
