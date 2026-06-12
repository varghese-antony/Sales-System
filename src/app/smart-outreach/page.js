'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useDemoMode } from '@/contexts/DemoModeContext'

const statusStyle = {
  new:           { bg:'rgba(167,139,250,0.1)', color:'#a78bfa' },
  contacted:     { bg:'rgba(96,165,250,0.1)',  color:'#60a5fa' },
  interested:    { bg:'rgba(34,211,165,0.1)',  color:'#22d3a5' },
  not_interested:{ bg:'rgba(248,113,113,0.1)', color:'#f87171' },
  client:        { bg:'rgba(0,246,255,0.1)',   color:'#00F6FF' },
}

const ANGLE_NAMES = ['Mirror', 'Signal-led', 'Proof-first', 'Short & direct']

function daysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000*60*60*24))
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000*60*60*24))
}

function getSeqBadge(leadId, sequences) {
  const seq = sequences.find(s => s.lead_id === leadId)
  if (!seq) return null
  if (seq.replied) return { label:'💬 Replied', color:'#22d3a5', bg:'rgba(34,211,165,0.08)' }
  if (seq.complete) return { label:'⚫ Done', color:'#4A4F6A', bg:'rgba(74,79,106,0.08)' }
  const due = new Date(seq.next_due_at).getTime() <= Date.now()
  if (seq.step === 1) {
    if (due) return { label:'🔴 F/U Due', color:'#f87171', bg:'rgba(248,113,113,0.08)' }
    if (seq.opened_at) return { label:'👁 Opened', color:'#00F6FF', bg:'rgba(0,246,255,0.08)' }
    return { label:'🟡 Waiting', color:'#fbbf24', bg:'rgba(251,191,36,0.08)' }
  }
  if (seq.step === 2) return due
    ? { label:'🔴 F/U2 Due', color:'#f87171', bg:'rgba(248,113,113,0.08)' }
    : { label:'🟠 F/U2', color:'#fb923c', bg:'rgba(251,146,60,0.08)' }
  return null
}

