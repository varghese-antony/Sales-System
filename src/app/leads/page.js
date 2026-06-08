'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const statusStyle = {
  new:           {bg:'rgba(167,139,250,0.1)',color:'#a78bfa'},
  contacted:     {bg:'rgba(96,165,250,0.1)', color:'#60a5fa'},
  replied:       {bg:'rgba(251,146,60,0.1)', color:'#fb923c'},
  interested:    {bg:'rgba(34,211,165,0.1)', color:'#22d3a5'},
  not_interested:{bg:'rgba(248,113,113,0.1)',color:'#f87171'},
  client:        {bg:'rgba(0,246,255,0.1)',  color:'#00F6FF'},
}
const sourceStyle = {
  hunter:        { bg:'rgba(0,246,255,0.08)',   color:'#00F6FF',  icon:'🎯', label:'Hunter' },
  'cron-daily':  { bg:'rgba(0,246,255,0.08)',   color:'#00F6FF',  icon:'🎯', label:'Hunter' },
  linkedin:      { bg:'rgba(10,102,194,0.15)',  color:'#4a9eff',  icon:'in', label:'LinkedIn' },
  google:        { bg:'rgba(66,133,244,0.12)',  color:'#6baeff',  icon:'G',  label:'Google' },
  'google-maps': { bg:'rgba(66,133,244,0.12)',  color:'#6baeff',  icon:'📍', label:'Maps' },
  producthunt:   { bg:'rgba(255,99,55,0.12)',   color:'#ff6337',  icon:'🐱', label:'PH' },
  curated:       { bg:'rgba(167,139,250,0.1)',  color:'#a78bfa',  icon:'★',  label:'Curated' },
  manual:        { bg:'rgba(251,146,60,0.1)',   color:'#fb923c',  icon:'✎',  label:'Manual' },
  csv:           { bg:'rgba(167,139,250,0.1)',  color:'#a78bfa',  icon:'📄', label:'CSV' },
}
const getSource = s => sourceStyle[s] || { bg:'rgba(255,255,255,0.05)', color:'#4A4F6A', icon:'?', label: s||'Unknown' }
const sc = s => s>=8?'#22d3a5':s>=6?'#00F6FF':'#4A4F6A'

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [finding, setFinding] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [csvLoading, setCsvLoading] = useState(false)
  const [mapsProgress, setMapsProgress] = useState(null)
  const [phLoading, setPhLoading] = useState(false)
  const [enrichingId, setEnrichingId] = useState(null)
  const [enrichAllProgress, setEnrichAllProgress] = useState(null)
  const [sequencedIds, setSequencedIds] = useState(new Set())
  const [markingId, setMarkingId] = useState(null)
  const [showMarkModal, setShowMarkModal] = useState(null) // lead object
  const [autoSendStatus, setAutoSendStatus] = useState(null)
  const [togglingAutoSend, setTogglingAutoSend] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [enrichJob, setEnrichJob] = useState(null) // { status, done, total, found }

  // Google Maps search labels for progress display (mirrors route.js SEARCHES order)
  const MAPS_SEARCHES = [
    'Marketing Agencies · London','Marketing Agencies · Manchester','Marketing Agencies · Dublin',
    'Marketing Agencies · Sydney','Marketing Agencies · Melbourne','Marketing Agencies · Dubai',
    'Marketing Agencies · Singapore','Marketing Agencies · New York','Marketing Agencies · LA',
    'Marketing Agencies · Chicago','Marketing Agencies · Austin','Marketing Agencies · Miami',
    'Consulting · London','Consulting · Dublin','Consulting · Sydney','Consulting · Dubai',
    'Consulting · Singapore','Consulting · New York','Consulting · San Francisco',
    'Consulting · Chicago','Consulting · Austin',
    'SaaS · London','SaaS · Dublin','SaaS · Sydney','SaaS · Singapore',
    'SaaS · New York','SaaS · San Francisco','SaaS · Austin','SaaS · Boston','SaaS · Seattle',
    'E-commerce · London','E-commerce · Melbourne','E-commerce · New York',
    'E-commerce · Los Angeles','E-commerce · Dubai',
    'Recruitment · London','Recruitment · Dublin','Recruitment · Sydney',
    'Recruitment · New York','Recruitment · Chicago','Recruitment · Atlanta','Recruitment · Singapore',
    'Accounting · London','Accounting · Dublin','Accounting · Sydney',
    'Accounting · New York','Accounting · Chicago','Accounting · Dubai',
    'PR Agency · London','PR Agency · New York','PR Agency · Los Angeles',
    'PR Agency · Sydney','PR Agency · Singapore',
    'Legal Tech · London','Legal Tech · Sydney','Legal Tech · New York',
    'Legal Tech · Chicago','Legal Tech · Singapore',
    'PropTech · London','PropTech · Dubai','PropTech · Sydney',
    'PropTech · New York','PropTech · Miami',
    'HR Tech · London','HR Tech · New York','HR Tech · San Francisco',
    'HR Tech · Sydney','HR Tech · Singapore',
    'FinTech · London','FinTech · Dublin','FinTech · New York','FinTech · San Francisco',
    'FinTech · Sydney','FinTech · Singapore','FinTech · Dubai',
    'EdTech · London','EdTech · New York','EdTech · Sydney','EdTech · Singapore',
    'Events · London','Events · Dubai','Events · New York','Events · Sydney',
    'Creative Agency · London','Creative Agency · New York','Creative Agency · Los Angeles',
    'Creative Agency · Sydney','Creative Agency · Singapore',
    'HealthTech · London','HealthTech · New York','HealthTech · San Francisco',
    'HealthTech · Sydney','HealthTech · Singapore',
    'Logistics · London','Logistics · New York','Logistics · Dubai','Logistics · Singapore',
  ]

  useEffect(()=>{ load(); loadAutoSendStatus(); loadSequencedIds(); loadEnrichJob() },[])

  // Poll enrichment job status every 4s while running
  useEffect(() => {
    if (!enrichJob || enrichJob.status !== 'running') return
    const t = setInterval(async () => {
      const status = await loadEnrichJob()
      if (status !== 'running') {
        clearInterval(t)
        load() // refresh leads table once done
      }
    }, 4000)
    return () => clearInterval(t)
  }, [enrichJob?.status])

  async function loadSequencedIds() {
    const { data } = await supabase.from('sequences').select('lead_id')
    setSequencedIds(new Set((data || []).map(s => s.lead_id)))
  }

  async function markEmailed(lead, subject) {
    setMarkingId(lead.id)
    try {
      const r = await fetch('/api/mark-emailed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, subject }),
      })
      const d = await r.json()
      if (d.success) {
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'contacted' } : l))
        setSequencedIds(prev => new Set([...prev, lead.id]))
        setToast({ type: 'ok', msg: `✓ ${lead.company} marked — follow-up will fire in 3 days` })
      } else {
        setToast({ type: 'err', msg: d.error || 'Failed to mark as emailed' })
      }
    } catch {
      setToast({ type: 'err', msg: 'Something went wrong' })
    }
    setMarkingId(null)
    setShowMarkModal(null)
    setTimeout(() => setToast(null), 5000)
  }

  async function loadEnrichJob() {
    try {
      const r = await fetch('/api/enrich-all-background')
      const d = await r.json()
      setEnrichJob(d)
      return d.status
    } catch { return 'idle' }
  }

  async function loadAutoSendStatus() {
    try {
      const r = await fetch('/api/auto-send-status')
      const d = await r.json()
      setAutoSendStatus(d)
    } catch {}
  }

  async function toggleAutoSend() {
    if (!autoSendStatus) return
    setTogglingAutoSend(true)
    const newEnabled = !autoSendStatus.enabled
    try {
      const r = await fetch('/api/auto-send-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled }),
      })
      const d = await r.json()
      if (d.success) {
        setAutoSendStatus(prev => ({ ...prev, enabled: newEnabled }))
        setToast({ type: newEnabled ? 'ok' : 'info', msg: newEnabled ? '✅ Auto-send enabled — emails will go out Mon–Fri automatically' : 'Auto-send paused' })
        setTimeout(() => setToast(null), 5000)
      }
    } catch {}
    setTogglingAutoSend(false)
  }

  async function syncSent() {
    setSyncing(true)
    setToast({ type: 'info', msg: 'Scanning Sent folder...' })
    try {
      const r = await fetch('/api/sync-sent', { method: 'POST' })
      const d = await r.json()
      if (d.success) {
        setToast({ type: 'ok', msg: d.message || `Sync done — ${d.synced} leads enrolled` })
        await loadAutoSendStatus()
        await loadSequencedIds()
        await load()
      } else {
        setToast({ type: 'err', msg: d.error || 'Sync failed' })
      }
    } catch {
      setToast({ type: 'err', msg: 'Sync failed — check connection' })
    }
    setSyncing(false)
    setTimeout(() => setToast(null), 7000)
  }

  async function load() {
    setLoading(true)
    const {data} = await supabase.from('leads').select('*').order('score',{ascending:false})
    setLeads(data||[])
    setLoading(false)
  }

  async function find() {
    setFinding(true)
    setToast({type:'info',msg:'Searching for ideal clients...'})
    const r = await fetch('/api/find-leads',{method:'POST'})
    const d = await r.json()
    setToast(d.success?{type:'ok',msg:`${d.count} new leads added`}:{type:'err',msg:'Error — please try again'})
    if(d.success) await load()
    setFinding(false)
    setTimeout(()=>setToast(null),4000)
  }

  async function importGoogleMaps() {
    let totalAdded = 0
    let totalSkipped = 0
    for (let i = 0; i < MAPS_SEARCHES.length; i++) {
      setMapsProgress({ step: i + 1, total: MAPS_SEARCHES.length, label: MAPS_SEARCHES[i] })
      try {
        const r = await fetch('/api/import-google-maps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searchIndex: i }),
        })
        const d = await r.json()
        if (d.success) { totalAdded += d.added || 0; totalSkipped += d.skipped || 0 }
      } catch {}
    }
    setMapsProgress(null)
    setToast({ type: 'ok', msg: `Google Maps done — ${totalAdded} new leads added, ${totalSkipped} skipped` })
    await load()
    setTimeout(() => setToast(null), 7000)
  }

  async function importProductHunt() {
    setPhLoading(true)
    setToast({ type: 'info', msg: 'Scraping ProductHunt topics...' })
    try {
      const r = await fetch('/api/import-producthunt', { method: 'POST' })
      const d = await r.json()
      setToast(d.success
        ? { type: 'ok', msg: `ProductHunt done — ${d.added} new leads added, ${d.skipped} skipped` }
        : { type: 'err', msg: d.error || 'ProductHunt import failed' }
      )
      if (d.success) await load()
    } catch {
      setToast({ type: 'err', msg: 'ProductHunt import failed' })
    }
    setPhLoading(false)
    setTimeout(() => setToast(null), 7000)
  }

  async function importCSV(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvLoading(true)
    setToast({type:'info', msg:'Importing CSV...'})
    const formData = new FormData()
    formData.append('file', file)
    const r = await fetch('/api/import-leads', {method:'POST', body:formData})
    const d = await r.json()
    setCsvLoading(false)
    setToast(d.success
      ? {type:'ok', msg:`CSV imported — ${d.added} new leads added, ${d.skipped} skipped`}
      : {type:'err', msg: d.error || 'Import failed'}
    )
    if (d.success) await load()
    setTimeout(()=>setToast(null),6000)
    // Reset file input
    e.target.value = ''
  }

  async function enrichLead(id) {
    setEnrichingId(id)
    try {
      const r = await fetch('/api/enrich-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: id }),
      })
      const d = await r.json()
      if (d.success) {
        // Update this lead in local state immediately
        setLeads(prev => prev.map(l => {
          if (l.id !== id) return l
          return {
            ...l,
            full_name: d.founderName || l.full_name,
            first_name: (d.founderName || l.full_name || '').split(' ')[0] || l.first_name,
            email: d.email || l.email,
          }
        }))
        const msg = []
        if (d.founderName) msg.push(`Found: ${d.founderName}`)
        if (d.email) msg.push(`Email: ${d.email}`)
        if (d.emailPatterns?.length) msg.push(`${d.emailPatterns.length} email patterns saved to notes`)
        if (!msg.length) msg.push('No new info found — try adding email manually')
        setToast({ type: msg.length && d.email ? 'ok' : 'info', msg: msg.join(' · ') })
      } else {
        setToast({ type: 'err', msg: d.error || 'Enrich failed' })
      }
    } catch {
      setToast({ type: 'err', msg: 'Enrich failed — check connection' })
    }
    setEnrichingId(null)
    setTimeout(() => setToast(null), 6000)
  }

  async function enrichAll() {
    // Start server-side background enrichment — survives page navigation
    if (enrichJob?.status === 'running') {
      setToast({ type: 'info', msg: 'Enrichment already running in background — you can navigate freely' })
      setTimeout(() => setToast(null), 4000)
      return
    }
    try {
      const r = await fetch('/api/enrich-all-background', { method: 'POST' })
      const d = await r.json()
      if (d.total === 0) {
        setToast({ type: 'info', msg: 'All leads with websites already have emails' })
        setTimeout(() => setToast(null), 4000)
        return
      }
      setToast({ type: 'ok', msg: `✦ Enriching ${d.total} leads in background — you can navigate away, it keeps running` })
      setTimeout(() => setToast(null), 7000)
      await loadEnrichJob()
    } catch {
      setToast({ type: 'err', msg: 'Failed to start enrichment' })
      setTimeout(() => setToast(null), 4000)
    }
  }

  async function setStatus(id,status) {
    await supabase.from('leads').update({status}).eq('id',id)
    setLeads(leads.map(l=>l.id===id?{...l,status}:l))
  }

  const filtered = leads.filter(l=>{
    const mf = filter==='all'||l.status===filter
    const ms = !search||(l.full_name||'').toLowerCase().includes(search.toLowerCase())||(l.company||'').toLowerCase().includes(search.toLowerCase())
    return mf&&ms
  })

  return (
    <div style={{padding:'32px 36px',maxWidth:1300}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:28}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:'#fff',letterSpacing:'-0.02em'}}>Leads</h1>
          <p style={{fontSize:13,color:'#4A4F6A',marginTop:4}}>{leads.length} leads in database</p>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>

          {/* Google Maps Import */}
          <button onClick={importGoogleMaps} disabled={!!mapsProgress} style={{
            display:'flex',alignItems:'center',gap:6,padding:'9px 14px',borderRadius:10,
            border:'1px solid rgba(66,133,244,0.35)',cursor:mapsProgress?'default':'pointer',
            background:mapsProgress?'rgba(66,133,244,0.03)':'rgba(66,133,244,0.1)',
            color:'#6baeff',fontSize:13,fontWeight:600,transition:'all 0.2s',opacity:mapsProgress?0.8:1,
            whiteSpace:'nowrap',
          }}>
            {mapsProgress
              ? <><span style={{display:'inline-block',width:11,height:11,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
                  <span style={{maxWidth:280,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{mapsProgress.label}</span>
                  <span style={{flexShrink:0}}>({mapsProgress.step}/{mapsProgress.total})</span></>
              : <>📍 Google Maps <span style={{fontSize:11,opacity:0.6,fontWeight:400}}>{MAPS_SEARCHES.length} searches</span></>
            }
          </button>

          {/* ProductHunt Import */}
          <button onClick={importProductHunt} disabled={phLoading} style={{
            display:'flex',alignItems:'center',gap:6,padding:'9px 14px',borderRadius:10,
            border:'1px solid rgba(255,99,55,0.3)',cursor:phLoading?'default':'pointer',
            background:phLoading?'rgba(255,99,55,0.03)':'rgba(255,99,55,0.08)',
            color:'#ff6337',fontSize:13,fontWeight:600,transition:'all 0.2s',opacity:phLoading?0.7:1,
            whiteSpace:'nowrap',
          }}>
            {phLoading
              ? <><span style={{display:'inline-block',width:11,height:11,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>Scraping...</>
              : <>🐱 ProductHunt</>
            }
          </button>

          {/* CSV Import */}
          <label style={{
            display:'flex',alignItems:'center',gap:6,padding:'9px 14px',borderRadius:10,
            border:'1px solid rgba(167,139,250,0.3)',cursor:csvLoading?'default':'pointer',
            background:csvLoading?'rgba(167,139,250,0.03)':'rgba(167,139,250,0.08)',
            color:'#a78bfa',fontSize:13,fontWeight:600,transition:'all 0.2s',opacity:csvLoading?0.7:1,
            whiteSpace:'nowrap',
          }}>
            {csvLoading
              ? <><span style={{display:'inline-block',width:11,height:11,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>Importing...</>
              : <>⬆ CSV</>
            }
            <input type="file" accept=".csv" onChange={importCSV} disabled={csvLoading} style={{display:'none'}}/>
          </label>

          {/* Enrich All — server-side background job, survives navigation */}
          <button onClick={enrichAll} disabled={enrichJob?.status === 'running'} style={{
            display:'flex',alignItems:'center',gap:6,padding:'9px 14px',borderRadius:10,
            border:`1px solid ${enrichJob?.status==='running'?'rgba(34,211,165,0.5)':'rgba(34,211,165,0.3)'}`,
            cursor:enrichJob?.status==='running'?'default':'pointer',
            background:enrichJob?.status==='running'?'rgba(34,211,165,0.06)':'rgba(34,211,165,0.08)',
            color:'#22d3a5',fontSize:13,fontWeight:600,transition:'all 0.2s',
            opacity:enrichJob?.status==='running'?1:1,whiteSpace:'nowrap',
          }}>
            {enrichJob?.status === 'running'
              ? <><span style={{display:'inline-block',width:11,height:11,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
                  {enrichJob.done}/{enrichJob.total} enriched</>
              : enrichJob?.status === 'done' && enrichJob?.found > 0
                ? <>✦ Enriched {enrichJob.found} ✓</>
                : <>✦ Enrich All</>
            }
          </button>

          {/* Sync Sent Folder — always visible */}
          <button onClick={syncSent} disabled={syncing} style={{
            display:'flex',alignItems:'center',gap:6,padding:'9px 14px',borderRadius:10,
            border:'1px solid rgba(167,139,250,0.35)',cursor:syncing?'default':'pointer',
            background:syncing?'rgba(167,139,250,0.03)':'rgba(167,139,250,0.1)',
            color:'#a78bfa',fontSize:13,fontWeight:600,transition:'all 0.2s',opacity:syncing?0.7:1,
            whiteSpace:'nowrap',
          }}>
            {syncing
              ? <><span style={{display:'inline-block',width:11,height:11,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>Syncing...</>
              : <>⟳ Sync Sent</>
            }
          </button>

          {/* Find New Leads (Hunter.io) */}
          <button onClick={find} disabled={finding} style={{
            display:'flex',alignItems:'center',gap:8,padding:'9px 18px',borderRadius:10,
            border:'1px solid rgba(0,246,255,0.3)',cursor:finding?'default':'pointer',
            background:finding?'rgba(0,246,255,0.05)':'rgba(0,246,255,0.1)',
            color:'#00F6FF',fontSize:13,fontWeight:600,transition:'all 0.2s',opacity:finding?0.7:1,
            boxShadow:finding?'none':'0 0 16px rgba(0,246,255,0.1)',whiteSpace:'nowrap',
          }}>
            {finding?<><span style={{display:'inline-block',width:12,height:12,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>Searching...</>:<>＋ Find Leads</>}
          </button>

        </div>
      </div>

      {/* Auto-Send Status Panel */}
      {autoSendStatus && (
        <div style={{
          marginBottom:16,padding:'16px 20px',borderRadius:12,
          background: autoSendStatus.enabled ? 'rgba(34,211,165,0.05)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${autoSendStatus.enabled ? 'rgba(34,211,165,0.2)' : 'rgba(255,255,255,0.07)'}`,
          display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap',
        }}>
          {/* Left — status info */}
          <div style={{display:'flex',alignItems:'center',gap:24,flexWrap:'wrap'}}>
            {/* Toggle */}
            <button onClick={toggleAutoSend} disabled={togglingAutoSend} style={{
              display:'flex',alignItems:'center',gap:8,padding:'7px 14px',borderRadius:8,
              border:`1px solid ${autoSendStatus.enabled ? 'rgba(34,211,165,0.4)' : 'rgba(255,255,255,0.1)'}`,
              background: autoSendStatus.enabled ? 'rgba(34,211,165,0.12)' : 'rgba(255,255,255,0.05)',
              color: autoSendStatus.enabled ? '#22d3a5' : '#4A4F6A',
              fontSize:13,fontWeight:700,cursor:togglingAutoSend?'default':'pointer',
            }}>
              <span style={{
                width:10,height:10,borderRadius:'50%',flexShrink:0,
                background: autoSendStatus.enabled ? '#22d3a5' : '#2a2d4a',
                boxShadow: autoSendStatus.enabled ? '0 0 6px #22d3a5' : 'none',
              }}/>
              Auto-Send {autoSendStatus.enabled ? 'ON' : 'OFF'}
            </button>

            {/* Stats */}
            <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:18,fontWeight:700,color:'#e8ecf0',lineHeight:1}}>{autoSendStatus.sentToday}</div>
                <div style={{fontSize:10,color:'#4A4F6A',marginTop:2}}>sent today</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:18,fontWeight:700,color:'#00F6FF',lineHeight:1}}>{autoSendStatus.dailyLimit}</div>
                <div style={{fontSize:10,color:'#4A4F6A',marginTop:2}}>daily limit</div>
              </div>
              {/* Queue breakdown */}
              <div style={{width:1,background:'rgba(255,255,255,0.06)',margin:'0 4px'}}/>
              <div style={{textAlign:'center'}} title="Ready to send — have email">
                <div style={{fontSize:18,fontWeight:700,color:'#22d3a5',lineHeight:1}}>{autoSendStatus.queueSize}</div>
                <div style={{fontSize:10,color:'#4A4F6A',marginTop:2}}>✓ ready</div>
              </div>
              <div style={{textAlign:'center'}} title="No email yet — auto-send will try to find it first">
                <div style={{fontSize:18,fontWeight:700,color:'#fb923c',lineHeight:1}}>{autoSendStatus.needsEmail ?? 0}</div>
                <div style={{fontSize:10,color:'#4A4F6A',marginTop:2}}>⟳ will enrich</div>
              </div>
              <div style={{textAlign:'center'}} title="No email and no website — need manual input">
                <div style={{fontSize:18,fontWeight:700,color:'#f87171',lineHeight:1}}>{autoSendStatus.noWebsite ?? 0}</div>
                <div style={{fontSize:10,color:'#4A4F6A',marginTop:2}}>✗ need info</div>
              </div>
              <div style={{width:1,background:'rgba(255,255,255,0.06)',margin:'0 4px'}}/>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:18,fontWeight:700,color:'#a78bfa',lineHeight:1}}>{autoSendStatus.totalSent}</div>
                <div style={{fontSize:10,color:'#4A4F6A',marginTop:2}}>total sent</div>
              </div>
            </div>

            {/* Phase */}
            <div style={{padding:'4px 10px',borderRadius:6,background:'rgba(0,246,255,0.06)',border:'1px solid rgba(0,246,255,0.12)'}}>
              <span style={{fontSize:11,color:'#00F6FF'}}>{autoSendStatus.phase}</span>
            </div>
          </div>

          {/* Right — sync + schedule */}
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8}}>
            <button onClick={syncSent} disabled={syncing} style={{
              display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,
              border:'1px solid rgba(167,139,250,0.3)',cursor:syncing?'default':'pointer',
              background:'rgba(167,139,250,0.08)',color:'#a78bfa',fontSize:12,fontWeight:600,
              opacity:syncing?0.7:1,whiteSpace:'nowrap',
            }}>
              {syncing
                ? <><span style={{display:'inline-block',width:10,height:10,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>Scanning Sent folder...</>
                : <>⟳ Sync Sent Folder</>}
            </button>
            <div style={{fontSize:11,color:'#4A4F6A',textAlign:'right',lineHeight:1.7}}>
              Auto-syncs daily at 7:30am UTC<br/>
              {autoSendStatus.lastSentAt
                ? `Last sent: ${new Date(autoSendStatus.lastSentAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}`
                : 'No emails sent yet'}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast&&<div style={{
        marginBottom:16,padding:'10px 16px',borderRadius:10,fontSize:13,
        background:toast.type==='ok'?'rgba(34,211,165,0.08)':toast.type==='err'?'rgba(248,113,113,0.08)':'rgba(0,246,255,0.06)',
        border:`1px solid ${toast.type==='ok'?'rgba(34,211,165,0.2)':toast.type==='err'?'rgba(248,113,113,0.2)':'rgba(0,246,255,0.15)'}`,
        color:toast.type==='ok'?'#22d3a5':toast.type==='err'?'#f87171':'#00F6FF',
      }}>{toast.msg}</div>}

      {/* Toolbar */}
      <div style={{display:'flex',gap:10,marginBottom:18,alignItems:'center'}}>
        <div style={{position:'relative',flex:1}}>
          <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#2a2d4a',pointerEvents:'none',fontSize:13}}>⌕</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, company, country..."
            style={{width:'100%',padding:'9px 12px 9px 32px',borderRadius:10,background:'#0d0d18',border:'1px solid rgba(255,255,255,0.06)',color:'#e8ecf0',fontSize:13,outline:'none'}}
            onFocus={e=>e.target.style.borderColor='rgba(0,246,255,0.3)'}
            onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.06)'}
          />
        </div>
        <div style={{display:'flex',background:'#0d0d18',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:3,gap:2}}>
          {['all','new','contacted','interested','client'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{
              padding:'5px 12px',borderRadius:7,border:'none',cursor:'pointer',fontSize:12,fontWeight:500,
              background:filter===f?'rgba(0,246,255,0.1)':'transparent',
              color:filter===f?'#00F6FF':'#4A4F6A',transition:'all 0.15s',textTransform:'capitalize',
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{background:'#0d0d18',border:'1px solid rgba(255,255,255,0.05)',borderRadius:14,overflow:'hidden'}}>
        {/* Header */}
        <div style={{display:'grid',gridTemplateColumns:'1.6fr 1.2fr 1.5fr 90px 60px 110px 130px',padding:'10px 20px',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
          {['Person','Company','Email','Source','Score','Status','Actions'].map(h=>(
            <span key={h} style={{fontSize:11,fontWeight:600,color:'#2a2d4a',textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</span>
          ))}
        </div>

        {loading?[1,2,3,4,5].map(i=>(
          <div key={i} style={{height:56,margin:'6px 12px',borderRadius:8,background:'#111120'}}/>
        )):filtered.length===0?(
          <div style={{padding:'48px 0',textAlign:'center',color:'#2a2d4a',fontSize:13}}>No leads found. Click &quot;Find New Leads&quot; to get started.</div>
        ):filtered.map((l,i)=>{
          const src = getSource(l.source)
          return (
          <div key={l.id} style={{
            display:'grid',gridTemplateColumns:'1.6fr 1.2fr 1.5fr 90px 60px 110px 130px',
            padding:'12px 20px',alignItems:'center',
            borderBottom:i<filtered.length-1?'1px solid rgba(255,255,255,0.03)':'none',
            transition:'background 0.12s',
          }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(0,246,255,0.02)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            {/* Person */}
            <div style={{minWidth:0,paddingRight:12}}>
              <div style={{fontSize:13,fontWeight:600,color:'#e8ecf0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.full_name}</div>
              <div style={{fontSize:11,color:'#4A4F6A',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.title}</div>
            </div>
            {/* Company */}
            <div style={{minWidth:0,paddingRight:12}}>
              <div style={{fontSize:13,color:'#c8cad8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.company}</div>
              <div style={{fontSize:11,color:'#4A4F6A',marginTop:2}}>{l.country}</div>
            </div>
            {/* Email */}
            <div style={{minWidth:0,paddingRight:12}}>
              {l.email ? (
                <div>
                  <div style={{fontSize:12,color:'#60a5fa',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.email}</div>
                  {l.email_verified&&<div style={{fontSize:11,color:'#22d3a5',marginTop:1}}>✓ verified</div>}
                </div>
              ) : (() => {
                // Parse email patterns from notes
                const match = (l.notes||'').match(/Email patterns: ([^\n]+)/)
                const patterns = match ? match[1].split(' | ').filter(Boolean) : []
                return patterns.length > 0 ? (
                  <div>
                    <div style={{fontSize:10,color:'#4A4F6A',marginBottom:3}}>Pick one:</div>
                    <div style={{display:'flex',flexDirection:'column',gap:2}}>
                      {patterns.slice(0,3).map(p=>(
                        <button key={p} onClick={async()=>{
                          await supabase.from('leads').update({email:p}).eq('id',l.id)
                          setLeads(prev=>prev.map(x=>x.id===l.id?{...x,email:p}:x))
                          setToast({type:'ok',msg:`Email set to ${p}`})
                          setTimeout(()=>setToast(null),4000)
                        }} style={{
                          fontSize:10,padding:'2px 6px',borderRadius:5,border:'1px solid rgba(96,165,250,0.2)',
                          background:'rgba(96,165,250,0.06)',color:'#60a5fa',cursor:'pointer',
                          textAlign:'left',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                          maxWidth:160,
                        }}>{p}</button>
                      ))}
                      {patterns.length > 3 && (
                        <span style={{fontSize:10,color:'#2a2d4a'}}>+{patterns.length-3} more in notes</span>
                      )}
                    </div>
                  </div>
                ) : <span style={{fontSize:12,color:'#2a2d4a'}}>—</span>
              })()}
            </div>
            {/* Source badge */}
            <div>
              <span style={{
                display:'inline-flex',alignItems:'center',gap:4,
                padding:'3px 8px',borderRadius:6,fontSize:11,fontWeight:600,
                background:src.bg, color:src.color,
              }}>
                <span style={{fontSize:10}}>{src.icon}</span>
                {src.label}
              </span>
            </div>
            {/* Score */}
            <div>
              <span style={{fontSize:14,fontWeight:700,color:sc(l.score)}}>{l.score}</span>
              <span style={{fontSize:11,color:'#2a2d4a'}}>/10</span>
            </div>
            {/* Status */}
            <div>
              <select value={l.status} onChange={e=>setStatus(l.id,e.target.value)} style={{
                padding:'4px 8px',borderRadius:20,border:'none',fontSize:11,fontWeight:600,cursor:'pointer',outline:'none',
                background:statusStyle[l.status]?.bg||'rgba(255,255,255,0.05)',
                color:statusStyle[l.status]?.color||'#4A4F6A',
              }}>
                {Object.keys(statusStyle).map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {/* Actions */}
            <div style={{display:'flex',gap:5,alignItems:'center',flexWrap:'wrap'}}>
              {/* Enrich — only show if no email yet */}
              {!l.email && l.website && (
                <button
                  onClick={()=>enrichLead(l.id)}
                  disabled={enrichingId===l.id}
                  title="Find founder name + email from website"
                  style={{
                    fontSize:11,padding:'4px 9px',borderRadius:7,border:'1px solid rgba(34,211,165,0.25)',
                    background:'rgba(34,211,165,0.07)',color:'#22d3a5',cursor:enrichingId===l.id?'default':'pointer',
                    fontWeight:600,display:'flex',alignItems:'center',gap:4,whiteSpace:'nowrap',
                  }}>
                  {enrichingId===l.id
                    ? <><span style={{display:'inline-block',width:9,height:9,border:'1.5px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>...</>
                    : <>✦ Enrich</>}
                </button>
              )}
              {/* Mark as Emailed — show if new status and not yet in a sequence */}
              {l.status === 'new' && !sequencedIds.has(l.id) && (
                <button
                  onClick={()=>setShowMarkModal(l)}
                  disabled={markingId===l.id}
                  title="Already sent this person an email manually? Mark it so follow-ups fire automatically"
                  style={{
                    fontSize:11,padding:'4px 9px',borderRadius:7,border:'1px solid rgba(251,146,60,0.25)',
                    background:'rgba(251,146,60,0.07)',color:'#fb923c',cursor:'pointer',
                    fontWeight:600,whiteSpace:'nowrap',
                  }}>
                  ✓ Sent
                </button>
              )}
              <Link href={`/smart-outreach?lead=${l.id}`} style={{
                fontSize:11,padding:'4px 9px',borderRadius:7,background:'rgba(0,246,255,0.08)',
                color:'#00F6FF',textDecoration:'none',fontWeight:600,border:'1px solid rgba(0,246,255,0.18)',
                whiteSpace:'nowrap',
              }}>✉ Email</Link>
            </div>
          </div>
          )
        })}
      </div>

      {/* Mark as Emailed modal */}
      {showMarkModal && (() => {
        let subjectInput = `Re: following up`
        return (
          <div style={{
            position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:1000,
            display:'flex',alignItems:'center',justifyContent:'center',
          }} onClick={()=>setShowMarkModal(null)}>
            <div style={{
              background:'#0d0d18',border:'1px solid rgba(251,146,60,0.3)',borderRadius:14,
              padding:'28px 28px',width:440,
            }} onClick={e=>e.stopPropagation()}>
              <h3 style={{fontSize:15,fontWeight:700,color:'#e8ecf0',marginBottom:4}}>
                Mark as already emailed
              </h3>
              <p style={{fontSize:12,color:'#4A4F6A',marginBottom:20,lineHeight:1.5}}>
                This will enrol <span style={{color:'#fb923c'}}>{showMarkModal.company}</span> in the follow-up sequence.
                Follow-up 1 will fire in 3 days, Follow-up 2 on day 7 — automatically.
              </p>
              <label style={{fontSize:11,color:'#4A4F6A',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>
                Subject line you used (optional)
              </label>
              <input
                defaultValue=""
                placeholder="e.g. Quick question about Acme Co"
                onChange={e=>{ subjectInput = e.target.value }}
                style={{
                  width:'100%',marginTop:6,marginBottom:20,padding:'9px 12px',
                  borderRadius:8,background:'#111120',border:'1px solid rgba(255,255,255,0.08)',
                  color:'#e8ecf0',fontSize:13,outline:'none',boxSizing:'border-box',
                }}
                onFocus={e=>e.target.style.borderColor='rgba(251,146,60,0.4)'}
                onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.08)'}
              />
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button onClick={()=>setShowMarkModal(null)} style={{
                  padding:'8px 16px',borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',
                  background:'transparent',color:'#4A4F6A',fontSize:13,cursor:'pointer',
                }}>Cancel</button>
                <button onClick={()=>markEmailed(showMarkModal, subjectInput)} disabled={markingId===showMarkModal.id} style={{
                  padding:'8px 18px',borderRadius:8,border:'1px solid rgba(251,146,60,0.4)',
                  background:'rgba(251,146,60,0.12)',color:'#fb923c',fontSize:13,fontWeight:600,cursor:'pointer',
                }}>
                  {markingId===showMarkModal.id
                    ? <><span style={{display:'inline-block',width:11,height:11,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite',marginRight:6}}/>Saving...</>
                    : '✓ Yes, I already sent this'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

    </div>
  )
}
