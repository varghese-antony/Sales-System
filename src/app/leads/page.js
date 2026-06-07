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
  const [csvLoading, setCsvLoading] = useState(false)
  const [showClutchGuide, setShowClutchGuide] = useState(false)

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
          {/* How to get Clutch leads */}
          <button onClick={()=>setShowClutchGuide(g=>!g)} style={{
            display:'flex',alignItems:'center',gap:6,padding:'9px 14px',borderRadius:10,
            border:`1px solid ${showClutchGuide?'rgba(251,146,60,0.5)':'rgba(251,146,60,0.25)'}`,
            background:showClutchGuide?'rgba(251,146,60,0.12)':'rgba(251,146,60,0.06)',
            color:'#fb923c',fontSize:13,fontWeight:600,cursor:'pointer',
          }}>
            🌐 Clutch Leads
          </button>

          {/* CSV Import */}
          <label style={{
            display:'flex',alignItems:'center',gap:6,padding:'9px 14px',borderRadius:10,
            border:'1px solid rgba(167,139,250,0.35)',cursor:csvLoading?'default':'pointer',
            background:csvLoading?'rgba(167,139,250,0.03)':'rgba(167,139,250,0.1)',
            color:'#a78bfa',fontSize:13,fontWeight:600,transition:'all 0.2s',opacity:csvLoading?0.7:1,
            boxShadow:csvLoading?'none':'0 0 14px rgba(167,139,250,0.08)',
          }}>
            {csvLoading
              ? <><span style={{display:'inline-block',width:11,height:11,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>Importing...</>
              : <>⬆ Import CSV</>
            }
            <input type="file" accept=".csv" onChange={importCSV} disabled={csvLoading} style={{display:'none'}}/>
          </label>

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

      {/* Clutch step-by-step guide */}
      {showClutchGuide&&<div style={{
        marginBottom:20,padding:'20px 24px',borderRadius:12,
        background:'rgba(251,146,60,0.05)',border:'1px solid rgba(251,146,60,0.2)',
      }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <span style={{fontSize:14,fontWeight:700,color:'#fb923c'}}>🌐 How to get leads from Clutch.co</span>
          <button onClick={()=>setShowClutchGuide(false)} style={{background:'none',border:'none',color:'#4A4F6A',cursor:'pointer',fontSize:18,lineHeight:1}}>×</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div>
            <p style={{fontSize:12,fontWeight:600,color:'#e8ecf0',marginBottom:10}}>Step-by-step:</p>
            {[
              ['1','Go to clutch.co in your browser'],
              ['2','Use these filters: Country → UK / Ireland / Australia / UAE / Singapore'],
              ['3','Filter by: employees 2–49, at least 1 review'],
              ['4','Pick one category: Marketing Agencies, IT Services, Consulting, HR, Legal, or Real Estate'],
              ['5','Scroll through results — right-click the page → Save As... or use a browser export extension'],
              ['6','Or: copy-paste company rows into a spreadsheet, save as CSV'],
              ['7','Upload the CSV here with the ⬆ Import CSV button'],
            ].map(([n,t])=>(
              <div key={n} style={{display:'flex',gap:10,marginBottom:8,alignItems:'flex-start'}}>
                <span style={{width:20,height:20,borderRadius:'50%',background:'rgba(251,146,60,0.15)',color:'#fb923c',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>{n}</span>
                <span style={{fontSize:12,color:'#c8cad8',lineHeight:1.5}}>{t}</span>
              </div>
            ))}
          </div>
          <div>
            <p style={{fontSize:12,fontWeight:600,color:'#e8ecf0',marginBottom:10}}>CSV format (any of these column names work):</p>
            <div style={{background:'rgba(0,0,0,0.3)',borderRadius:8,padding:'12px 14px',fontFamily:'monospace',fontSize:11,color:'#a78bfa',lineHeight:1.8}}>
              Company, Website, Country, Industry<br/>
              <span style={{color:'#4A4F6A'}}>— or —</span><br/>
              company_name, url, location, sector<br/>
              <span style={{color:'#4A4F6A'}}>— or —</span><br/>
              business, web, region, category
            </div>
            <div style={{marginTop:12,padding:'10px 12px',borderRadius:8,background:'rgba(34,211,165,0.06)',border:'1px solid rgba(34,211,165,0.15)'}}>
              <p style={{fontSize:11,color:'#22d3a5',fontWeight:600,marginBottom:4}}>✓ Optional extra columns</p>
              <p style={{fontSize:11,color:'#4A4F6A',lineHeight:1.5}}>Full Name / Email / LinkedIn — if you have them, they&apos;ll be imported too. Leave blank otherwise.</p>
            </div>
            <div style={{marginTop:12,padding:'10px 12px',borderRadius:8,background:'rgba(251,146,60,0.06)',border:'1px solid rgba(251,146,60,0.15)'}}>
              <p style={{fontSize:11,color:'#fb923c',fontWeight:600,marginBottom:4}}>⚡ Quick tip</p>
              <p style={{fontSize:11,color:'#4A4F6A',lineHeight:1.5}}>Clutch URLs follow a pattern — paste this into your browser and swap the category + country:<br/><span style={{color:'#fb923c'}}>clutch.co/agencies/digital-marketing?country=united-kingdom</span></p>
            </div>
          </div>
        </div>
      </div>}

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
