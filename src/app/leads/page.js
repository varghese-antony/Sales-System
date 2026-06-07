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
  hunter:      { bg:'rgba(0,246,255,0.08)',   color:'#00F6FF',  icon:'🎯', label:'Hunter' },
  'cron-daily':{ bg:'rgba(0,246,255,0.08)',   color:'#00F6FF',  icon:'🎯', label:'Hunter' },
  linkedin:    { bg:'rgba(10,102,194,0.15)',  color:'#4a9eff',  icon:'in', label:'LinkedIn' },
  google:      { bg:'rgba(66,133,244,0.12)',  color:'#6baeff',  icon:'G',  label:'Google' },
  curated:     { bg:'rgba(167,139,250,0.1)',  color:'#a78bfa',  icon:'★',  label:'Curated' },
  manual:      { bg:'rgba(251,146,60,0.1)',   color:'#fb923c',  icon:'✎',  label:'Manual' },
  clutch:      { bg:'rgba(251,146,60,0.1)',   color:'#fb923c',  icon:'🌐', label:'Clutch' },
  csv:         { bg:'rgba(167,139,250,0.1)',  color:'#a78bfa',  icon:'📄', label:'CSV' },
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
  const [clutchProgress, setClutchProgress] = useState(null) // {step, total, label} or null
  const [csvLoading, setCsvLoading] = useState(false)

  // All combos for Clutch scraping
  const CLUTCH_COMBOS = [
    {industry:'agencies/digital-marketing', country:'united-kingdom'},
    {industry:'agencies/digital-marketing', country:'ireland'},
    {industry:'agencies/digital-marketing', country:'australia'},
    {industry:'agencies/digital-marketing', country:'united-arab-emirates'},
    {industry:'agencies/digital-marketing', country:'singapore'},
    {industry:'it-services', country:'united-kingdom'},
    {industry:'it-services', country:'ireland'},
    {industry:'it-services', country:'australia'},
    {industry:'it-services', country:'united-arab-emirates'},
    {industry:'it-services', country:'singapore'},
    {industry:'business-services', country:'united-kingdom'},
    {industry:'business-services', country:'ireland'},
    {industry:'business-services', country:'australia'},
    {industry:'business-services', country:'united-arab-emirates'},
    {industry:'business-services', country:'singapore'},
    {industry:'hr/consulting', country:'united-kingdom'},
    {industry:'hr/consulting', country:'ireland'},
    {industry:'hr/consulting', country:'australia'},
    {industry:'hr/consulting', country:'united-arab-emirates'},
    {industry:'hr/consulting', country:'singapore'},
    {industry:'legal', country:'united-kingdom'},
    {industry:'legal', country:'ireland'},
    {industry:'legal', country:'australia'},
    {industry:'legal', country:'united-arab-emirates'},
    {industry:'legal', country:'singapore'},
    {industry:'real-estate', country:'united-kingdom'},
    {industry:'real-estate', country:'ireland'},
    {industry:'real-estate', country:'australia'},
    {industry:'real-estate', country:'united-arab-emirates'},
    {industry:'real-estate', country:'singapore'},
  ]

  const COUNTRY_LABELS = {
    'united-kingdom':'UK','ireland':'Ireland','australia':'Australia',
    'united-arab-emirates':'UAE','singapore':'Singapore',
  }
  const INDUSTRY_LABELS = {
    'agencies/digital-marketing':'Marketing Agencies','it-services':'SaaS/IT',
    'business-services':'Consulting','hr/consulting':'HR Tech',
    'legal':'Legal Tech','real-estate':'PropTech',
  }

  useEffect(()=>{load()},[])

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

  async function importFromClutch() {
    let totalAdded = 0
    let totalSkipped = 0
    for (let i = 0; i < CLUTCH_COMBOS.length; i++) {
      const {industry, country} = CLUTCH_COMBOS[i]
      const label = `${INDUSTRY_LABELS[industry]||industry} in ${COUNTRY_LABELS[country]||country}`
      setClutchProgress({step:i+1, total:CLUTCH_COMBOS.length, label})
      try {
        const r = await fetch('/api/scrape-clutch', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({industry, country}),
        })
        const d = await r.json()
        if (d.success) {
          totalAdded += d.added||0
          totalSkipped += d.skipped||0
        }
      } catch {}
    }
    setClutchProgress(null)
    setToast({type:'ok', msg:`Import done — ${totalAdded} new leads added, ${totalSkipped} skipped (already exist)`})
    await load()
    setTimeout(()=>setToast(null),8000)
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
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {/* CSV Import (hidden file input) */}
          <label style={{
            display:'flex',alignItems:'center',gap:6,padding:'9px 14px',borderRadius:10,
            border:'1px solid rgba(167,139,250,0.3)',cursor:csvLoading?'default':'pointer',
            background:csvLoading?'rgba(167,139,250,0.03)':'rgba(167,139,250,0.08)',
            color:'#a78bfa',fontSize:13,fontWeight:600,transition:'all 0.2s',opacity:csvLoading?0.7:1,
          }}>
            {csvLoading
              ? <><span style={{display:'inline-block',width:11,height:11,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>Importing...</>
              : <>⬆ Import CSV</>
            }
            <input type="file" accept=".csv" onChange={importCSV} disabled={csvLoading} style={{display:'none'}}/>
          </label>

          {/* Clutch Import */}
          <button onClick={importFromClutch} disabled={!!clutchProgress} style={{
            display:'flex',alignItems:'center',gap:6,padding:'9px 14px',borderRadius:10,
            border:'1px solid rgba(251,146,60,0.3)',cursor:clutchProgress?'default':'pointer',
            background:clutchProgress?'rgba(251,146,60,0.03)':'rgba(251,146,60,0.08)',
            color:'#fb923c',fontSize:13,fontWeight:600,transition:'all 0.2s',opacity:clutchProgress?0.7:1,
          }}>
            {clutchProgress
              ? <><span style={{display:'inline-block',width:11,height:11,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>Scraping {clutchProgress.label}... ({clutchProgress.step}/{clutchProgress.total})</>
              : <>🌐 Import from Clutch</>
            }
          </button>

          {/* Find New Leads */}
          <button onClick={find} disabled={finding} style={{
            display:'flex',alignItems:'center',gap:8,padding:'9px 18px',borderRadius:10,border:'1px solid rgba(0,246,255,0.3)',cursor:finding?'default':'pointer',
            background:finding?'rgba(0,246,255,0.05)':'rgba(0,246,255,0.1)',
            color:'#00F6FF',fontSize:13,fontWeight:600,transition:'all 0.2s',opacity:finding?0.7:1,
            boxShadow: finding?'none':'0 0 16px rgba(0,246,255,0.1)',
          }}>
            {finding?<><span style={{display:'inline-block',width:12,height:12,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>Searching...</>:<>＋ Find New Leads</>}
          </button>
        </div>
      </div>

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
        <div style={{display:'grid',gridTemplateColumns:'1.6fr 1.2fr 1.5fr 90px 60px 110px 70px',padding:'10px 20px',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
          {['Person','Company','Email','Source','Score','Status',''].map(h=>(
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
            display:'grid',gridTemplateColumns:'1.6fr 1.2fr 1.5fr 90px 60px 110px 70px',
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
              {l.email?(
                <div>
                  <div style={{fontSize:12,color:'#60a5fa',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.email}</div>
                  {l.email_verified&&<div style={{fontSize:11,color:'#22d3a5',marginTop:1}}>✓ verified</div>}
                </div>
              ):<span style={{fontSize:12,color:'#2a2d4a'}}>—</span>}
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
            {/* Email button */}
            <div>
              <Link href={`/outreach?lead=${l.id}`} style={{
                fontSize:12,padding:'5px 12px',borderRadius:7,background:'rgba(0,246,255,0.08)',
                color:'#00F6FF',textDecoration:'none',fontWeight:500,border:'1px solid rgba(0,246,255,0.18)',
              }}>Email</Link>
            </div>
          </div>
          )
        })}
      </div>
    </div>
  )
}
