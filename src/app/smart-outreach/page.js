'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const statusStyle = {
  new:           { bg:'rgba(167,139,250,0.1)', color:'#a78bfa' },
  contacted:     { bg:'rgba(96,165,250,0.1)',  color:'#60a5fa' },
  interested:    { bg:'rgba(34,211,165,0.1)',  color:'#22d3a5' },
  not_interested:{ bg:'rgba(248,113,113,0.1)', color:'#f87171' },
  client:        { bg:'rgba(0,246,255,0.1)',   color:'#00F6FF' },
}

export default function SmartOutreach() {
  const [leads, setLeads]         = useState([])
  const [selected, setSelected]   = useState(null)
  const [research, setResearch]   = useState('')
  const [subject, setSubject]     = useState('')
  const [body, setBody]           = useState('')
  const [loading, setLoading]     = useState(true)
  const [working, setWorking]     = useState(false)
  const [saved, setSaved]         = useState(false)
  const [copiedSubject, setCopiedSubject] = useState(false)
  const [copiedBody, setCopiedBody]       = useState(false)
  const [tab, setTab]             = useState('email') // 'email' | 'research'

  useEffect(() => {
    supabase.from('leads')
      .select('*')
      .order('score', { ascending: false })
      .then(({ data }) => { setLeads(data || []); setLoading(false) })
  }, [])

  async function selectLead(lead) {
    setSelected(lead)
    setResearch('')
    setSubject('')
    setBody('')
    setSaved(false)
    setTab('email')
    // If research already done (saved in notes), load it
    if (lead.notes && lead.notes.startsWith('COMPANY:')) {
      setResearch(lead.notes)
    }
  }

  async function runResearch() {
    if (!selected) return
    setWorking(true)
    setResearch('')
    setSubject('')
    setBody('')
    try {
      const res = await fetch('/api/research-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead: selected }),
      })
      const data = await res.json()
      if (data.success) {
        setResearch(data.research)
        setSubject(data.subject)
        setBody(data.body)
        // Update local lead notes
        setLeads(leads.map(l => l.id === selected.id ? { ...l, notes: data.research } : l))
      }
    } catch (e) { console.error(e) }
    setWorking(false)
  }

  async function saveDraft() {
    if (!selected || !body) return
    await supabase.from('outreach').insert({
      lead_id: selected.id,
      type: 'email',
      subject,
      message: body,
      status: 'draft',
    })
    await supabase.from('leads').update({ status: 'contacted' }).eq('id', selected.id)
    setLeads(leads.map(l => l.id === selected.id ? { ...l, status: 'contacted' } : l))
    setSelected(prev => ({ ...prev, status: 'contacted' }))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function copy(text, which) {
    navigator.clipboard.writeText(text)
    if (which === 'subject') { setCopiedSubject(true); setTimeout(() => setCopiedSubject(false), 2000) }
    else { setCopiedBody(true); setTimeout(() => setCopiedBody(false), 2000) }
  }

  const hasResearch = research || (selected?.notes?.startsWith('COMPANY:'))
  const displayResearch = research || selected?.notes || ''

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>

      {/* LEFT — Lead list */}
      <div style={{ width:280, flexShrink:0, background:'#0a0a14', borderRight:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'20px 16px 14px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize:16, fontWeight:700, color:'#fff' }}>Smart Outreach</div>
          <div style={{ fontSize:11, color:'rgba(0,246,255,0.4)', marginTop:3 }}>AI-researched · Personalised emails</div>
        </div>
        <div style={{ padding:'8px 8px', flex:1, overflowY:'auto' }}>
          <div style={{ fontSize:10, fontWeight:600, color:'#2a2d4a', letterSpacing:'0.1em', textTransform:'uppercase', padding:'4px 8px 8px' }}>
            {leads.filter(l=>l.email).length} email · {leads.filter(l=>!l.email&&l.linkedin_url).length} linkedin
          </div>
          {loading ? [1,2,3,4].map(i => <div key={i} style={{ height:64, borderRadius:10, background:'#111120', marginBottom:6 }}/>) :
          leads.map(lead => {
            const active = selected?.id === lead.id
            const researched = lead.notes?.startsWith('COMPANY:')
            const hasEmail = !!lead.email
            return (
              <div key={lead.id} onClick={() => selectLead(lead)} style={{
                padding:'10px 12px', borderRadius:10, marginBottom:4, cursor:'pointer', transition:'all 0.15s',
                background: active ? 'rgba(0,246,255,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${active ? 'rgba(0,246,255,0.2)' : 'rgba(255,255,255,0.03)'}`,
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#e8ecf0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:150 }}>{lead.full_name}</div>
                  <div style={{display:'flex',gap:3,flexShrink:0}}>
                    {researched && <span style={{ fontSize:9, padding:'2px 5px', borderRadius:4, background:'rgba(34,211,165,0.12)', color:'#22d3a5', fontWeight:700 }}>✓</span>}
                    {!hasEmail && <span style={{ fontSize:9, padding:'2px 5px', borderRadius:4, background:'rgba(10,102,194,0.2)', color:'#4a9eff', fontWeight:700 }}>in</span>}
                  </div>
                </div>
                <div style={{ fontSize:11, color:'#4A4F6A', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lead.company}</div>
                <div style={{ display:'flex', gap:6, marginTop:5, alignItems:'center' }}>
                  <span style={{ fontSize:10, fontWeight:700, color: lead.score>=8?'#22d3a5':'#00F6FF' }}>{lead.score}/10</span>
                  <span style={{ fontSize:10, padding:'1px 6px', borderRadius:99, background:statusStyle[lead.status]?.bg||'rgba(255,255,255,0.05)', color:statusStyle[lead.status]?.color||'#4A4F6A' }}>{lead.status}</span>
                  {hasEmail ? <span style={{fontSize:10,color:'#22d3a5'}}>✓ email</span> : <span style={{fontSize:10,color:'#4a9eff'}}>LinkedIn only</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT — Research + Email */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#080810' }}>
        {!selected ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
            <div style={{ fontSize:32 }}>🎯</div>
            <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>Select a lead to get started</div>
            <div style={{ fontSize:12, color:'#4A4F6A', textAlign:'center', maxWidth:280 }}>
              Click any lead on the left. Claude will research their company and write a personalised email just for them.
            </div>
          </div>
        ) : (
          <>
            {/* Top bar */}
            <div style={{ padding:'16px 24px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'rgba(0,246,255,0.1)', border:'1px solid rgba(0,246,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#00F6FF' }}>
                  {(selected.first_name||selected.full_name||'?')[0]}
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{selected.full_name}</div>
                  <div style={{ fontSize:11, color:'#4A4F6A', marginTop:1 }}>{selected.title} · {selected.company} · {selected.country}</div>
                </div>
                {selected.email
                  ? <div style={{ padding:'4px 10px', borderRadius:6, background:'rgba(34,211,165,0.08)', border:'1px solid rgba(34,211,165,0.15)', fontSize:11, color:'#22d3a5' }}>✓ {selected.email}</div>
                  : selected.linkedin_url
                    ? <div style={{ padding:'4px 10px', borderRadius:6, background:'rgba(10,102,194,0.12)', border:'1px solid rgba(10,102,194,0.25)', fontSize:11, color:'#4a9eff' }}>LinkedIn only — no email found</div>
                    : <div style={{ padding:'4px 10px', borderRadius:6, background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.15)', fontSize:11, color:'#f87171' }}>No email or LinkedIn</div>
                }
              </div>
              <button onClick={runResearch} disabled={working} style={{
                display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:10,
                border:'1px solid rgba(0,246,255,0.25)', background: working?'rgba(0,246,255,0.03)':'rgba(0,246,255,0.1)',
                color:'#00F6FF', fontSize:13, fontWeight:600, cursor:working?'not-allowed':'pointer', opacity:working?0.7:1,
              }}>
                {working ? (
                  <><span style={{ display:'inline-block', width:12, height:12, border:'2px solid #00F6FF', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>Researching...</>
                ) : (
                  <>⚡ {hasResearch ? 'Re-research & Rewrite' : 'Research & Write Email'}</>
                )}
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', gap:0, borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
              {[{key:'email',label:'✉ Personalised Email'},{key:'research',label:'🔍 Company Research'}].map(t => (
                <button key={t.key} onClick={()=>setTab(t.key)} style={{
                  padding:'12px 24px', border:'none', cursor:'pointer', fontSize:13, fontWeight:500, transition:'all 0.15s',
                  background:'transparent',
                  color: tab===t.key ? '#00F6FF' : '#4A4F6A',
                  borderBottom: tab===t.key ? '2px solid #00F6FF' : '2px solid transparent',
                  marginBottom:-1,
                }}>{t.label}</button>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex:1, overflowY:'auto', padding:'24px' }}>
              {tab === 'research' ? (
                <div>
                  {!displayResearch ? (
                    <div style={{ textAlign:'center', padding:'60px 0', color:'#4A4F6A', fontSize:13 }}>
                      Click &quot;Research &amp; Write Email&quot; above to analyse {selected.company}
                    </div>
                  ) : (
                    <pre style={{
                      fontSize:12, lineHeight:1.8, color:'#c8cad8', whiteSpace:'pre-wrap', fontFamily:'monospace',
                      background:'#0d0d18', border:'1px solid rgba(255,255,255,0.05)', borderRadius:12, padding:20,
                    }}>{displayResearch}</pre>
                  )}
                </div>
              ) : (
                <div>
                  {/* LinkedIn DM banner for leads without email */}
                  {!selected.email && selected.linkedin_url && (
                    <div style={{ padding:'14px 18px', borderRadius:12, background:'rgba(10,102,194,0.08)', border:'1px solid rgba(10,102,194,0.2)', marginBottom:16 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#4a9eff', marginBottom:6 }}>📩 No email found — contact via LinkedIn</div>
                      <div style={{ fontSize:12, color:'#4A4F6A', marginBottom:10 }}>
                        This lead has a verified LinkedIn profile. Click below to open it and send a connection request or direct message.
                        The system will generate a short LinkedIn message for you.
                      </div>
                      <a href={selected.linkedin_url} target="_blank" rel="noreferrer" style={{
                        display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8,
                        background:'rgba(10,102,194,0.2)', border:'1px solid rgba(10,102,194,0.35)',
                        color:'#4a9eff', fontSize:12, fontWeight:600, textDecoration:'none',
                      }}>
                        <span style={{fontWeight:800,fontSize:11}}>in</span> Open LinkedIn Profile →
                      </a>
                    </div>
                  )}

                  {!subject && !body ? (
                    <div style={{ textAlign:'center', padding:'60px 0', color:'#4A4F6A' }}>
                      <div style={{ fontSize:32, marginBottom:12 }}>✉</div>
                      <div style={{ fontSize:13 }}>Click &quot;Research &amp; Write Email&quot; to generate a personalised email for {selected.full_name}</div>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                      {/* Subject */}
                      <div style={{ background:'#0d0d18', border:'1px solid rgba(255,255,255,0.05)', borderRadius:12, overflow:'hidden' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ fontSize:11, fontWeight:600, color:'#2a2d4a', textTransform:'uppercase', letterSpacing:'0.07em' }}>Subject Line</span>
                          <button onClick={() => copy(subject, 'subject')} style={{ fontSize:11, padding:'3px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)', color: copiedSubject?'#22d3a5':'#4A4F6A', cursor:'pointer' }}>
                            {copiedSubject ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                        <input value={subject} onChange={e=>setSubject(e.target.value)}
                          style={{ width:'100%', padding:'12px 16px', background:'transparent', border:'none', color:'#e8ecf0', fontSize:14, fontWeight:500, outline:'none' }}
                        />
                      </div>

                      {/* Body */}
                      <div style={{ background:'#0d0d18', border:'1px solid rgba(255,255,255,0.05)', borderRadius:12, overflow:'hidden' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ fontSize:11, fontWeight:600, color:'#2a2d4a', textTransform:'uppercase', letterSpacing:'0.07em' }}>Email Body</span>
                          <div style={{ display:'flex', gap:8 }}>
                            <button onClick={() => copy(body, 'body')} style={{ fontSize:11, padding:'3px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)', color: copiedBody?'#22d3a5':'#4A4F6A', cursor:'pointer' }}>
                              {copiedBody ? '✓ Copied' : 'Copy'}
                            </button>
                          </div>
                        </div>
                        <textarea value={body} onChange={e=>setBody(e.target.value)} rows={16}
                          style={{ width:'100%', padding:'16px', background:'transparent', border:'none', color:'#c8cad8', fontSize:13, lineHeight:1.8, outline:'none', resize:'none', fontFamily:'inherit' }}
                        />
                      </div>

                      {/* Save */}
                      <button onClick={saveDraft} style={{
                        width:'100%', padding:'13px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer',
                        background: saved ? 'rgba(34,211,165,0.1)' : 'rgba(0,246,255,0.1)',
                        color: saved ? '#22d3a5' : '#00F6FF',
                        border: `1px solid ${saved ? 'rgba(34,211,165,0.25)' : 'rgba(0,246,255,0.2)'}`,
                        transition:'all 0.2s',
                      }}>
                        {saved ? '✓ Saved — Lead marked as Contacted' : 'Save Draft & Mark as Contacted'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