function PendingTracker({ leads, onMarkConnected, onMarkEmail, b={} }) {
  const pending = leads.filter(l => l.linkedin_status === 'requested')
  if (pending.length === 0) return (
    <div style={{padding:'60px 32px',textAlign:'center'}}>
      <div style={{fontSize:36,marginBottom:12}}>✅</div>
      <div style={{fontSize:14,fontWeight:700,color:'#fff',marginBottom:6}}>No pending requests</div>
      <div style={{fontSize:12,color:'#4A4F6A',lineHeight:1.6}}>When you send a connection request it will appear here</div>
    </div>
  )
  return (
    <div style={{padding:'24px'}}>
      <div style={{fontSize:16,fontWeight:700,color:'#fff',marginBottom:4}}>Pending Connection Requests</div>
      <div style={{fontSize:12,color:'#4A4F6A',marginBottom:20}}>{pending.length} waiting — check LinkedIn notifications to see who accepted</div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {pending.map(lead => {
          const days = daysSince(lead.linkedin_requested_at)
          const overdue = days !== null && days >= 7
          return (
            <div key={lead.id} style={{
              padding:'18px 20px',borderRadius:12,
              background:overdue?'rgba(248,113,113,0.04)':'rgba(255,255,255,0.02)',
              border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'rgba(255,255,255,0.06)'}`,
            }}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:'#e8ecf0',...b}}>{lead.full_name}</div>
                  <div style={{fontSize:12,color:'#4A4F6A',marginTop:3}}><span style={b}>{lead.company}</span> · {lead.country}</div>
                </div>
                <div style={{textAlign:'right',flexShrink:0,marginLeft:16}}>
                  <div style={{fontSize:13,fontWeight:700,color:overdue?'#f87171':'#fb923c'}}>
                    {days===null?'Sent recently':days===0?'Sent today':`${days} day${days!==1?'s':''} ago`}
                  </div>
                  {overdue&&<div style={{fontSize:11,color:'#f87171',marginTop:3}}>⚠ No reply — try email</div>}
                </div>
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button onClick={()=>onMarkConnected(lead)} style={{
                  padding:'7px 14px',borderRadius:8,border:'1px solid rgba(34,211,165,0.3)',
                  background:'rgba(34,211,165,0.08)',color:'#22d3a5',fontSize:12,fontWeight:600,cursor:'pointer',
                }}>✓ They Accepted — Send DM</button>
                {lead.linkedin_url&&(
                  <a href={lead.linkedin_url} target="_blank" rel="noreferrer" style={{
                    padding:'7px 14px',borderRadius:8,border:'1px solid rgba(10,102,194,0.25)',
                    background:'rgba(10,102,194,0.08)',color:'#4a9eff',fontSize:12,fontWeight:600,
                    textDecoration:'none',display:'inline-flex',alignItems:'center',gap:5,
                  }}><span style={{fontWeight:800,fontSize:10}}>in</span> Check LinkedIn</a>
                )}
                {overdue&&lead.email&&(
                  <button onClick={()=>onMarkEmail(lead)} style={{
                    padding:'7px 14px',borderRadius:8,border:'1px solid rgba(248,113,113,0.2)',
                    background:'rgba(248,113,113,0.06)',color:'#f87171',fontSize:12,fontWeight:600,cursor:'pointer',
                  }}>Switch to Email instead →</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SequencesOverview({ sequences, onSelectLead, b={} }) {
  const active = sequences.filter(s => !s.complete && !s.replied)
  const replied = sequences.filter(s => s.replied)
  const done = sequences.filter(s => s.complete && !s.replied)

  if (sequences.length === 0) return (
    <div style={{padding:'60px 32px',textAlign:'center'}}>
      <div style={{fontSize:36,marginBottom:12}}>📬</div>
      <div style={{fontSize:14,fontWeight:700,color:'#fff',marginBottom:6}}>No sequences yet</div>
      <div style={{fontSize:12,color:'#4A4F6A',lineHeight:1.6,maxWidth:300,margin:'0 auto'}}>
        When you send an email to a lead, a sequence is created automatically to track follow-ups
      </div>
    </div>
  )

  const Row = ({ seq }) => {
    const badge = getSeqBadge(seq.lead_id, sequences)
    const since = daysSince(seq.last_sent_at)
    const until = daysUntil(seq.next_due_at)
    return (
      <div onClick={()=>onSelectLead(seq.leads, seq)} style={{
        display:'grid',gridTemplateColumns:'1fr 1fr auto auto auto',gap:12,alignItems:'center',
        padding:'12px 16px',borderRadius:10,cursor:'pointer',marginBottom:4,
        background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.04)',
        transition:'all 0.15s',
      }}
        onMouseEnter={e=>e.currentTarget.style.background='rgba(0,246,255,0.05)'}
        onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
      >
        <div>
          <div style={{fontSize:13,fontWeight:600,color:'#e8ecf0',...b}}>{seq.leads?.full_name||'—'}</div>
          <div style={{fontSize:11,color:'#4A4F6A',marginTop:2,...b}}>{seq.leads?.company||'—'}</div>
        </div>
        <div style={{fontSize:12,color:'#c8cad8'}}>{ANGLE_NAMES[seq.angle_number]||'—'}</div>
        <div style={{fontSize:12,color:'#4A4F6A',textAlign:'center'}}>
          {seq.step}/3<br/><span style={{fontSize:10}}>steps</span>
        </div>
        <div style={{fontSize:11,color:'#4A4F6A',textAlign:'center'}}>
          {since===0?'today':since===1?'yesterday':`${since}d ago`}
        </div>
        {badge&&(
          <div style={{
            padding:'3px 8px',borderRadius:99,fontSize:10,fontWeight:700,
            background:badge.bg,color:badge.color,whiteSpace:'nowrap',
          }}>{badge.label}</div>
        )}
        {seq.replied&&<div style={{padding:'3px 8px',borderRadius:99,fontSize:10,fontWeight:700,background:'rgba(34,211,165,0.08)',color:'#22d3a5'}}>💬 Replied</div>}
        {seq.complete&&!seq.replied&&<div style={{padding:'3px 8px',borderRadius:99,fontSize:10,fontWeight:700,background:'rgba(74,79,106,0.08)',color:'#4A4F6A'}}>⚫ Done</div>}
      </div>
    )
  }

  return (
    <div style={{padding:'24px'}}>
      {active.length > 0 && (
        <>
          <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:12}}>
            Active Sequences <span style={{color:'#4A4F6A',fontWeight:400}}>({active.length})</span>
          </div>
          <div style={{marginBottom:24}}>
            {/* Header */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto auto auto',gap:12,padding:'6px 16px',marginBottom:4}}>
              {['Name','Angle','Step','Last sent','Status'].map(h=>(
                <div key={h} style={{fontSize:10,color:'#2a2d4a',textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:600}}>{h}</div>
              ))}
            </div>
            {active.map(seq=><Row key={seq.id} seq={seq}/>)}
          </div>
        </>
      )}
      {replied.length > 0 && (
        <>
          <div style={{fontSize:13,fontWeight:700,color:'#22d3a5',marginBottom:12}}>
            Replied <span style={{color:'#4A4F6A',fontWeight:400}}>({replied.length})</span>
          </div>
          <div style={{marginBottom:24}}>{replied.map(seq=><Row key={seq.id} seq={seq}/>)}</div>
        </>
      )}
      {done.length > 0 && (
        <>
          <div style={{fontSize:13,fontWeight:700,color:'#4A4F6A',marginBottom:12}}>
            Completed — no reply <span style={{fontWeight:400}}>({done.length})</span>
          </div>
          <div>{done.map(seq=><Row key={seq.id} seq={seq}/>)}</div>
        </>
      )}
    </div>
  )
}

export default function SmartOutreach() {
  const { demoMode } = useDemoMode()
  const b = demoMode ? { filter:'blur(6px)', userSelect:'none', pointerEvents:'none', transition:'filter 0.2s' } : {}
  const [leads, setLeads]           = useState([])
  const [sequences, setSequences]   = useState([])
  const [selected, setSelected]     = useState(null)
  const [step, setStep]             = useState('research')
  const [loading, setLoading]       = useState(true)
  const [view, setView]             = useState('all')
  const [search, setSearch]         = useState('')
  const [activityData, setActivityData]     = useState(null)
  const [activityLoading, setActivityLoading] = useState(false)

  // Research state
  const [research, setResearch]     = useState('')
  const [resSubject, setResSubject] = useState('')
  const [resBody, setResBody]       = useState('')
  const [resWorking, setResWorking] = useState(false)

  // LinkedIn state
  const [liData, setLiData]         = useState(null)
  const [liWorking, setLiWorking]   = useState(false)
  const [dmMsg, setDmMsg]           = useState('')
  const [connNote, setConnNote]     = useState('')
  const [dmSaved, setDmSaved]       = useState(false)
  const [emailSaved, setEmailSaved] = useState(false)
  const [emailSent, setEmailSent]   = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  // Start at variation 2 (Proof-first) as per Marketing Head spec
  const [variation, setVariation]   = useState(2)
  const [copied, setCopied]         = useState('')
  // Email score state (from Email Refinement Agent)
  const [emailScore, setEmailScore] = useState(null) // { aiScore, personalisationScore, grade, problems, wordCount }
  const [refining, setRefining]     = useState(false)

  // Sequence state
  const [followupSending, setFollowupSending] = useState(false)
  const [followupSent, setFollowupSent]       = useState(false)

  // Replies inbox state
  const [replies, setReplies]               = useState([])
  const [repliesLoading, setRepliesLoading] = useState(false)
  const [repliesLoaded, setRepliesLoaded]   = useState(false)
  const [expandedReply, setExpandedReply]   = useState(null)

  async function loadSequences() {
    const res = await fetch('/api/sequences')
    const data = await res.json()
    if (data.success) setSequences(data.sequences || [])
  }

  async function loadReplies() {
    setRepliesLoading(true)
    try {
      const res = await fetch('/api/check-replies')
      const data = await res.json()
      if (data.success) { setReplies(data.messages || []); setRepliesLoaded(true) }
    } catch {}
    setRepliesLoading(false)
  }

  async function loadActivity(lead) {
    setActivityLoading(true)
    setActivityData(null)
    try {
      const [{ data: outreach }, { data: seqs }] = await Promise.all([
        supabase.from('outreach').select('*').eq('lead_id', lead.id).order('created_at', { ascending: true }),
        supabase.from('sequences').select('*').eq('lead_id', lead.id).order('created_at', { ascending: true }),
      ])
      setActivityData({ outreach: outreach || [], sequences: seqs || [] })
    } catch {}
    setActivityLoading(false)
  }

  useEffect(() => {
    Promise.all([
      supabase.from('leads').select('id,full_name,first_name,last_name,company,email,website,title,industry,country,score,score_reason,status,notes,linkedin_url,linkedin_status,linkedin_requested_at,linkedin_dm_sent').order('score', { ascending: false }),
      fetch('/api/sequences').then(r=>r.json()),
    ]).then(([{ data }, seqData]) => {
      setLeads(data || [])
      setSequences(seqData.sequences || [])
      setLoading(false)
    })
  }, [])

  function selectLead(lead, seq) {
    setSelected(lead)
    setStep('research')
    setResearch(lead.notes?.startsWith('COMPANY:') ? lead.notes : '')
    setResSubject(''); setResBody('')
    setLiData(null); setDmMsg(''); setConnNote('')
    setDmSaved(false); setEmailSaved(false); setEmailSent(false)
    setFollowupSent(false); setCopied(''); setEmailScore(null)
    setView('all')
    // If lead has no sequence, always start at Proof-first (variation 2)
    const existingSeq = seq || sequences.find(s => s.lead_id === lead.id)
    setVariation(existingSeq ? existingSeq.angle_number : 2)
  }

  async function runResearch() {
    if (!selected) return
    setResWorking(true); setResearch(''); setResSubject(''); setResBody('')
    const res = await fetch('/api/research-lead', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ lead: selected, variation }),
    })
    const data = await res.json()
    if (data.success) {
      setResearch(data.research); setResSubject(data.subject); setResBody(data.body)
      setLeads(leads.map(l => l.id===selected.id ? {...l, notes:data.research} : l))
      if (data.aiScore !== undefined) {
        setEmailScore({ aiScore: data.aiScore, personalisationScore: data.personalisationScore, grade: data.grade, problems: data.problems || [], wordCount: data.wordCount })
      }
    }
    setResWorking(false)
  }

  async function refineEmailNow() {
    if (!selected || !resSubject || !resBody) return
    setRefining(true)
    try {
      const res = await fetch('/api/refine-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: resSubject, body: resBody, lead: selected }),
      })
      const data = await res.json()
      if (data.success) {
        setResSubject(data.subject); setResBody(data.body)
        setEmailScore({ aiScore: data.aiScore, personalisationScore: data.personalisationScore, grade: data.grade, problems: data.problems || [], wordCount: data.wordCount })
      }
    } catch {}
    setRefining(false)
  }

  async function runLinkedIn() {
    if (!selected) return
    setLiWorking(true); setLiData(null)
    const res = await fetch('/api/linkedin-intelligence', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ lead: selected }),
    })
    const data = await res.json()
    if (data.success) { setLiData(data); setDmMsg(data.dmMessage); setConnNote(data.connectionNote) }
    setLiWorking(false)
  }

  async function patchLinkedInStatus(leadId, status) {
    await fetch('/api/linkedin-intelligence', {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ leadId, status }),
    })
  }

  async function updateLinkedInStatus(status) {
    if (!selected) return
    await patchLinkedInStatus(selected.id, status)
    const now = status==='requested' ? new Date().toISOString() : selected.linkedin_requested_at
    const updated = {...selected, linkedin_status:status, linkedin_requested_at:now}
    setSelected(updated)
    setLeads(leads.map(l => l.id===selected.id ? updated : l))
    if (status==='connected') setStep('message')
  }

  async function markConnectedFromPending(lead) {
    await patchLinkedInStatus(lead.id, 'connected')
    const updated = {...lead, linkedin_status:'connected'}
    setLeads(leads.map(l => l.id===lead.id ? updated : l))
    setSelected(updated); setStep('message'); setView('all')
  }

  async function switchToEmail(lead) {
    await patchLinkedInStatus(lead.id, 'none')
    const updated = {...lead, linkedin_status:'none'}
    setLeads(leads.map(l => l.id===lead.id ? updated : l))
    setSelected(updated); setStep('research'); setView('all')
  }

  async function saveDM() {
    if (!selected || !dmMsg) return
    await supabase.from('outreach').insert({ lead_id:selected.id, type:'linkedin_dm', subject:'LinkedIn DM', message:dmMsg, status:'draft' })
    await supabase.from('leads').update({ linkedin_dm_sent:true, status:'contacted' }).eq('id', selected.id)
    const updated = {...selected, linkedin_dm_sent:true, status:'contacted'}
    setSelected(updated); setLeads(leads.map(l => l.id===selected.id ? updated : l))
    setDmSaved(true); setTimeout(()=>setDmSaved(false), 3000)
  }

  async function saveEmail() {
    if (!selected || !resBody) return
    await supabase.from('outreach').insert({ lead_id:selected.id, type:'email', subject:resSubject, message:resBody, status:'draft' })
    await supabase.from('leads').update({ status:'contacted' }).eq('id', selected.id)
    const updated = {...selected, status:'contacted'}
    setSelected(updated); setLeads(leads.map(l => l.id===selected.id ? updated : l))
    setEmailSaved(true); setTimeout(()=>setEmailSaved(false), 3000)
  }

  async function discardLead() {
    if (!selected) return
    await supabase.from('leads').update({ status:'not_interested' }).eq('id', selected.id)
    const updated = {...selected, status:'not_interested'}
    setLeads(leads.map(l => l.id===selected.id ? updated : l))
    const currentIndex = leads.findIndex(l => l.id===selected.id)
    const nextLead = leads.find((l,i) => i>currentIndex && l.status!=='not_interested')
    if (nextLead) selectLead(nextLead)
    else setSelected(null)
  }

  async function regenerateEmail() {
    if (!selected) return
    setRegenerating(true)
    setResSubject(''); setResBody(''); setEmailSent(false)
    const nextVariation = (variation + 1) % 4
    setVariation(nextVariation)
    const res = await fetch('/api/research-lead', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ lead:selected, variation:nextVariation }),
    })
    const data = await res.json()
    if (data.success) { setResSubject(data.subject); setResBody(data.body) }
    setRegenerating(false)
  }

  async function sendEmail() {
    if (!selected?.email || !resSubject || !resBody) return
    setEmailSending(true)
    const res = await fetch('/api/send-email', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ leadId:selected.id, to:selected.email, subject:resSubject, body:resBody, variation, country:selected.country, aiScore: emailScore?.aiScore, personalisationScore: emailScore?.personalisationScore }),
    })
    const data = await res.json()
    if (data.success) {
      setEmailSent(true)
      const updated = {...selected, status:'contacted'}
      setSelected(updated); setLeads(leads.map(l => l.id===selected.id ? updated : l))
      await loadSequences()
    } else {
      alert('Email failed: ' + data.error)
    }
    setEmailSending(false)
  }

  async function sendFollowup() {
    if (!selected) return
    const seq = sequences.find(s => s.lead_id === selected.id)
    if (!seq) return
    setFollowupSending(true)
    const res = await fetch('/api/send-followup', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        sequenceId: seq.id,
        leadId: selected.id,
        to: selected.email,
        firstName: selected.first_name || selected.full_name?.split(' ')[0] || 'there',
        originalSubject: seq.original_subject,
        originalMessageId: seq.original_message_id,
      }),
    })
    const data = await res.json()
    if (data.success) {
      setFollowupSent(true)
      await loadSequences()
    } else {
      alert('Follow-up failed: ' + data.error)
    }
    setFollowupSending(false)
  }

  async function markReplied() {
    const seq = sequences.find(s => s.lead_id === selected?.id)
    if (!seq) return
    await fetch('/api/sequences', {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ sequenceId: seq.id }),
    })
    await loadSequences()
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text)
    setCopied(key); setTimeout(()=>setCopied(''), 2000)
  }

  const liStatus = selected?.linkedin_status || 'none'
  const hasEmail = !!selected?.email
  const pendingCount = leads.filter(l => l.linkedin_status==='requested').length
  const seqCount = sequences.filter(s => !s.complete && !s.replied).length
  const unreadCount = replies.filter(r => !r.seen).length

  // Current lead's sequence
  const currentSeq = selected ? sequences.find(s => s.lead_id === selected.id) : null
  const seqIsActive = currentSeq && !currentSeq.complete && !currentSeq.replied
  const seqIsDue = seqIsActive && new Date(currentSeq.next_due_at) <= new Date()
  const seqNextStep = currentSeq ? currentSeq.step + 1 : null

  const FOLLOWUP_PREVIEWS = {
    2: (first) => `Hi ${first},\n\nJust bumping this up in case it got buried.\n\nStill worth a quick chat if the timing's right.\n\nVarghese`,
    3: (first) => `Hi ${first},\n\nLast nudge from me — I know the inbox gets busy.\n\nIf ops automation ever becomes a priority, I'm easy to find.\n\nVarghese`,
  }

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'#080810'}}>

      {/* ── LEFT panel ── */}
      <div style={{width:270,flexShrink:0,background:'#060610',borderRight:'1px solid rgba(0,246,255,0.06)',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'18px 16px 12px',borderBottom:'1px solid rgba(0,246,255,0.06)'}}>
          <div style={{fontSize:15,fontWeight:700,color:'#fff',marginBottom:10}}>Smart Outreach</div>
          {/* Search bar */}
          <div style={{position:'relative',marginBottom:10}}>
            <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'#2a2d4a',pointerEvents:'none'}}>🔍</span>
            <input
              type="text"
              placeholder="Search name, email or company…"
              value={search}
              onChange={e=>setSearch(e.target.value)}
              style={{
                width:'100%',padding:'7px 10px 7px 30px',borderRadius:8,
                background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',
                color:'#e8ecf0',fontSize:12,outline:'none',boxSizing:'border-box',
              }}
            />
            {search&&(
              <button onClick={()=>setSearch('')} style={{
                position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',
                background:'none',border:'none',color:'#4A4F6A',cursor:'pointer',fontSize:14,lineHeight:1,padding:0,
              }}>✕</button>
            )}
          </div>
          {/* 4-way toggle */}
          <div style={{display:'flex',background:'rgba(255,255,255,0.03)',borderRadius:8,padding:3,gap:2}}>
            {[
              { key:'all',       label:'Leads',  activeColor:'#00F6FF', activeBg:'rgba(0,246,255,0.1)' },
              { key:'pending',   label:'⏳',      activeColor:'#fb923c', activeBg:'rgba(251,146,60,0.12)', count:pendingCount },
              { key:'sequences', label:'📊',      activeColor:'#a78bfa', activeBg:'rgba(167,139,250,0.12)', count:seqCount },
              { key:'replies',   label:'📬',      activeColor:'#22d3a5', activeBg:'rgba(34,211,165,0.12)', count:unreadCount },
            ].map(t=>(
              <button key={t.key} onClick={()=>{ setView(t.key); if(t.key==='replies'&&!repliesLoaded) loadReplies() }} style={{
                flex:1,padding:'6px 0',border:'none',borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:600,
                background:view===t.key ? t.activeBg : 'transparent',
                color:view===t.key ? t.activeColor : '#4A4F6A',
                transition:'all 0.15s',position:'relative',
              }}>
                {t.label}
                {t.count>0&&(
                  <span style={{
                    position:'absolute',top:1,right:2,minWidth:14,height:14,borderRadius:7,
                    background:t.activeColor,color:'#000',fontSize:8,fontWeight:800,
                    display:'inline-flex',alignItems:'center',justifyContent:'center',padding:'0 2px',
                  }}>{t.count}</span>
                )}
              </button>
            ))}
          </div>
          {view==='pending'&&<div style={{fontSize:10,color:'#4A4F6A',textAlign:'center',marginTop:6}}>LinkedIn pending</div>}
          {view==='sequences'&&<div style={{fontSize:10,color:'#4A4F6A',textAlign:'center',marginTop:6}}>Email sequences</div>}
          {view==='replies'&&<div style={{fontSize:10,color:'#4A4F6A',textAlign:'center',marginTop:6}}>Inbox replies</div>}
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'8px'}}>
          {view==='all'&&(
            <div style={{fontSize:10,color:'#2a2d4a',textTransform:'uppercase',letterSpacing:'0.08em',padding:'4px 8px 8px',fontWeight:600}}>
              {leads.filter(l=>l.email).length} email · {leads.filter(l=>!l.email&&l.linkedin_url).length} linkedin only
            </div>
          )}
          {loading
            ? [1,2,3,4,5].map(i=><div key={i} style={{height:68,borderRadius:10,background:'#111120',marginBottom:6}}/>)
            : view==='pending'||view==='sequences'||view==='replies'
            ? <div style={{padding:'12px 8px',fontSize:12,color:'#4A4F6A'}}>
                {view==='pending'?'Check pending → on the right':view==='replies'?'View replies → on the right':'View sequences → on the right'}
              </div>
            : leads.filter(l => {
                if (l.status === 'not_interested') return false
                if (!search) return true
                const q = search.toLowerCase()
                return (
                  l.full_name?.toLowerCase().includes(q) ||
                  l.email?.toLowerCase().includes(q) ||
                  l.company?.toLowerCase().includes(q)
                )
              }).map(lead => {
                const active = selected?.id===lead.id
                const liSt = lead.linkedin_status||'none'
                const dot = {none:'#2a2d4a',requested:'#fb923c',connected:'#22d3a5',dm_sent:'#00F6FF'}[liSt]||'#2a2d4a'
                const seqBadge = getSeqBadge(lead.id, sequences)
                return (
                  <div key={lead.id} onClick={()=>selectLead(lead)} style={{
                    padding:'10px 12px',borderRadius:10,marginBottom:4,cursor:'pointer',
                    background:active?'rgba(0,246,255,0.08)':'rgba(255,255,255,0.02)',
                    border:`1px solid ${active?'rgba(0,246,255,0.2)':'rgba(255,255,255,0.03)'}`,
                    transition:'all 0.15s',
                  }}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div style={{fontSize:12,fontWeight:600,color:'#e8ecf0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:130,...b}}>{lead.full_name}</div>
                      <div style={{display:'flex',gap:3,alignItems:'center',flexShrink:0}}>
                        {lead.notes?.startsWith('COMPANY:')&&<span style={{fontSize:9,padding:'2px 4px',borderRadius:3,background:'rgba(34,211,165,0.12)',color:'#22d3a5',fontWeight:700}}>R</span>}
                        {liSt!=='none'&&<span style={{width:6,height:6,borderRadius:'50%',background:dot,display:'inline-block'}}/>}
                        {!lead.email&&<span style={{fontSize:9,padding:'2px 4px',borderRadius:3,background:'rgba(10,102,194,0.2)',color:'#4a9eff',fontWeight:700}}>in</span>}
                      </div>
                    </div>
                    <div style={{fontSize:11,color:'#4A4F6A',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}><span style={b}>{lead.company}</span> · {lead.country}</div>
                    <div style={{display:'flex',gap:5,marginTop:5,alignItems:'center',flexWrap:'wrap'}}>
                      <span style={{fontSize:10,fontWeight:700,color:lead.score>=8?'#22d3a5':'#00F6FF'}}>{lead.score}/10</span>
                      <span style={{fontSize:10,padding:'1px 5px',borderRadius:99,background:statusStyle[lead.status]?.bg||'rgba(255,255,255,0.05)',color:statusStyle[lead.status]?.color||'#4A4F6A'}}>{lead.status}</span>
                      {seqBadge&&<span style={{fontSize:9,padding:'1px 5px',borderRadius:99,background:seqBadge.bg,color:seqBadge.color,fontWeight:700}}>{seqBadge.label}</span>}
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>

      {/* ── RIGHT panel ── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {view==='pending' ? (
          <div style={{flex:1,overflowY:'auto'}}>
            <PendingTracker leads={leads} onMarkConnected={markConnectedFromPending} onMarkEmail={switchToEmail} b={b}/>
          </div>

        ) : view==='sequences' ? (
          <div style={{flex:1,overflowY:'auto'}}>
            <div style={{padding:'20px 24px 0',borderBottom:'1px solid rgba(255,255,255,0.05)',paddingBottom:16}}>
              <div style={{fontSize:16,fontWeight:700,color:'#fff'}}>Sequence Overview</div>
              <div style={{fontSize:12,color:'#4A4F6A',marginTop:3}}>Track every email thread — who&apos;s waiting, who&apos;s due, who replied</div>
            </div>
            <SequencesOverview sequences={sequences} onSelectLead={(lead,seq)=>{selectLead(lead,seq);setStep('message')}} b={b}/>
          </div>

        ) : view==='replies' ? (
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <div style={{padding:'20px 24px 16px',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:'#fff'}}>Replies Inbox</div>
                <div style={{fontSize:12,color:'#4A4F6A',marginTop:3}}>Emails sent back to antonyv@blendery.tech from your leads</div>
              </div>
              <button onClick={loadReplies} disabled={repliesLoading} style={{
                display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:8,
                border:'1px solid rgba(34,211,165,0.25)',background:'rgba(34,211,165,0.08)',
                color:'#22d3a5',fontSize:12,fontWeight:600,cursor:repliesLoading?'not-allowed':'pointer',opacity:repliesLoading?0.6:1,
              }}>
                {repliesLoading
                  ? <><span style={{display:'inline-block',width:10,height:10,border:'2px solid #22d3a5',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>Checking...</>
                  : '↻ Refresh'}
              </button>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'16px 24px'}}>
              {repliesLoading && !repliesLoaded ? (
                <div style={{textAlign:'center',padding:'60px 0',color:'#4A4F6A'}}>
                  <div style={{display:'inline-block',width:24,height:24,border:'3px solid #22d3a5',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite',marginBottom:12}}/>
                  <div style={{fontSize:13}}>Checking your inbox...</div>
                </div>
              ) : !repliesLoaded ? (
                <div style={{textAlign:'center',padding:'60px 0',color:'#4A4F6A'}}>
                  <div style={{fontSize:36,marginBottom:12}}>📬</div>
                  <div style={{fontSize:13}}>Click Refresh to load your inbox</div>
                </div>
              ) : replies.length === 0 ? (
                <div style={{textAlign:'center',padding:'60px 0',color:'#4A4F6A'}}>
                  <div style={{fontSize:36,marginBottom:12}}>✅</div>
                  <div style={{fontSize:14,fontWeight:700,color:'#fff',marginBottom:6}}>No replies yet</div>
                  <div style={{fontSize:12,lineHeight:1.6}}>Emails from your leads will appear here when they reply</div>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {replies.map((msg, i) => {
                    const isExpanded = expandedReply === i
                    const isLead = !!msg.lead
                    const seq = msg.lead ? sequences.find(s => s.lead_id === msg.lead.id) : null
                    const timeAgo = daysSince(msg.date)
                    return (
                      <div key={i} style={{
                        borderRadius:12,overflow:'hidden',
                        border:`1px solid ${!msg.seen?'rgba(34,211,165,0.2)':isLead?'rgba(0,246,255,0.1)':'rgba(255,255,255,0.06)'}`,
                        background:!msg.seen?'rgba(34,211,165,0.03)':'rgba(255,255,255,0.02)',
                      }}>
                        <div onClick={()=>setExpandedReply(isExpanded?null:i)} style={{
                          padding:'14px 18px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,
                        }}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                              {!msg.seen&&<span style={{width:7,height:7,borderRadius:'50%',background:'#22d3a5',flexShrink:0,display:'inline-block'}}/>}
                              <div style={{fontSize:13,fontWeight:!msg.seen?700:500,color:'#e8ecf0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                {msg.fromName||msg.from}
                              </div>
                              {isLead&&<span style={{fontSize:9,padding:'2px 6px',borderRadius:99,background:'rgba(0,246,255,0.1)',color:'#00F6FF',fontWeight:700,flexShrink:0}}>LEAD</span>}
                            </div>
                            <div style={{fontSize:12,color:'#c8cad8',marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{msg.subject}</div>
                            {!isExpanded&&<div style={{fontSize:11,color:'#4A4F6A',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{msg.snippet}</div>}
                          </div>
                          <div style={{fontSize:11,color:'#4A4F6A',flexShrink:0,textAlign:'right'}}>
                            {timeAgo===0?'Today':timeAgo===1?'Yesterday':`${timeAgo}d ago`}
                            {isLead&&<div style={{fontSize:10,color:'#4A4F6A',marginTop:2}}>{msg.lead.company}</div>}
                          </div>
                        </div>
                        {isExpanded&&(
                          <div style={{borderTop:'1px solid rgba(255,255,255,0.05)',padding:'14px 18px'}}>
                            <div style={{fontSize:11,color:'#4A4F6A',marginBottom:8}}>From: {msg.from}</div>
                            <pre style={{fontSize:12,lineHeight:1.8,color:'#c8cad8',whiteSpace:'pre-wrap',fontFamily:'inherit',margin:0,marginBottom:14}}>{msg.snippet||'(no preview available)'}</pre>
                            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                              {isLead&&seq&&!seq.replied&&(
                                <button onClick={async()=>{
                                  await fetch('/api/sequences',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({sequenceId:seq.id})})
                                  await loadSequences()
                                  setReplies(replies.map((r,j)=>j===i?{...r,seen:true}:r))
                                }} style={{padding:'7px 14px',borderRadius:8,border:'1px solid rgba(34,211,165,0.3)',background:'rgba(34,211,165,0.08)',color:'#22d3a5',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                                  ✓ Mark as Replied — stop sequence
                                </button>
                              )}
                              {isLead&&(
                                <button onClick={()=>{selectLead(msg.lead);setView('all');setStep('message')}} style={{padding:'7px 14px',borderRadius:8,border:'1px solid rgba(0,246,255,0.2)',background:'rgba(0,246,255,0.06)',color:'#00F6FF',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                                  Open lead →
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

        ) : !selected ? (
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12}}>
            <div style={{fontSize:40}}>🎯</div>
            <div style={{fontSize:15,fontWeight:700,color:'#fff'}}>Select a lead to begin</div>
            <div style={{fontSize:12,color:'#4A4F6A',textAlign:'center',maxWidth:320,lineHeight:1.6}}>
              Research the company → find their posts → send connection request → write DM or email
            </div>
          </div>

        ) : (
          <>
            {/* Header */}
            <div style={{padding:'14px 24px',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',gap:14,flexShrink:0}}>
              <div style={{width:38,height:38,borderRadius:10,background:'rgba(0,246,255,0.1)',border:'1px solid rgba(0,246,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,color:'#00F6FF',flexShrink:0}}>
                {(selected.first_name||selected.full_name||'?')[0]}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,color:'#fff',...b}}>{selected.full_name}</div>
                <div style={{fontSize:11,color:'#4A4F6A',marginTop:1}}>{selected.title} · <span style={b}>{selected.company}</span> · {selected.country}</div>
              </div>
              <div style={{display:'flex',gap:8,flexShrink:0,alignItems:'center'}}>
                {selected.email&&<div style={{padding:'4px 10px',borderRadius:6,background:'rgba(34,211,165,0.08)',border:'1px solid rgba(34,211,165,0.15)',fontSize:11,color:'#22d3a5'}}>✓ email</div>}
                {selected.linkedin_url&&<a href={selected.linkedin_url} target="_blank" rel="noreferrer" style={{padding:'4px 10px',borderRadius:6,background:'rgba(10,102,194,0.1)',border:'1px solid rgba(10,102,194,0.2)',fontSize:11,color:'#4a9eff',textDecoration:'none'}}>in LinkedIn</a>}
                {liStatus!=='none'&&<div style={{padding:'4px 10px',borderRadius:6,background:'rgba(34,211,165,0.08)',border:'1px solid rgba(34,211,165,0.15)',fontSize:11,color:'#22d3a5',textTransform:'capitalize'}}>● {liStatus}</div>}
                {selected.status==='not_interested'
                  ? <div style={{padding:'6px 14px',borderRadius:8,background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.2)',fontSize:12,color:'#f87171',fontWeight:600}}>✕ Discarded</div>
                  : <button onClick={discardLead} style={{padding:'6px 14px',borderRadius:8,border:'1px solid rgba(248,113,113,0.25)',background:'rgba(248,113,113,0.08)',color:'#f87171',fontSize:12,fontWeight:600,cursor:'pointer'}}>✕ Not Useful</button>
                }
              </div>
            </div>

            {/* Tabs */}
            <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.05)',flexShrink:0,overflowX:'auto'}}>
              {[
                {key:'research', label:'① Research'},
                {key:'posts',    label:'② Posts'},
                {key:'connect',  label:'③ Connect'},
                {key:'message',  label:hasEmail?'④ Email + DM':'④ DM'},
                {key:'activity', label:'⑤ Activity'},
              ].map(t=>(
                <button key={t.key} onClick={()=>{ setStep(t.key); if(t.key==='activity') loadActivity(selected) }} style={{
                  padding:'11px 18px',border:'none',cursor:'pointer',fontSize:12,fontWeight:step===t.key?600:400,
                  background:'transparent',color:step===t.key?'#00F6FF':'#4A4F6A',
                  borderBottom:step===t.key?'2px solid #00F6FF':'2px solid transparent',
                  marginBottom:-1,transition:'all 0.15s',whiteSpace:'nowrap',flexShrink:0,
                }}>{t.label}</button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{flex:1,overflowY:'auto',padding:'24px'}}>

              {/* ① Research */}
              {step==='research'&&(
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                    <div>
                      <div style={{fontSize:15,fontWeight:700,color:'#fff'}}>Company Research</div>
                      <div style={{fontSize:12,color:'#4A4F6A',marginTop:3}}>What {selected.company} does · why they&apos;re a good fit · key pain points</div>
                    </div>
                    <button onClick={runResearch} disabled={resWorking} style={{
                      display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:9,
                      border:'1px solid rgba(0,246,255,0.25)',background:resWorking?'rgba(0,246,255,0.03)':'rgba(0,246,255,0.1)',
                      color:'#00F6FF',fontSize:12,fontWeight:600,cursor:resWorking?'not-allowed':'pointer',opacity:resWorking?0.7:1,
                    }}>
                      {resWorking
                        ? <><span style={{display:'inline-block',width:11,height:11,border:'2px solid #00F6FF',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>Researching...</>
                        : <>⚡ {research?'Re-research':'Research Company'}</>}
                    </button>
                  </div>
                  {!research ? (
                    <div style={{textAlign:'center',padding:'60px 0',color:'#4A4F6A'}}>
                      <div style={{fontSize:36,marginBottom:12}}>🔍</div>
                      <div style={{fontSize:13}}>Click &quot;Research Company&quot; to analyse {selected.company}</div>
                    </div>
                  ) : (
                    <div>
                      <pre style={{fontSize:12,lineHeight:1.9,color:'#c8cad8',whiteSpace:'pre-wrap',fontFamily:'monospace',background:'#0d0d18',border:'1px solid rgba(255,255,255,0.05)',borderRadius:12,padding:20,marginBottom:16,...b}}>{research}</pre>
                      <button onClick={()=>setStep('posts')} style={{padding:'10px 20px',borderRadius:9,border:'1px solid rgba(0,246,255,0.2)',background:'rgba(0,246,255,0.08)',color:'#00F6FF',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                        Next: Find Their Posts →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ② Posts */}
              {step==='posts'&&(
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
                      {liWorking
                        ? <><span style={{display:'inline-block',width:11,height:11,border:'2px solid #4a9eff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>Searching...</>
                        : <><span style={{fontWeight:800}}>in</span> {liData?'Refresh':'Find Posts'}</>}
                    </button>
                  </div>
                  {!liData ? (
                    <div style={{textAlign:'center',padding:'60px 0',color:'#4A4F6A'}}>
                      <div style={{fontSize:36,marginBottom:12}}>📡</div>
                      <div style={{fontSize:13}}>Click &quot;Find Posts&quot; to search LinkedIn activity for {selected.company}</div>
                    </div>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:14}}>
                      {liData.linkedinPosts?.length>0&&(
                        <div style={{background:'#0d0d18',border:'1px solid rgba(34,211,165,0.15)',borderRadius:12,overflow:'hidden'}}>
                          <div style={{padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:12,fontWeight:600,color:'#22d3a5'}}>✓ Company posts found</div>
                          {liData.linkedinPosts.map((post,i)=>(
                            <div key={i} style={{padding:'12px 16px',borderBottom:i<liData.linkedinPosts.length-1?'1px solid rgba(255,255,255,0.03)':'none',fontSize:12,color:'#c8cad8',lineHeight:1.6}}>
                              &quot;{post.slice(0,200)}{post.length>200?'...':''}&quot;
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{background:'#0d0d18',border:'1px solid rgba(255,255,255,0.05)',borderRadius:12,overflow:'hidden'}}>
                        <div style={{padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:12,fontWeight:600,color:'#fff'}}>Search for their posts</div>
                        <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:8}}>
                          <a href={liData.searchUrls.companyPosts} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:8,padding:'9px 14px',borderRadius:8,background:'rgba(10,102,194,0.1)',border:'1px solid rgba(10,102,194,0.2)',color:'#4a9eff',textDecoration:'none',fontSize:12,fontWeight:500}}>
                            <span style={{fontWeight:800,fontSize:10}}>in</span> Search <span style={b}>{selected.company}</span>&apos;s LinkedIn posts →
                          </a>
                          <a href={liData.searchUrls.teamPosts} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:8,padding:'9px 14px',borderRadius:8,background:'rgba(96,165,250,0.08)',border:'1px solid rgba(96,165,250,0.15)',color:'#60a5fa',textDecoration:'none',fontSize:12,fontWeight:500}}>
                            🔍 Google: team members posting about ops/AI →
                          </a>
                          {selected.linkedin_url&&(
                            <a href={selected.linkedin_url} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:8,padding:'9px 14px',borderRadius:8,background:'rgba(167,139,250,0.08)',border:'1px solid rgba(167,139,250,0.15)',color:'#a78bfa',textDecoration:'none',fontSize:12,fontWeight:500}}>
                              👤 Open founder&apos;s LinkedIn profile →
                            </a>
                          )}
                        </div>
                      </div>
                      {liData.googlePostLinks?.length>0&&(
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

              {/* ③ Connect */}
              {step==='connect'&&(
                <div style={{maxWidth:500}}>
                  <div style={{fontSize:15,fontWeight:700,color:'#fff',marginBottom:4}}>Send Connection Request</div>
                  <div style={{fontSize:12,color:'#4A4F6A',marginBottom:28}}>Open <span style={b}>{selected.full_name}</span>&apos;s LinkedIn profile and hit Connect</div>
                  {liStatus==='connected'&&(
                    <div style={{padding:'18px 20px',borderRadius:12,background:'rgba(34,211,165,0.06)',border:'1px solid rgba(34,211,165,0.2)',marginBottom:20}}>
                      <div style={{fontSize:14,fontWeight:700,color:'#22d3a5',marginBottom:6}}>✅ Connected with <span style={b}>{selected.full_name}</span>!</div>
                      <div style={{fontSize:12,color:'#4A4F6A',marginBottom:14}}>You can now send them a DM directly on LinkedIn.</div>
                      <button onClick={()=>setStep('message')} style={{padding:'9px 18px',borderRadius:9,border:'1px solid rgba(0,246,255,0.2)',background:'rgba(0,246,255,0.08)',color:'#00F6FF',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                        Go to Message →
                      </button>
                    </div>
                  )}
                  {liStatus==='requested'&&(
                    <div style={{padding:'18px 20px',borderRadius:12,background:'rgba(251,146,60,0.06)',border:'1px solid rgba(251,146,60,0.2)',marginBottom:20}}>
                      <div style={{fontSize:14,fontWeight:700,color:'#fb923c',marginBottom:6}}>⏳ Request sent — waiting for <span style={b}>{selected.full_name}</span> to accept</div>
                      <div style={{fontSize:12,color:'#4A4F6A',marginBottom:14}}>Check your LinkedIn 🔔 bell. When they accept, click below.</div>
                      <button onClick={()=>updateLinkedInStatus('connected')} style={{padding:'9px 18px',borderRadius:9,border:'1px solid rgba(34,211,165,0.25)',background:'rgba(34,211,165,0.1)',color:'#22d3a5',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                        ✓ They Accepted — Go to DM
                      </button>
                    </div>
                  )}
                  {liStatus!=='connected'&&(
                    <div style={{display:'flex',flexDirection:'column',gap:12}}>
                      {selected.linkedin_url ? (
                        <a href={selected.linkedin_url} target="_blank" rel="noreferrer"
                          onClick={()=>{if(liStatus==='none') updateLinkedInStatus('requested')}}
                          style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'16px 24px',borderRadius:12,textDecoration:'none',background:'rgba(10,102,194,0.2)',border:'2px solid rgba(10,102,194,0.4)',color:'#4a9eff',fontSize:15,fontWeight:700,transition:'all 0.15s'}}>
                          <span style={{fontSize:18,fontWeight:900,fontFamily:'serif'}}>in</span>
                          Open <span style={b}>{selected.full_name}</span>&apos;s LinkedIn Profile →
                        </a>
                      ) : (
                        <a href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(selected.full_name+' '+selected.company)}`} target="_blank" rel="noreferrer"
                          onClick={()=>{if(liStatus==='none') updateLinkedInStatus('requested')}}
                          style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'16px 24px',borderRadius:12,textDecoration:'none',background:'rgba(10,102,194,0.15)',border:'2px solid rgba(10,102,194,0.3)',color:'#4a9eff',fontSize:15,fontWeight:700}}>
                          <span style={{fontSize:18,fontWeight:900,fontFamily:'serif'}}>in</span>
                          Search <span style={b}>{selected.full_name}</span> on LinkedIn →
                        </a>
                      )}
                      <div style={{fontSize:11,color:'#2a2d4a',textAlign:'center'}}>Clicking above opens LinkedIn and marks request as sent automatically</div>
                      {liStatus==='none'&&(
                        <button onClick={()=>updateLinkedInStatus('requested')} style={{padding:'10px',borderRadius:9,border:'1px solid rgba(255,255,255,0.06)',background:'transparent',color:'#4A4F6A',fontSize:12,cursor:'pointer'}}>
                          Already sent the request? Click here to mark it
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ④ Message */}
              {step==='message'&&(
                <div style={{display:'flex',flexDirection:'column',gap:16}}>

                  {/* LinkedIn DM section */}
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:'#fff',marginBottom:4}}>LinkedIn DM</div>
                    <div style={{fontSize:12,color:'#4A4F6A',marginBottom:14}}>
                      {liStatus==='connected'?<>✅ Connected with <span style={b}>{selected.full_name}</span> — paste this DM now</>:'Connect first, then send this DM'}
                    </div>
                    {!dmMsg ? (
                      <div style={{padding:'14px 18px',borderRadius:10,background:'rgba(251,146,60,0.06)',border:'1px solid rgba(251,146,60,0.15)',fontSize:12,color:'#fb923c',marginBottom:12}}>
                        ← Go to &quot;Posts&quot; tab and click &quot;Find Posts&quot; to generate the DM
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
                          style={{width:'100%',padding:'14px 16px',background:'transparent',border:'none',color:'#c8cad8',fontSize:13,lineHeight:1.8,outline:'none',resize:'none',fontFamily:'inherit',...b}}/>
                      </div>
                    )}
                    <div style={{display:'flex',gap:10}}>
                      {selected.linkedin_url&&(
                        <a href={selected.linkedin_url} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'9px 16px',borderRadius:9,background:'rgba(10,102,194,0.12)',border:'1px solid rgba(10,102,194,0.25)',color:'#4a9eff',fontSize:12,fontWeight:600,textDecoration:'none'}}>
                          <span style={{fontWeight:800}}>in</span> Open LinkedIn to Send
                        </a>
                      )}
                      {dmMsg&&(
                        <button onClick={saveDM} style={{padding:'9px 16px',borderRadius:9,border:`1px solid ${dmSaved?'rgba(34,211,165,0.25)':'rgba(255,255,255,0.08)'}`,background:dmSaved?'rgba(34,211,165,0.08)':'rgba(255,255,255,0.03)',color:dmSaved?'#22d3a5':'#4A4F6A',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                          {dmSaved?'✓ Saved':'Save Draft'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Email section */}
                  {hasEmail&&(
                    <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:20}}>
                      <div style={{fontSize:15,fontWeight:700,color:'#fff',marginBottom:4}}>Email</div>
                      <div style={{fontSize:12,color:'#4A4F6A',marginBottom:14}}>✓ <span style={b}>{selected.email}</span></div>

                      {/* OPEN TRACKING BANNER */}
                      {seqIsActive&&currentSeq?.opened_at&&!seqIsDue&&(
                        <div style={{padding:'12px 16px',borderRadius:10,background:'rgba(0,246,255,0.04)',border:'1px solid rgba(0,246,255,0.15)',marginBottom:12,display:'flex',alignItems:'center',gap:10}}>
                          <span style={{fontSize:18}}>👁</span>
                          <div>
                            <div style={{fontSize:12,fontWeight:700,color:'#00F6FF'}}>They opened your email!</div>
                            <div style={{fontSize:11,color:'#4A4F6A',marginTop:2}}>
                              Opened {daysSince(currentSeq.opened_at)===0?'today':daysSince(currentSeq.opened_at)===1?'yesterday':`${daysSince(currentSeq.opened_at)} days ago`} · Good time to follow up or connect on LinkedIn
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SEQUENCE STATUS BANNER */}
                      {currentSeq?.replied&&(
                        <div style={{padding:'16px 20px',borderRadius:12,background:'rgba(34,211,165,0.06)',border:'1px solid rgba(34,211,165,0.2)',marginBottom:16}}>
                          <div style={{fontSize:14,fontWeight:700,color:'#22d3a5',marginBottom:4}}>💬 They replied!</div>
                          <div style={{fontSize:12,color:'#4A4F6A'}}>This lead is marked as replied — sequence complete. No further emails scheduled.</div>
                        </div>
                      )}
                      {currentSeq?.complete&&!currentSeq.replied&&(
                        <div style={{padding:'16px 20px',borderRadius:12,background:'rgba(74,79,106,0.08)',border:'1px solid rgba(74,79,106,0.2)',marginBottom:16}}>
                          <div style={{fontSize:14,fontWeight:700,color:'#4A4F6A',marginBottom:4}}>⚫ Sequence complete</div>
                          <div style={{fontSize:12,color:'#4A4F6A'}}>3 emails sent — no reply received. No further contact scheduled.</div>
                          <button onClick={markReplied} style={{marginTop:10,padding:'6px 14px',borderRadius:8,border:'1px solid rgba(34,211,165,0.25)',background:'rgba(34,211,165,0.06)',color:'#22d3a5',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                            Actually they did reply — mark as replied
                          </button>
                        </div>
                      )}
                      {seqIsActive&&!seqIsDue&&(
                        <div style={{padding:'16px 20px',borderRadius:12,background:'rgba(251,191,36,0.04)',border:'1px solid rgba(251,191,36,0.15)',marginBottom:16}}>
                          <div style={{fontSize:13,fontWeight:700,color:'#fbbf24',marginBottom:4}}>
                            🟡 Email sent — waiting for reply
                          </div>
                          <div style={{fontSize:12,color:'#4A4F6A',marginBottom:10}}>
                            Step {currentSeq.step}/3 · Angle: {ANGLE_NAMES[currentSeq.angle_number]||'—'} ·
                            Follow-up due in {daysUntil(currentSeq.next_due_at)} day{daysUntil(currentSeq.next_due_at)!==1?'s':''}
                          </div>
                          <div style={{display:'flex',gap:8}}>
                            <button onClick={markReplied} style={{padding:'6px 14px',borderRadius:8,border:'1px solid rgba(34,211,165,0.25)',background:'rgba(34,211,165,0.06)',color:'#22d3a5',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                              ✓ They replied — mark done
                            </button>
                          </div>
                        </div>
                      )}
                      {seqIsActive&&seqIsDue&&(
                        <div style={{padding:'16px 20px',borderRadius:12,background:'rgba(248,113,113,0.04)',border:'1px solid rgba(248,113,113,0.2)',marginBottom:16}}>
                          <div style={{fontSize:13,fontWeight:700,color:'#f87171',marginBottom:4}}>
                            🔴 Follow-up {seqNextStep===2?'1':'2'} is due — send now
                          </div>
                          <div style={{fontSize:12,color:'#4A4F6A',marginBottom:12}}>
                            Step {currentSeq.step}/3 · was due {Math.abs(daysUntil(currentSeq.next_due_at))} day{Math.abs(daysUntil(currentSeq.next_due_at))!==1?'s':''} ago
                          </div>
                          {/* Preview the follow-up */}
                          <pre style={{fontSize:12,lineHeight:1.8,color:'#c8cad8',whiteSpace:'pre-wrap',fontFamily:'monospace',background:'#080810',border:'1px solid rgba(255,255,255,0.05)',borderRadius:10,padding:14,marginBottom:14,...b}}>
                            {FOLLOWUP_PREVIEWS[seqNextStep]?.(selected.first_name||selected.full_name?.split(' ')[0]||'there')||''}
                          </pre>
                          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                            <button onClick={sendFollowup} disabled={followupSending||followupSent} style={{
                              display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:9,fontSize:13,fontWeight:700,
                              cursor:followupSending||followupSent?'not-allowed':'pointer',border:'none',
                              background:followupSent?'rgba(34,211,165,0.15)':'rgba(248,113,113,0.2)',
                              color:followupSent?'#22d3a5':'#f87171',
                              opacity:followupSending?0.7:1,
                            }}>
                              {followupSending
                                ? <><span style={{display:'inline-block',width:12,height:12,border:'2px solid #f87171',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>Sending...</>
                                : followupSent
                                ? '✓ Follow-up Sent!'
                                : `✉ Send Follow-up ${seqNextStep===2?'1':'2'}`}
                            </button>
                            <button onClick={markReplied} style={{padding:'10px 16px',borderRadius:9,border:'1px solid rgba(34,211,165,0.2)',background:'rgba(34,211,165,0.06)',color:'#22d3a5',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                              ✓ They replied instead
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Normal compose — only show if no active sequence yet */}
                      {!currentSeq&&(
                        <>
                          {!resBody ? (
                            <div style={{padding:'14px 18px',borderRadius:10,background:'rgba(251,146,60,0.06)',border:'1px solid rgba(251,146,60,0.15)',fontSize:12,color:'#fb923c'}}>
                              ← Go to &quot;Research&quot; tab first to generate the email (will use Proof-first angle)
                            </div>
                          ) : (
                            <>
                              <div style={{background:'#0d0d18',border:'1px solid rgba(34,211,165,0.12)',borderRadius:12,overflow:'hidden',marginBottom:10}}>
                                <div style={{padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,0.04)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                  <span style={{fontSize:12,fontWeight:600,color:'#22d3a5'}}>✉ Subject</span>
                                  <button onClick={()=>copyText(resSubject,'subj')} style={{fontSize:11,padding:'3px 10px',borderRadius:6,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',color:copied==='subj'?'#22d3a5':'#4A4F6A',cursor:'pointer'}}>
                                    {copied==='subj'?'✓ Copied':'Copy'}
                                  </button>
                                </div>
                                <input value={resSubject} onChange={e=>setResSubject(e.target.value)}
                                  style={{width:'100%',padding:'12px 16px',background:'transparent',border:'none',color:'#e8ecf0',fontSize:14,fontWeight:500,outline:'none',...b}}/>
                              </div>
                              <div style={{background:'#0d0d18',border:'1px solid rgba(34,211,165,0.12)',borderRadius:12,overflow:'hidden',marginBottom:10}}>
                                <div style={{padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,0.04)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                  <span style={{fontSize:12,fontWeight:600,color:'#22d3a5'}}>✉ Body · Angle: {ANGLE_NAMES[variation]}</span>
                                  <div style={{display:'flex',gap:6}}>
                                    <button onClick={regenerateEmail} disabled={regenerating} style={{
                                      fontSize:11,padding:'3px 10px',borderRadius:6,
                                      border:'1px solid rgba(167,139,250,0.3)',
                                      background:regenerating?'transparent':'rgba(167,139,250,0.08)',
                                      color:regenerating?'#4A4F6A':'#a78bfa',
                                      cursor:regenerating?'not-allowed':'pointer',
                                      display:'flex',alignItems:'center',gap:4,
                                    }}>
                                      {regenerating
                                        ? <><span style={{display:'inline-block',width:9,height:9,border:'1.5px solid #a78bfa',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>Writing...</>
                                        : `↻ Regenerate (v${variation+1}/4)`}
                                    </button>
                                    <button onClick={()=>copyText(resBody,'body')} style={{fontSize:11,padding:'3px 10px',borderRadius:6,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',color:copied==='body'?'#22d3a5':'#4A4F6A',cursor:'pointer'}}>
                                      {copied==='body'?'✓ Copied':'Copy'}
                                    </button>
                                  </div>
                                </div>
                                <textarea value={resBody} onChange={e=>setResBody(e.target.value)} rows={12}
                                  style={{width:'100%',padding:'14px 16px',background:'transparent',border:'none',color:'#c8cad8',fontSize:13,lineHeight:1.8,outline:'none',resize:'none',fontFamily:'inherit',...b}}/>
                              </div>
                              {/* ─── Email Score Badge ─── */}
                              {emailScore && (
                                <div style={{marginBottom:12,padding:'12px 16px',borderRadius:10,border:`1px solid ${emailScore.grade==='pass'?'rgba(34,211,165,0.25)':emailScore.grade==='warn'?'rgba(251,191,36,0.25)':'rgba(239,68,68,0.25)'}`,background:emailScore.grade==='pass'?'rgba(34,211,165,0.05)':emailScore.grade==='warn'?'rgba(251,191,36,0.05)':'rgba(239,68,68,0.05)'}}>
                                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom: emailScore.problems.length>0?10:0}}>
                                    <div style={{display:'flex',gap:12,alignItems:'center'}}>
                                      <span style={{fontSize:12,fontWeight:700,color:emailScore.grade==='pass'?'#22d3a5':emailScore.grade==='warn'?'#fbbf24':'#ef4444'}}>
                                        {emailScore.grade==='pass'?'✓':'⚠'} Human score: {emailScore.aiScore}/100
                                      </span>
                                      <span style={{fontSize:11,color:'#4A4F6A'}}>
                                        Personalisation: {emailScore.personalisationScore}/100
                                      </span>
                                      <span style={{fontSize:11,color:'#4A4F6A'}}>
                                        {emailScore.wordCount}w
                                      </span>
                                    </div>
                                    {emailScore.grade !== 'pass' && (
                                      <button onClick={refineEmailNow} disabled={refining} style={{
                                        fontSize:11,padding:'4px 12px',borderRadius:6,border:'1px solid rgba(167,139,250,0.4)',
                                        background:refining?'transparent':'rgba(167,139,250,0.1)',color:refining?'#4A4F6A':'#a78bfa',
                                        cursor:refining?'not-allowed':'pointer',display:'flex',alignItems:'center',gap:5,
                                      }}>
                                        {refining
                                          ? <><span style={{display:'inline-block',width:8,height:8,border:'1.5px solid #a78bfa',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>Refining...</>
                                          : '✦ Refine'}
                                      </button>
                                    )}
                                  </div>
                                  {emailScore.problems.length > 0 && (
                                    <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                                      {emailScore.problems.map((p, i) => (
                                        <span key={i} style={{
                                          fontSize:10,padding:'2px 8px',borderRadius:4,
                                          background:p.severity==='high'?'rgba(239,68,68,0.12)':p.severity==='medium'?'rgba(251,191,36,0.10)':'rgba(148,163,184,0.08)',
                                          color:p.severity==='high'?'#ef4444':p.severity==='medium'?'#fbbf24':'#64748b',
                                          border:`1px solid ${p.severity==='high'?'rgba(239,68,68,0.2)':p.severity==='medium'?'rgba(251,191,36,0.15)':'rgba(148,163,184,0.1)'}`,
                                        }}>
                                          {p.type==='ai_phrase'?`"${p.text}"`:p.text}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
                                <button onClick={sendEmail} disabled={emailSending||emailSent} style={{
                                  display:'flex',alignItems:'center',gap:7,padding:'11px 22px',borderRadius:9,fontSize:13,fontWeight:700,
                                  cursor:emailSending||emailSent?'not-allowed':'pointer',border:'none',
                                  background:emailSent?'rgba(34,211,165,0.15)':'linear-gradient(135deg,rgba(0,246,255,0.3),rgba(0,246,255,0.15))',
                                  color:emailSent?'#22d3a5':'#00F6FF',
                                  boxShadow:emailSent?'none':'0 0 20px rgba(0,246,255,0.15)',
                                  opacity:emailSending?0.7:1,
                                }}>
                                  {emailSending
                                    ? <><span style={{display:'inline-block',width:13,height:13,border:'2px solid #00F6FF',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>Sending...</>
                                    : emailSent?'✓ Email Sent!':'✉ Send Email from antonyv@blendery.tech'}
                                </button>
                                <button onClick={saveEmail} style={{padding:'11px 18px',borderRadius:9,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',color:emailSaved?'#22d3a5':'#4A4F6A',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                                  {emailSaved?'✓ Saved':'Save Draft'}
                                </button>
                              </div>
                            </>
                          )}
                        </>
                      )}

                      {/* If sequence is complete or replied, still allow viewing the original email body */}
                      {currentSeq&&(currentSeq.complete||currentSeq.replied)&&resBody&&(
                        <div style={{marginTop:16}}>
                          <div style={{fontSize:12,color:'#2a2d4a',marginBottom:8}}>Original email sent:</div>
                          <pre style={{fontSize:12,lineHeight:1.8,color:'#4A4F6A',whiteSpace:'pre-wrap',fontFamily:'monospace',background:'#0d0d18',border:'1px solid rgba(255,255,255,0.04)',borderRadius:10,padding:16,...b}}>{resBody}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ⑤ Activity */}
              {step==='activity'&&(
                <div>
                  <div style={{marginBottom:20}}>
                    <div style={{fontSize:15,fontWeight:700,color:'#fff',marginBottom:4}}>Activity Timeline</div>
                    <div style={{fontSize:12,color:'#4A4F6A'}}>Every email, follow-up and LinkedIn event for <span style={b}>{selected.full_name}</span></div>
                  </div>

                  {activityLoading ? (
                    <div style={{textAlign:'center',padding:'60px 0',color:'#4A4F6A'}}>
                      <div style={{display:'inline-block',width:24,height:24,border:'3px solid #00F6FF',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite',marginBottom:12}}/>
                      <div style={{fontSize:13}}>Loading activity…</div>
                    </div>
                  ) : !activityData ? null : (() => {
                    const { outreach, sequences: seqs } = activityData
                    const seq = seqs[0] || null

                    // Build timeline events
                    const events = []

                    // LinkedIn events
                    if (selected.linkedin_requested_at) {
                      events.push({ date: selected.linkedin_requested_at, type: 'linkedin', icon: '🔗', label: 'LinkedIn connection request sent', color: '#4a9eff', bg: 'rgba(74,158,255,0.06)', border: 'rgba(74,158,255,0.15)' })
                    }
                    if (selected.linkedin_status === 'connected') {
                      events.push({ date: selected.linkedin_requested_at, type: 'linkedin', icon: '✅', label: 'LinkedIn connection accepted', color: '#22d3a5', bg: 'rgba(34,211,165,0.06)', border: 'rgba(34,211,165,0.15)' })
                    }

                    // Outreach emails
                    outreach.forEach(o => {
                      const isFollowup = o.type === 'followup' || (o.subject||'').startsWith('Re:')
                      events.push({
                        date: o.created_at,
                        type: 'email',
                        icon: isFollowup ? '↩' : '✉',
                        label: isFollowup ? `Follow-up email sent` : `Initial email sent`,
                        sub: o.subject ? `Subject: ${o.subject}` : null,
                        status: o.status,
                        color: o.status==='sent' ? '#22d3a5' : '#f87171',
                        bg: o.status==='sent' ? 'rgba(34,211,165,0.06)' : 'rgba(248,113,113,0.06)',
                        border: o.status==='sent' ? 'rgba(34,211,165,0.15)' : 'rgba(248,113,113,0.15)',
                      })
                    })

                    // Sort by date
                    events.sort((a,b) => new Date(a.date) - new Date(b.date))

                    const fmt = (d) => {
                      if (!d) return '—'
                      const dt = new Date(d)
                      return dt.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) + ' · ' + dt.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })
                    }

                    return (
                      <div>
                        {/* Sequence status card */}
                        {seq && (
                          <div style={{marginBottom:24,padding:'16px 20px',borderRadius:12,background:'rgba(0,246,255,0.04)',border:'1px solid rgba(0,246,255,0.1)'}}>
                            <div style={{fontSize:11,fontWeight:700,color:'#00F6FF',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10}}>Current Sequence Status</div>
                            <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
                              <div>
                                <div style={{fontSize:11,color:'#4A4F6A',marginBottom:3}}>Step</div>
                                <div style={{fontSize:15,fontWeight:700,color:'#fff'}}>{seq.step} / 3</div>
                              </div>
                              <div>
                                <div style={{fontSize:11,color:'#4A4F6A',marginBottom:3}}>Status</div>
                                <div style={{fontSize:13,fontWeight:600,color: seq.replied?'#22d3a5':seq.complete?'#4A4F6A':'#fbbf24'}}>
                                  {seq.replied ? '💬 Replied' : seq.complete ? '⚫ Complete' : '🟡 Active'}
                                </div>
                              </div>
                              {!seq.complete && !seq.replied && seq.next_due_at && (
                                <div>
                                  <div style={{fontSize:11,color:'#4A4F6A',marginBottom:3}}>Next follow-up due</div>
                                  <div style={{fontSize:13,fontWeight:600,color: new Date(seq.next_due_at)<=new Date()?'#f87171':'#e8ecf0'}}>
                                    {fmt(seq.next_due_at)}
                                  </div>
                                </div>
                              )}
                              {seq.last_sent_at && (
                                <div>
                                  <div style={{fontSize:11,color:'#4A4F6A',marginBottom:3}}>Last sent</div>
                                  <div style={{fontSize:13,color:'#c8cad8'}}>{fmt(seq.last_sent_at)}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Timeline */}
                        {events.length === 0 ? (
                          <div style={{textAlign:'center',padding:'60px 0',color:'#4A4F6A'}}>
                            <div style={{fontSize:36,marginBottom:12}}>📭</div>
                            <div style={{fontSize:13}}>No activity yet for this lead</div>
                          </div>
                        ) : (
                          <div style={{position:'relative'}}>
                            {/* vertical line */}
                            <div style={{position:'absolute',left:19,top:24,bottom:24,width:1,background:'rgba(255,255,255,0.06)'}}/>
                            <div style={{display:'flex',flexDirection:'column',gap:12}}>
                              {events.map((ev,i) => (
                                <div key={i} style={{display:'flex',gap:16,alignItems:'flex-start'}}>
                                  <div style={{
                                    width:38,height:38,borderRadius:10,flexShrink:0,
                                    background:ev.bg,border:`1px solid ${ev.border}`,
                                    display:'flex',alignItems:'center',justifyContent:'center',
                                    fontSize:16,position:'relative',zIndex:1,
                                  }}>{ev.icon}</div>
                                  <div style={{flex:1,paddingTop:8}}>
                                    <div style={{fontSize:13,fontWeight:600,color:ev.color,marginBottom:2}}>{ev.label}</div>
                                    {ev.sub && <div style={{fontSize:11,color:'#c8cad8',marginBottom:2,...b}}>{ev.sub}</div>}
                                    <div style={{fontSize:11,color:'#4A4F6A'}}>{fmt(ev.date)}</div>
                                    {ev.status && ev.status!=='sent' && (
                                      <div style={{fontSize:11,color:'#f87171',marginTop:2}}>⚠ Status: {ev.status}</div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}

            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
