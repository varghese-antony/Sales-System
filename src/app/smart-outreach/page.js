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

const STEPS = ['research','posts','connect','message']

function StepBar({ step, hasEmail }) {
  const labels = ['① Research', '② Posts', '③ Connect', hasEmail ? '④ Email + DM' : '④ DM']
  return (
    <div style={{ display:'flex', gap:0, borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
      {labels.map((label, i) => {
        const active = STEPS[i] === step
        return (
          <button key={i} style={{
            padding:'11px 20px', border:'none', cursor:'pointer', fontSize:12, fontWeight: active ? 600 : 400,
            background:'transparent', transition:'all 0.15s',
            color: active ? '#00F6FF' : '#4A4F6A',
            borderBottom: active ? '2px solid #00F6FF' : '2px solid transparent',
            marginBottom: -1, whiteSpace:'nowrap',
          }}>{label}</button>
        )
      })}
    </div>
  )
}

export default function SmartOutreach() {
  const [leads, setLeads]         = useState([])
  const [selected, setSelected]   = useState(null)
  const [step, setStep]           = useState('research')
  const [loading, setLoading]     = useState(true)

  // Research state
  const [research, setResearch]   = useState('')
  const [resSubject, setResSubject] = useState('')
  const [resBody, setResBody]     = useState('')
  const [resWorking, setResWorking] = useState(false)

  // LinkedIn state
  const [liData, setLiData]       = useState(null)
  const [liWorking, setLiWorking] = useState(false)
  const [dmMsg, setDmMsg]         = useState('')
  const [connNote, setConnNote]   = useState('')
  const [dmSaved, setDmSaved]     = useState(false)
  const [emailSaved, setEmailSaved] = useState(false)
  const [copied, setCopied]       = useState('')

  useEffect(() => {
    supabase.from('leads').select('*').order('score', { ascending: false })
      .then(({ data }) => { setLeads(data || []); setLoading(false) })
  }, [])

  function selectLead(lead) {
    setSelected(lead)
    setStep('research')
    setResearch(lead.notes?.startsWith('COMPANY:') ? lead.notes : '')
    setResSubject(''); setResBody('')
    setLiData(null); setDmMsg(''); setConnNote('')
    setDmSaved(false); setEmailSaved(false); setCopied('')
  }

  // ── Research ──────────────────────────────────────────────
  async function runResearch() {
    if (!selected) return
    setResWorking(true)
    setResearch(''); setResSubject(''); setResBody('')
    const res = await fetch('/api/research-lead', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ lead: selected }),
    })
    const data = await res.json()
    if (data.success) {
      setResearch(data.research)
      setResSubject(data.subject)
      setResBody(data.body)
      setLeads(leads.map(l => l.id === selected.id ? { ...l, notes: data.research } : l))
    }
    setResWorking(false)
  }

  // ── LinkedIn Intelligence ─────────────────────────────────
  async function runLinkedIn() {
    if (!selected) return
    setLiWorking(true); setLiData(null)
    const res = await fetch('/api/linkedin-intelligence', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ lead: selected }),
    })
    const data = await res.json()
    if (data.success) {
      setLiData(data)
      setDmMsg(data.dmMessage)
      setConnNote(data.connectionNote)
    }
    setLiWorking(false)
  }

  async function updateLinkedInStatus(status) {
    if (!selected) return
    await fetch('/api/linkedin-intelligence', {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ leadId: selected.id, status }),
    })
    const updated = { ...selected, linkedin_status: status }
    setSelected(updated)
    setLeads(leads.map(l => l.id === selected.id ? updated : l))
    if (status === 'connected') setStep('message')
  }

  async function saveDM() {
    if (!selected || !dmMsg) return
    await supabase.from('outreach').insert({ lead_id:selected.id, type:'linkedin_dm', subject:'LinkedIn DM', message:dmMsg, status:'draft' })
    await supabase.from('leads').update({ linkedin_dm_sent:true, status:'contacted' }).eq('id', selected.id)
    const updated = { ...selected, linkedin_dm_sent:true, status:'contacted' }
    setSelected(updated); setLeads(leads.map(l => l.id===selected.id ? updated : l))
    setDmSaved(true); setTimeout(() => setDmSaved(false), 3000)
  }

  async function saveEmail() {
    if (!selected || !resBody) return
    await supabase.from('outreach').insert({ lead_id:selected.id, type:'email', subject:resSubject, message:resBody, status:'draft' })
    await supabase.from('leads').update({ status:'contacted' }).eq('id', selected.id)
    const updated = { ...selected, status:'contacted' }
    setSelected(updated); setLeads(leads.map(l => l.id===selected.id ? updated : l))
    setEmailSaved(true); setTimeout(() => setEmailSaved(false), 3000)
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text)
    setCopied(key); setTimeout(() => setCopied(''), 2000)
  }

  const liStatus = selected?.linkedin_status || 'none'
  const hasEmail = !!selected?.email

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#080810' }}>

      {/* ── LEFT: Lead list ── */}
      <div style={{ width:270, flexShrink:0, background:'#060610', borderRight:'1px solid rgba(0,246,255,0.06)', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'18px 16px 12px', borderBottom:'1px solid rgba(0,246,255,0.06)' }}>
          <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>Smart Outreach</div>
          <div style={{ fontSize:11, color:'rgba(0,246,255,0.4)', marginTop:2 }}>Research → Posts → Connect → Message</div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
          <div style={{ fontSize:10, color:'#2a2d4a', textTransform:'uppercase', letterSpacing:'0.08em', padding:'4px 8px 8px', fontWeight:600 }}>
            {leads.filter(l=>l.email).length} email · {leads.filter(l=>!l.email&&l.linkedin_url).length} linkedin only
          </div>
          {loading ? [1,2,3,4,5].map(i=><div key={i} style={{height:68,borderRadius:10,background:'#111120',marginBottom:6}}/>)
          : leads.map(lead => {
            const active = selected?.id === lead.id
            const liSt = lead.linkedin_status || 'none'
            const statusDot = { none:'#2a2d4a', requested:'#fb923c', connected:'#22d3a5', dm_sent:'#00F6FF' }[liSt] || '#2a2d4a'
            return (
              <div key={lead.id} onClick={() => selectLead(lead)} style={{
                padding:'10px 12px', borderRadius:10, marginBottom:4, cursor:'pointer',
                background: active ? 'rgba(0,246,255,0.08)' : 'rgba(255,255,255,0.02)',
                border:`1px solid ${active ? 'rgba(0,246,255,0.2)' : 'rgba(255,255,255,0.03)'}`,
                transition:'all 0.15s',
              }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div style={{fontSize:12,fontWeight:600,color:'#e8ecf0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:140}}>{lead.full_name}</div>
                  <div style={{display:'flex',gap:3,alignItems:'center',flexShrink:0}}>
                    {lead.notes?.startsWith('COMPANY:') && <span style={{fontSize:9,padding:'2px 4px',borderRadius:3,background:'rgba(34,211,165,0.12)',color:'#22d3a5',fontWeight:700}}>R</span>}
                    {liSt!=='none' && <span style={{width:6,height:6,borderRadius:'50%',background:statusDot,display:'inline-block'}}/>}
                    {!lead.email && <span style={{fontSize:9,padding:'2px 4px',borderRadius:3,background:'rgba(10,102,194,0.2)',color:'#4a9eff',fontWeight:700}}>in</span>}
                  </div>
                </div>
                <div style={{fontSize:11,color:'#4A4F6A',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{lead.company} · {lead.country}</div>
                <div style={{display:'flex',gap:5,marginTop:5,alignItems:'center'}}>
                  <span style={{fontSize:10,fontWeight:700,color:lead.score>=8?'#22d3a5':'#00F6FF'}}>{lead.score}/10</span>
                  <span style={{fontSize:10,padding:'1px 5px',borderRadius:99,background:statusStyle[lead.status]?.bg||'rgba(255,255,255,0.05)',color:statusStyle[lead.status]?.color||'#4A4F6A'}}>{lead.status}</span>
                  {liSt!=='none'&&<span style={{fontSize:10,color:statusDot}}>● {liSt}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── RIGHT: Main content ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {!selected ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
            <div style={{fontSize:40}}>🎯</div>
            <div style={{fontSize:15,fontWeight:700,color:'#fff'}}>Select a lead to begin</div>
            <div style={{fontSize:12,color:'#4A4F6A',textAlign:'center',maxWidth:320,lineHeight:1.6}}>
              The system researches each company, finds their LinkedIn posts, drafts a connection request, writes a DM — and an email if they have one.
            </div>
          </div>
        ) : (
          <>
            {/* Lead header */}
            <div style={{ padding:'14px 24px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:14, flexShrink:0 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:'rgba(0,246,255,0.1)', border:'1px solid rgba(0,246,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'#00F6FF', flexShrink:0 }}>
                {(selected.first_name||selected.full_name||'?')[0]}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,color:'#fff'}}>{selected.full_name}</div>
                <div style={{fontSize:11,color:'#4A4F6A',marginTop:1}}>{selected.title} · {selected.company} · {selected.country}</div>
              </div>
              <div style={{display:'flex',gap:8,flexShrink:0}}>
                {selected.email && <div style={{padding:'4px 10px',borderRadius:6,background:'rgba(34,211,165,0.08)',border:'1px solid rgba(34,211,165,0.15)',fontSize:11,color:'#22d3a5'}}>✓ email</div>}
                {selected.linkedin_url && <a href={selected.linkedin_url} target="_blank" rel="noreferrer" style={{padding:'4px 10px',borderRadius:6,background:'rgba(10,102,194,0.1)',border:'1px solid rgba(10,102,194,0.2)',fontSize:11,color:'#4a9eff',textDecoration:'none'}}>in LinkedIn</a>}
                {liStatus!=='none'&&<div style={{padding:'4px 10px',borderRadius:6,background:'rgba(34,211,165,0.08)',border:'1px solid rgba(34,211,165,0.15)',fontSize:11,color:'#22d3a5',textTransform:'capitalize'}}>● {liStatus}</div>}
              </div>
            </div>

            {/* Step tabs */}
            <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
              {[
                { key:'research', label:'① Research' },
                { key:'posts',    label:'② Posts' },
                { key:'connect',  label:'③ Connect' },
                { key:'message',  label: hasEmail ? '④ Email + DM' : '④ DM' },
              ].map(t => (
                <button key={t.key} onClick={()=>setStep(t.key)} style={{
                  padding:'11px 22px', border:'none', cursor:'pointer', fontSize:12, fontWeight:step===t.key?600:400,
                  background:'transparent', color:step===t.key?'#00F6FF':'#4A4F6A',
                  borderBottom:step===t.key?'2px solid #00F6FF':'2px solid transparent',
                  marginBottom:-1, transition:'all 0.15s', whiteSpace:'nowrap',
                }}>{t.label}</button>
              ))}
            </div>

            {/* ── Step content ── */}
            <div style={{ flex:1, overflowY:'auto', padding:'24px' }}>

              {/* ── STEP 1: Research ── */}
              {step==='research' && (
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                    <div>
                      <div style={{fontSize:15,fontWeight:700,color:'#fff'}}>Company Research</div>
                      <div style={{fontSize:12,color:'#4A4F6A',marginTop:3}}>What {selected.company} does, why they&apos;re a good fit, key pain points</div>
                    </div>
                    <button onClick={runResearch} disabled={resWorking} style={{
                      display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:9,
                      border:'1px solid rgba(0,246,255,0.25)',background:resWorking?'rgba(0,246,255,0.03)':'rgba(0,246,255,0.1)',
                      color:'#00F6FF',fontSize:12,fontWeight:600,cursor:resWorking?'not-allowed':'pointer',opacity:resWorking?0.7:1,
                    }}>
                      {resWorking?<><span style={{display:'inline-block',width:11,height:11,border:'2px solid #00F6FF',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>Researching...</>
                      :<>⚡ {research ? 'Re-research' : 'Research Company'}</>}
                    </button>
                  </div>
                  {!research ? (
                    <div style={{textAlign:'center',padding:'60px 0',color:'#4A4F6A'}}>
                      <div style={{fontSize:36,marginBottom:12}}>🔍</div>
                      <div style={{fontSize:13}}>Click &quot;Research Company&quot; to analyse {selected.company}</div>
                      <div style={{fontSize:11,marginTop:6,color:'#2a2d4a'}}>Visits their website · identifies pain points · explains why they&apos;re a good fit</div>
                    </div>
                  ) : (
                    <div>
                      <pre style={{fontSize:12,lineHeight:1.9,color:'#c8cad8',whiteSpace:'pre-wrap',fontFamily:'monospace',background:'#0d0d18',border:'1px solid rgba(255,255,255,0.05)',borderRadius:12,padding:20,marginBottom:16}}>{research}</pre>
                      <button onClick={()=>setStep('posts')} style={{padding:'10px 20px',borderRadius:9,border:'1px solid rgba(0,246,255,0.2)',background:'rgba(0,246,255,0.08)',color:'#00F6FF',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                        Next: Find Their Posts →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 2: Posts ── */}
              {step==='posts' && (
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                    <div>
                      <div style={{fontSize:15,fontWeight:700,color:'#fff'}}>LinkedIn Post Intelligence</div>
                      <div style={{fontSize:12,color:'#4A4F6A',marginTop:3}}>Find what {selected.company} &amp; their team have posted about</div>
                    </div>
                    <button onClick={runLinkedIn} disabled={liWorking} style={{
                      display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:9,
                      border:'1px solid rgba(10,102,194,0.35)',background:liWorking?'transparent':'rgba(10,102,194,0.12)',
                      color:'#4a9eff',fontSize:12,fontWeight:600,cursor:liWorking?'not-allowed':'pointer',opacity:liWorking?0.7:1,
                    }}>
                      {liWorking?<><span style={{display:'inline-block',width:11,height:11,border:'2px solid #4a9eff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>Searching...</>
                      :<><span style={{fontWeight:800}}>in</span> {liData ? 'Refresh' : 'Find Posts'}</>}
                    </button>
                  </div>

                  {!liData ? (
                    <div style={{textAlign:'center',padding:'60px 0',color:'#4A4F6A'}}>
                      <div style={{fontSize:36,marginBottom:12}}>📡</div>
                      <div style={{fontSize:13}}>Click &quot;Find Posts&quot; to search LinkedIn activity for {selected.company}</div>
                    </div>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:14}}>

                      {/* Posts found */}
                      {liData.linkedinPosts?.length > 0 && (
                        <div style={{background:'#0d0d18',border:'1px solid rgba(34,211,165,0.15)',borderRadius:12,overflow:'hidden'}}>
                          <div style={{padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:12,fontWeight:600,color:'#22d3a5'}}>✓ Company posts found</div>
                          {liData.linkedinPosts.map((post,i)=>(
                            <div key={i} style={{padding:'12px 16px',borderBottom:i<liData.linkedinPosts.length-1?'1px solid rgba(255,255,255,0.03)':'none',fontSize:12,color:'#c8cad8',lineHeight:1.6}}>
                              &quot;{post.slice(0,200)}{post.length>200?'...':''}&quot;
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Search links */}
                      <div style={{background:'#0d0d18',border:'1px solid rgba(255,255,255,0.05)',borderRadius:12,overflow:'hidden'}}>
                        <div style={{padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:12,fontWeight:600,color:'#fff'}}>Search for their posts</div>
                        <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:8}}>
                          <a href={liData.searchUrls.companyPosts} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:8,padding:'9px 14px',borderRadius:8,background:'rgba(10,102,194,0.1)',border:'1px solid rgba(10,102,194,0.2)',color:'#4a9eff',textDecoration:'none',fontSize:12,fontWeight:500}}>
                            <span style={{fontWeight:800,fontSize:10}}>in</span> Search {selected.company}&apos;s LinkedIn posts →
                          </a>
                          <a href={liData.searchUrls.teamPosts} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:8,padding:'9px 14px',borderRadius:8,background:'rgba(96,165,250,0.08)',border:'1px solid rgba(96,165,250,0.15)',color:'#60a5fa',textDecoration:'none',fontSize:12,fontWeight:500}}>
                            🔍 Google: team members posting about ops/automation/AI →
                          </a>
                          {selected.linkedin_url && (
                            <a href={selected.linkedin_url} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:8,padding:'9px 14px',borderRadius:8,background:'rgba(167,139,250,0.08)',border:'1px solid rgba(167,139,250,0.15)',color:'#a78bfa',textDecoration:'none',fontSize:12,fontWeight:500}}>
                              👤 Open founder&apos;s LinkedIn profile →
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Google post links */}
                      {liData.googlePostLinks?.length > 0 && (
                        <div style={{background:'#0d0d18',border:'1px solid rgba(255,255,255,0.05)',borderRadius:12,overflow:'hidden'}}>
                          <div style={{padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:12,fontWeight:600,color:'#fff'}}>Relevant results found</div>
                          {liData.googlePostLinks.map((url,i)=>(
                            <div key={i} style={{padding:'8px 16px',borderBottom:i<liData.googlePostLinks.length-1?'1px solid rgba(255,255,255,0.03)':'none'}}>
                              <a href={url} target="_blank" rel="noreferrer" style={{fontSize:11,color:'#60a5fa',textDecoration:'none',wordBreak:'break-all'}}>{url}</a>
                            </div>
                          ))}
                        </div>
                      )}

                      <button onClick={()=>setStep('connect')} style={{padding:'10px 20px',borderRadius:9,border:'1px solid rgba(0,246,255,0.2)',background:'rgba(0,246,255,0.08)',color:'#00F6FF',fontSize:13,fontWeight:600,cursor:'pointer',alignSelf:'flex-start'}}>
                        Next: Send Connection Request →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 3: Connect ── */}
              {step==='connect' && (
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:'#fff',marginBottom:4}}>Connection Request</div>
                  <div style={{fontSize:12,color:'#4A4F6A',marginBottom:20}}>Send a personalised connection request to {selected.full_name} on LinkedIn</div>

                  {liStatus === 'connected' ? (
                    <div style={{padding:'20px',borderRadius:12,background:'rgba(34,211,165,0.06)',border:'1px solid rgba(34,211,165,0.2)',marginBottom:16}}>
                      <div style={{fontSize:14,fontWeight:700,color:'#22d3a5',marginBottom:4}}>✅ Connected!</div>
                      <div style={{fontSize:12,color:'#4A4F6A'}}>You&apos;re connected with {selected.full_name}. Now send them a DM.</div>
                      <button onClick={()=>setStep('message')} style={{marginTop:12,padding:'9px 18px',borderRadius:9,border:'1px solid rgba(0,246,255,0.2)',background:'rgba(0,246,255,0.08)',color:'#00F6FF',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                        Go to Message →
                      </button>
                    </div>
                  ) : liStatus === 'requested' ? (
                    <div style={{padding:'20px',borderRadius:12,background:'rgba(251,146,60,0.06)',border:'1px solid rgba(251,146,60,0.2)',marginBottom:16}}>
                      <div style={{fontSize:14,fontWeight:700,color:'#fb923c',marginBottom:4}}>⏳ Request Sent — Waiting for acceptance</div>
                      <div style={{fontSize:12,color:'#4A4F6A',marginBottom:14}}>Once {selected.full_name} accepts, click below to move to messaging.</div>
                      <button onClick={()=>updateLinkedInStatus('connected')} style={{padding:'9px 18px',borderRadius:9,border:'1px solid rgba(34,211,165,0.25)',background:'rgba(34,211,165,0.1)',color:'#22d3a5',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                        ✓ They Accepted — Mark as Connected
                      </button>
                    </div>
                  ) : null}

                  {/* Connection note */}
                  {liData?.connectionNote ? (
                    <div style={{marginBottom:16}}>
                      <div style={{background:'#0d0d18',border:'1px solid rgba(255,255,255,0.05)',borderRadius:12,overflow:'hidden'}}>
                        <div style={{padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,0.04)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <span style={{fontSize:12,fontWeight:600,color:'#fff'}}>Connection Request Note <span style={{color:'#4A4F6A',fontWeight:400}}>(300 char limit)</span></span>
                          <button onClick={()=>copyText(connNote,'note')} style={{fontSize:11,padding:'3px 10px',borderRadius:6,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',color:copied==='note'?'#22d3a5':'#4A4F6A',cursor:'pointer'}}>
                            {copied==='note'?'✓ Copied':'Copy'}
                          </button>
                        </div>
                        <textarea value={connNote} onChange={e=>setConnNote(e.target.value.slice(0,300))} rows={4}
                          style={{width:'100%',padding:'14px 16px',background:'transparent',border:'none',color:'#c8cad8',fontSize:13,lineHeight:1.7,outline:'none',resize:'none',fontFamily:'inherit'}}
                        />
                        <div style={{padding:'6px 16px',borderTop:'1px solid rgba(255,255,255,0.04)',fontSize:11,color: connNote.length > 280 ? '#f87171':'#4A4F6A'}}>
                          {connNote.length}/300 characters
                        </div>
                      </div>
                    </div>
                  ) : !liData && (
                    <div style={{padding:'12px 16px',borderRadius:10,background:'rgba(251,146,60,0.06)',border:'1px solid rgba(251,146,60,0.15)',marginBottom:16,fontSize:12,color:'#fb923c'}}>
                      ← Go to &quot;Posts&quot; tab first and click &quot;Find Posts&quot; to generate the connection note
                    </div>
                  )}

                  <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                    {selected.linkedin_url && (
                      <a href={selected.linkedin_url} target="_blank" rel="noreferrer"
                        onClick={()=>liStatus==='none'&&updateLinkedInStatus('requested')}
                        style={{display:'inline-flex',alignItems:'center',gap:6,padding:'10px 18px',borderRadius:9,background:'rgba(10,102,194,0.15)',border:'1px solid rgba(10,102,194,0.3)',color:'#4a9eff',fontSize:13,fontWeight:600,textDecoration:'none'}}>
                        <span style={{fontWeight:800}}>in</span> Open Profile &amp; Send Request
                      </a>
                    )}
                    {liStatus==='none' && (
                      <button onClick={()=>updateLinkedInStatus('requested')} style={{padding:'10px 18px',borderRadius:9,border:'1px solid rgba(251,146,60,0.25)',background:'rgba(251,146,60,0.08)',color:'#fb923c',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                        Mark Request as Sent
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── STEP 4: Message (DM + Email) ── */}
              {step==='message' && (
                <div style={{display:'flex',flexDirection:'column',gap:16}}>

                  {/* LinkedIn DM */}
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:'#fff',marginBottom:4}}>LinkedIn DM</div>
                    <div style={{fontSize:12,color:'#4A4F6A',marginBottom:14}}>
                      {liStatus==='connected' ? `✅ You&apos;re connected with ${selected.full_name} — send this DM now` : 'Send this once you&apos;re connected'}
                    </div>
                    {!dmMsg && !liData ? (
                      <div style={{padding:'14px 18px',borderRadius:10,background:'rgba(251,146,60,0.06)',border:'1px solid rgba(251,146,60,0.15)',fontSize:12,color:'#fb923c',marginBottom:12}}>
                        ← Go to &quot;Posts&quot; tab first and click &quot;Find Posts&quot; to generate the DM
                      </div>
                    ) : (
                      <div style={{background:'#0d0d18',border:'1px solid rgba(10,102,194,0.2)',borderRadius:12,overflow:'hidden',marginBottom:10}}>
                        <div style={{padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,0.04)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <span style={{fontSize:12,fontWeight:600,color:'#4a9eff'}}><span style={{fontWeight:800}}>in</span> LinkedIn DM</span>
                          <button onClick={()=>copyText(dmMsg,'dm')} style={{fontSize:11,padding:'3px 10px',borderRadius:6,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',color:copied==='dm'?'#22d3a5':'#4A4F6A',cursor:'pointer'}}>
                            {copied==='dm'?'✓ Copied':'Copy'}
                          </button>
                        </div>
                        <textarea value={dmMsg} onChange={e=>setDmMsg(e.target.value)} rows={10}
                          style={{width:'100%',padding:'14px 16px',background:'transparent',border:'none',color:'#c8cad8',fontSize:13,lineHeight:1.8,outline:'none',resize:'none',fontFamily:'inherit'}}
                        />
                      </div>
                    )}
                    <div style={{display:'flex',gap:10}}>
                      {selected.linkedin_url && (
                        <a href={selected.linkedin_url} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'9px 16px',borderRadius:9,background:'rgba(10,102,194,0.12)',border:'1px solid rgba(10,102,194,0.25)',color:'#4a9eff',fontSize:12,fontWeight:600,textDecoration:'none'}}>
                          <span style={{fontWeight:800}}>in</span> Open LinkedIn to Send
                        </a>
                      )}
                      {dmMsg && (
                        <button onClick={saveDM} style={{padding:'9px 16px',borderRadius:9,border:`1px solid ${dmSaved?'rgba(34,211,165,0.25)':'rgba(255,255,255,0.08)'}`,background:dmSaved?'rgba(34,211,165,0.08)':'rgba(255,255,255,0.03)',color:dmSaved?'#22d3a5':'#4A4F6A',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                          {dmSaved?'✓ Saved':'Save Draft'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Email section (only if email exists) */}
                  {hasEmail && (
                    <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:20}}>
                      <div style={{fontSize:15,fontWeight:700,color:'#fff',marginBottom:4}}>Email</div>
                      <div style={{fontSize:12,color:'#4A4F6A',marginBottom:14}}>✓ {selected.email} — send this alongside the LinkedIn DM for maximum reach</div>
                      {!resBody ? (
                        <div style={{padding:'14px 18px',borderRadius:10,background:'rgba(251,146,60,0.06)',border:'1px solid rgba(251,146,60,0.15)',fontSize:12,color:'#fb923c',marginBottom:12}}>
                          ← Go to &quot;Research&quot; tab first to generate the email
                        </div>
                      ) : (
                        <>
                          <div style={{background:'#0d0d18',border:'1px solid rgba(34,211,165,0.12)',borderRadius:12,overflow:'hidden',marginBottom:10}}>
                            <div style={{padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,0.04)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                              <span style={{fontSize:12,fontWeight:600,color:'#22d3a5'}}>✉ Email Subject</span>
                              <button onClick={()=>copyText(resSubject,'subj')} style={{fontSize:11,padding:'3px 10px',borderRadius:6,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',color:copied==='subj'?'#22d3a5':'#4A4F6A',cursor:'pointer'}}>
                                {copied==='subj'?'✓ Copied':'Copy'}
                              </button>
                            </div>
                            <input value={resSubject} onChange={e=>setResSubject(e.target.value)}
                              style={{width:'100%',padding:'12px 16px',background:'transparent',border:'none',color:'#e8ecf0',fontSize:14,fontWeight:500,outline:'none'}}
                            />
                          </div>
                          <div style={{background:'#0d0d18',border:'1px solid rgba(34,211,165,0.12)',borderRadius:12,overflow:'hidden',marginBottom:10}}>
                            <div style={{padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,0.04)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                              <span style={{fontSize:12,fontWeight:600,color:'#22d3a5'}}>✉ Email Body</span>
                              <button onClick={()=>copyText(resBody,'body')} style={{fontSize:11,padding:'3px 10px',borderRadius:6,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',color:copied==='body'?'#22d3a5':'#4A4F6A',cursor:'pointer'}}>
                                {copied==='body'?'✓ Copied':'Copy'}
                              </button>
                            </div>
                            <textarea value={resBody} onChange={e=>setResBody(e.target.value)} rows={12}
                              style={{width:'100%',padding:'14px 16px',background:'transparent',border:'none',color:'#c8cad8',fontSize:13,lineHeight:1.8,outline:'none',resize:'none',fontFamily:'inherit'}}
                            />
                          </div>
                          <button onClick={saveEmail} style={{padding:'10px 20px',borderRadius:9,border:`1px solid ${emailSaved?'rgba(34,211,165,0.25)':'rgba(0,246,255,0.2)'}`,background:emailSaved?'rgba(34,211,165,0.08)':'rgba(0,246,255,0.08)',color:emailSaved?'#22d3a5':'#00F6FF',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                            {emailSaved?'✓ Saved & Marked Contacted':'Save Email Draft'}
                          </button>
                        </>
                      )}
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
