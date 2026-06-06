'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const S = {
  page: { padding:'32px 36px', maxWidth:1200 },
  h1: { fontSize:22, fontWeight:700, color:'#fff', letterSpacing:'-0.02em' },
  sub: { fontSize:13, color:'#4A4F6A', marginTop:4 },
  card: { background:'#0d0d18', border:'1px solid rgba(255,255,255,0.05)', borderRadius:14, padding:'20px 22px' },
  label: { fontSize:11, fontWeight:600, color:'#2a2d4a', textTransform:'uppercase', letterSpacing:'0.08em' },
  statGrid: { display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, margin:'28px 0' },
  mainGrid: { display:'grid', gridTemplateColumns:'1fr 320px', gap:18 },
  dot: { width:7, height:7, borderRadius:'50%', background:'#00F6FF', display:'inline-block', marginRight:8 },
}

const sc = s => s>=8?'#22d3a5':s>=6?'#00F6FF':'#4A4F6A'

export default function Dashboard() {
  const [stats, setStats] = useState({ total:0, new:0, contacted:0, interested:0, clients:0 })
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('leads').select('*').order('score',{ascending:false}).then(({data}) => {
      if (data) {
        setStats({ total:data.length, new:data.filter(l=>l.status==='new').length, contacted:data.filter(l=>l.status==='contacted').length, interested:data.filter(l=>l.status==='interested').length, clients:data.filter(l=>l.status==='client').length })
        setLeads(data.slice(0,7))
      }
      setLoading(false)
    })
  },[])

  const statCards = [
    {label:'Total',value:stats.total,color:'#00F6FF'},
    {label:'New',value:stats.new,color:'#a78bfa'},
    {label:'Contacted',value:stats.contacted,color:'#60a5fa'},
    {label:'Interested',value:stats.interested,color:'#fb923c'},
    {label:'Clients',value:stats.clients,color:'#22d3a5'},
  ]

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{marginBottom:28}}>
        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}>
          <span style={{...S.dot, boxShadow:'0 0 6px rgba(0,246,255,0.5)', animation:'blink 2s ease infinite'}}/>
          <span style={{fontSize:11,color:'#2a2d4a'}}>System active · {new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}</span>
        </div>
        <h1 style={S.h1}>Good day, Varghese 👋</h1>
        <p style={S.sub}>Your sales intelligence overview for today.</p>
      </div>

      {/* Stats */}
      <div style={S.statGrid}>
        {statCards.map(c => (
          <div key={c.label} style={{...S.card, borderColor: c.label==='Total'?'rgba(0,246,255,0.1)':'rgba(255,255,255,0.05)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
              <span style={S.label}>{c.label}</span>
              <div style={{width:6,height:6,borderRadius:'50%',background:c.color, boxShadow:`0 0 6px ${c.color}`}}/>
            </div>
            <div style={{fontSize:36,fontWeight:700,color:'#fff',letterSpacing:'-0.03em',lineHeight:1}}>
              {loading?'—':c.value}
            </div>
            <div style={{marginTop:14,height:2,borderRadius:99,background:'rgba(255,255,255,0.04)'}}>
              <div style={{height:'100%',borderRadius:99,background:c.color,width:loading?'0%':'100%',transition:'width 1s ease'}}/>
            </div>
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={S.mainGrid}>
        {/* Priority Leads */}
        <div style={S.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:'#fff'}}>Priority Leads</div>
              <div style={{fontSize:12,color:'#4A4F6A',marginTop:2}}>Ranked by AI score — contact these first</div>
            </div>
            <Link href="/leads" style={{fontSize:12,color:'#00F6FF',textDecoration:'none',fontWeight:500}}>View all →</Link>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            {loading ? [1,2,3,4].map(i=><div key={i} style={{height:52,borderRadius:10,background:'#111120'}}/>)
            : leads.length===0 ? <div style={{textAlign:'center',padding:'32px 0',color:'#2a2d4a',fontSize:13}}>No leads yet — <Link href="/leads" style={{color:'#00F6FF'}}>find some</Link></div>
            : leads.map((l,i)=>(
              <div key={l.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.03)'}}>
                <div style={{width:26,height:26,borderRadius:8,background:'rgba(0,246,255,0.1)',border:'1px solid rgba(0,246,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#00F6FF',flexShrink:0}}>{i+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:'#e8ecf0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.full_name}</div>
                  <div style={{fontSize:11,color:'#4A4F6A',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:1}}>{l.title} · {l.company}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
                  {l.email&&<span style={{fontSize:11,color:'#22d3a5'}}>✓ email</span>}
                  <span style={{fontSize:13,fontWeight:700,color:sc(l.score)}}>{l.score}<span style={{fontSize:11,color:'#2a2d4a',fontWeight:400}}>/10</span></span>
                  <span style={{fontSize:11,padding:'2px 8px',borderRadius:99,background:'rgba(167,139,250,0.1)',color:'#a78bfa'}}>{l.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {/* Actions */}
          <div style={S.card}>
            <div style={{fontSize:14,fontWeight:600,color:'#fff',marginBottom:14}}>Quick Actions</div>
            {[
              {href:'/leads',label:'Find New Leads',color:'#00F6FF',bg:'rgba(0,246,255,0.08)',border:'rgba(0,246,255,0.15)'},
              {href:'/outreach',label:'Write Email',color:'#60a5fa',bg:'rgba(96,165,250,0.08)',border:'rgba(96,165,250,0.15)'},
              {href:'/pipeline',label:'View Pipeline',color:'#4A4F6A',bg:'rgba(255,255,255,0.03)',border:'rgba(255,255,255,0.06)'},
            ].map(a=>(
              <Link key={a.href} href={a.href} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:10,background:a.bg,border:`1px solid ${a.border}`,textDecoration:'none',marginBottom:6,color:a.color,fontSize:13,fontWeight:500}}>
                {a.label}
              </Link>
            ))}
          </div>

          {/* Targets */}
          <div style={S.card}>
            <div style={{fontSize:14,fontWeight:600,color:'#fff',marginBottom:16}}>June Targets</div>
            {[
              {label:'Leads',cur:stats.total,target:50,color:'#00F6FF'},
              {label:'Outreach',cur:stats.contacted,target:20,color:'#60a5fa'},
              {label:'Clients',cur:stats.clients,target:3,color:'#22d3a5'},
            ].map(t=>(
              <div key={t.label} style={{marginBottom:14}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <span style={{fontSize:12,color:'#4A4F6A'}}>{t.label}</span>
                  <span style={{fontSize:12,fontWeight:600,color:'#e8ecf0'}}>{t.cur}<span style={{color:'#2a2d4a'}}>/{t.target}</span></span>
                </div>
                <div style={{height:3,borderRadius:99,background:'rgba(255,255,255,0.04)'}}>
                  <div style={{height:'100%',borderRadius:99,background:t.color,width:Math.min((t.cur/t.target)*100,100)+'%',transition:'width 1s ease'}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
