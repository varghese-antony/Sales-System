'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const STAGES = [
  { key:'new',        label:'New',        color:'#7C6AF7', desc:'Just found' },
  { key:'contacted',  label:'Contacted',  color:'#4F9EF8', desc:'Email sent' },
  { key:'interested', label:'Interested', color:'#fb923c', desc:'Replied positively' },
  { key:'proposal',   label:'Proposal',   color:'#00F6FF', desc:'Sent proposal' },
  { key:'client',     label:'Client',     color:'#22d3a5', desc:'Deal closed 🎉' },
]

export default function Pipeline() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('leads').select('*').then(({ data }) => { setLeads(data||[]); setLoading(false) })
  }, [])

  async function moveStage(lead, stage) {
    await supabase.from('leads').update({ status:stage }).eq('id', lead.id)
    setLeads(leads.map(l => l.id===lead.id ? {...l, status:stage} : l))
  }

  const stageLeads = key => leads.filter(l => l.status === key)

  return (
    <div style={{padding:'32px 36px'}}>
      <div style={{marginBottom:28}}>
        <h1 style={{fontSize:22,fontWeight:700,color:'#fff',letterSpacing:'-0.02em'}}>Pipeline</h1>
        <p style={{fontSize:13,color:'#4A4F6A',marginTop:4}}>Track every lead through your sales stages</p>
      </div>

      {/* Summary bar */}
      <div style={{display:'flex',gap:12,marginBottom:20}}>
        {STAGES.map(stage => (
          <div key={stage.key} style={{flex:1,padding:'12px 16px',borderRadius:12,background:'#0d0d18',border:'1px solid rgba(255,255,255,0.05)'}}>
            <div style={{fontSize:11,color:'#4A4F6A',marginBottom:4}}>{stage.label}</div>
            <div style={{fontSize:22,fontWeight:700,color:stage.color}}>{stageLeads(stage.key).length}</div>
          </div>
        ))}
      </div>

      {/* Kanban */}
      <div style={{display:'flex',gap:14,overflowX:'auto',paddingBottom:16}}>
        {STAGES.map(stage => {
          const sl = stageLeads(stage.key)
          return (
            <div key={stage.key} style={{flexShrink:0,width:240,borderRadius:14,overflow:'hidden',background:'#0d0d18',border:'1px solid rgba(255,255,255,0.05)'}}>
              <div style={{padding:'14px 16px',borderBottom:`2px solid ${stage.color}`}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:'#fff'}}>{stage.label}</div>
                    <div style={{fontSize:11,color:'#4A4F6A',marginTop:2}}>{stage.desc}</div>
                  </div>
                  <div style={{width:22,height:22,borderRadius:'50%',background:`${stage.color}20`,color:stage.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>
                    {sl.length}
                  </div>
                </div>
              </div>
              <div style={{padding:10,minHeight:180}}>
                {loading ? <div style={{height:60,borderRadius:10,background:'#111120'}}/> :
                 sl.length===0 ? <div style={{textAlign:'center',padding:'24px 0',fontSize:12,color:'#2a2d4a'}}>No leads</div> :
                 sl.map(lead => (
                  <div key={lead.id} style={{padding:12,borderRadius:10,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)',marginBottom:8,transition:'all 0.15s'}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#e8ecf0',lineHeight:1.3}}>{lead.full_name}</div>
                    <div style={{fontSize:11,color:'#4A4F6A',marginTop:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{lead.company}</div>
                    <div style={{display:'flex',gap:8,marginTop:6}}>
                      <span style={{fontSize:11,fontWeight:700,color:lead.score>=8?'#22d3a5':'#00F6FF'}}>{lead.score}/10</span>
                      {lead.email && <span style={{fontSize:11,color:'#22d3a5'}}>✓</span>}
                    </div>
                    <div style={{display:'flex',gap:4,marginTop:8,flexWrap:'wrap'}}>
                      {STAGES.filter(s => s.key!==stage.key).slice(0,2).map(s => (
                        <button key={s.key} onClick={()=>moveStage(lead,s.key)}
                          style={{fontSize:11,padding:'2px 8px',borderRadius:6,background:`${s.color}18`,color:s.color,border:'none',cursor:'pointer'}}>
                          → {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
