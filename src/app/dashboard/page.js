'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useDemoMode } from '@/contexts/DemoModeContext'

const S = {
  page:  { padding:'32px 36px', maxWidth:1300 },
  h1:    { fontSize:22, fontWeight:700, color:'#fff', letterSpacing:'-0.02em' },
  sub:   { fontSize:13, color:'#4A4F6A', marginTop:4 },
  card:  { background:'#0d0d18', border:'1px solid rgba(255,255,255,0.05)', borderRadius:14, padding:'20px 22px' },
  label: { fontSize:11, fontWeight:600, color:'#2a2d4a', textTransform:'uppercase', letterSpacing:'0.08em' },
}
const sc = s => s>=8?'#22d3a5':s>=6?'#00F6FF':'#4A4F6A'

export default function Dashboard() {
  const { demoMode } = useDemoMode()
  const b = demoMode ? { filter:'blur(6px)', userSelect:'none', pointerEvents:'none', transition:'filter 0.2s' } : {}
  const [stats, setStats]     = useState({ total:0, new:0, contacted:0, interested:0, clients:0, today:0, needsContact:0 })
  const [leads, setLeads]     = useState([])
  const [runs, setRuns]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0]

      const res = await fetch('/api/dashboard')
      const { leads: allLeads } = await res.json()

      if (allLeads) {
        const todayLeads = allLeads.filter(l => l.created_at?.startsWith(today))
        setStats({
          total:        allLeads.length,
          new:          allLeads.filter(l => l.status === 'new').length,
          contacted:    allLeads.filter(l => l.status === 'contacted').length,
          interested:   allLeads.filter(l => l.status === 'interested').length,
          clients:      allLeads.filter(l => l.status === 'client').length,
          today:        todayLeads.length,
          needsContact: allLeads.filter(l => l.status === 'new' && l.email).length,
        })
        setLeads(allLeads.slice(0, 7))
      }
      setRuns([])
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    { label:'Total Leads',    value:stats.total,        color:'#00F6FF',  icon:'◈' },
    { label:'New Today',      value:stats.today,        color:'#22d3a5',  icon:'✦' },
    { label:'Need Contact',   value:stats.needsContact, color:'#fb923c',  icon:'⚡' },
    { label:'Interested',     value:stats.interested,   color:'#a78bfa',  icon:'★' },
    { label:'Clients',        value:stats.clients,      color:'#22d3a5',  icon:'✓' },
  ]

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{marginBottom:28}}>
        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}>
          <span style={{width:7,height:7,borderRadius:'50%',background:'#00F6FF',boxShadow:'0 0 6px rgba(0,246,255,0.6)',display:'inline-block',marginRight:4}}/>
          <span style={{fontSize:11,color:'#2a2d4a'}}>Live · {new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span>
        </div>
        <h1 style={S.h1}>Good day, Varghese 👋</h1>
        <p style={S.sub}>Your sales pipeline auto-updates every morning at 8am.</p>
      </div>

      {/* Stat Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:14,marginBottom:20}}>
        {statCards.map(c => (
          <div key={c.label} style={{...S.card, borderColor: c.label==='Need Contact' ? 'rgba(251,146,60,0.15)' : 'rgba(255,255,255,0.05)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
              <span style={S.label}>{c.label}</span>
              <span style={{fontSize:14,color:c.color,opacity:0.7}}>{c.icon}</span>
            </div>
            <div style={{fontSize:36,fontWeight:700,color:'#fff',letterSpacing:'-0.03em',lineHeight:1}}>
              {loading ? '—' : c.value}
            </div>
            {c.label==='Need Contact' && !loading && c.value > 0 && (
              <div style={{marginTop:10,fontSize:11,color:'#fb923c'}}>
                → <Link href="/leads?filter=new" style={{color:'#fb923c'}}>Contact these now</Link>
              </div>
            )}
            <div style={{marginTop:12,height:2,borderRadius:99,background:'rgba(255,255,255,0.04)'}}>
              <div style={{height:'100%',borderRadius:99,background:c.color,width:'100%',transition:'width 1s ease'}}/>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:18}}>

        {/* Priority Leads */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={S.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:'#fff'}}>Priority Leads</div>
                <div style={{fontSize:12,color:'#4A4F6A',marginTop:2}}>Highest score — contact these first</div>
              </div>
              <Link href="/leads" style={{fontSize:12,color:'#00F6FF',textDecoration:'none',fontWeight:500}}>View all →</Link>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:4}}>
              {loading ? [1,2,3,4,5].map(i => <div key={i} style={{height:52,borderRadius:10,background:'#111120'}}/>)
              : leads.length === 0
                ? <div style={{textAlign:'center',padding:'32px 0',color:'#2a2d4a',fontSize:13}}>No leads yet. System runs at 8am daily.</div>
                : leads.map((l,i) => (
                <div key={l.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.03)'}}>
                  <div style={{width:26,height:26,borderRadius:8,background:'rgba(0,246,255,0.08)',border:'1px solid rgba(0,246,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#00F6FF',flexShrink:0}}>{i+1}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#e8ecf0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',...b}}>{l.full_name}</div>
                    <div style={{fontSize:11,color:'#4A4F6A',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.title} · <span style={b}>{l.company}</span></div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
                    {l.email && <span style={{fontSize:11,color:'#22d3a5'}}>✓ email</span>}
                    <span style={{fontSize:13,fontWeight:700,color:sc(l.score)}}>{l.score}<span style={{fontSize:11,color:'#2a2d4a',fontWeight:400}}>/10</span></span>
                    <span style={{fontSize:11,padding:'2px 8px',borderRadius:99,
                      background: l.status==='new'?'rgba(167,139,250,0.1)':l.status==='contacted'?'rgba(96,165,250,0.1)':'rgba(34,211,165,0.1)',
                      color:      l.status==='new'?'#a78bfa':l.status==='contacted'?'#60a5fa':'#22d3a5',
                    }}>{l.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Run History */}
          <div style={S.card}>
            <div style={{fontSize:14,fontWeight:600,color:'#fff',marginBottom:16}}>Daily Auto-Run History</div>
            {loading ? <div style={{height:80,borderRadius:10,background:'#111120'}}/> :
            runs.length === 0 ? (
              <div style={{textAlign:'center',padding:'20px 0',color:'#2a2d4a',fontSize:13}}>
                First run happens tomorrow at 8am UTC 🕗
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {runs.map((r,i) => (
                  <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',borderRadius:8,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.03)'}}>
                    <div style={{fontSize:12,color:'#c8cad8'}}>{new Date(r.run_date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}</div>
                    <div style={{display:'flex',gap:16}}>
                      <span style={{fontSize:12}}><span style={{color:'#22d3a5',fontWeight:700}}>+{r.leads_added}</span> <span style={{color:'#4A4F6A'}}>added</span></span>
                      <span style={{fontSize:12,color:'#4A4F6A'}}>{r.total_companies_searched} searched</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {/* Outreach meter */}
          <div style={S.card}>
            <div style={{fontSize:14,fontWeight:600,color:'#fff',marginBottom:6}}>Outreach Needed</div>
            <div style={{fontSize:11,color:'#4A4F6A',marginBottom:16}}>Leads with email, not yet contacted</div>
            <div style={{textAlign:'center',padding:'12px 0'}}>
              <div style={{fontSize:52,fontWeight:800,color: stats.needsContact>20?'#fb923c':'#00F6FF',letterSpacing:'-0.04em',lineHeight:1}}>
                {loading?'—':stats.needsContact}
              </div>
              <div style={{fontSize:12,color:'#4A4F6A',marginTop:6}}>leads waiting</div>
            </div>
            <Link href="/leads" style={{
              display:'block',textAlign:'center',padding:'10px',borderRadius:10,marginTop:8,
              background:'rgba(0,246,255,0.08)',border:'1px solid rgba(0,246,255,0.18)',
              color:'#00F6FF',fontSize:13,fontWeight:600,textDecoration:'none',
            }}>Start Contacting →</Link>
          </div>

          {/* Pipeline Progress */}
          <div style={S.card}>
            <div style={{fontSize:14,fontWeight:600,color:'#fff',marginBottom:16}}>Pipeline</div>
            {[
              {label:'New',       val:stats.new,       tot:stats.total, color:'#a78bfa'},
              {label:'Contacted', val:stats.contacted, tot:stats.total, color:'#60a5fa'},
              {label:'Interested',val:stats.interested,tot:stats.total, color:'#fb923c'},
              {label:'Clients',   val:stats.clients,   tot:stats.total, color:'#22d3a5'},
            ].map(t => (
              <div key={t.label} style={{marginBottom:14}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                  <span style={{fontSize:12,color:'#4A4F6A'}}>{t.label}</span>
                  <span style={{fontSize:12,fontWeight:600,color:'#e8ecf0'}}>{t.val}<span style={{color:'#2a2d4a'}}>/{t.tot}</span></span>
                </div>
                <div style={{height:3,borderRadius:99,background:'rgba(255,255,255,0.04)'}}>
                  <div style={{height:'100%',borderRadius:99,background:t.color,width:t.tot?Math.min((t.val/t.tot)*100,100)+'%':'0%',transition:'width 1s ease'}}/>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={S.card}>
            <div style={{fontSize:14,fontWeight:600,color:'#fff',marginBottom:12}}>Quick Actions</div>
            {[
              {href:'/leads',    label:'View All Leads',   color:'#00F6FF', bg:'rgba(0,246,255,0.08)',   border:'rgba(0,246,255,0.18)'},
              {href:'/outreach', label:'Write Email',      color:'#60a5fa', bg:'rgba(96,165,250,0.08)',  border:'rgba(96,165,250,0.15)'},
              {href:'/pipeline', label:'View Pipeline',    color:'#a78bfa', bg:'rgba(167,139,250,0.08)', border:'rgba(167,139,250,0.15)'},
            ].map(a => (
              <Link key={a.href} href={a.href} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:10,background:a.bg,border:`1px solid ${a.border}`,textDecoration:'none',marginBottom:6,color:a.color,fontSize:13,fontWeight:500}}>
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
