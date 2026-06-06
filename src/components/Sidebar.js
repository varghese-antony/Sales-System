'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
  { href: '/leads',     label: 'Leads',     icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/></svg> },
  { href: '/outreach',  label: 'Outreach',  icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
  { href: '/pipeline',  label: 'Pipeline',  icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside style={{
      position:'fixed', left:0, top:0, bottom:0, width:220,
      background:'#060610', borderRight:'1px solid rgba(0,246,255,0.06)',
      display:'flex', flexDirection:'column', zIndex:100,
    }}>
      {/* Logo */}
      <div style={{ padding:'20px 16px 16px', borderBottom:'1px solid rgba(0,246,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Image
            src="/blendery-logo.png"
            alt="Blendery"
            width={32}
            height={32}
            style={{ objectFit:'contain', filter:'drop-shadow(0 0 6px rgba(0,246,255,0.4))' }}
          />
          <div>
            <div style={{ fontWeight:700, fontSize:14, color:'#fff', letterSpacing:'-0.01em' }}>Blendery</div>
            <div style={{ fontSize:11, color:'rgba(0,246,255,0.4)', marginTop:1 }}>Sales Intelligence</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'12px 8px' }}>
        <div style={{ fontSize:10, fontWeight:600, color:'rgba(0,246,255,0.2)', letterSpacing:'0.1em', textTransform:'uppercase', padding:'0 8px', marginBottom:8 }}>Menu</div>
        {nav.map(item => {
          const active = path === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              display:'flex', alignItems:'center', gap:10, padding:'8px 10px',
              borderRadius:8, marginBottom:2, textDecoration:'none', transition:'all 0.15s',
              background: active ? 'rgba(0,246,255,0.08)' : 'transparent',
              color: active ? '#00F6FF' : '#4A4F6A',
            }}>
              <span style={{ flexShrink:0, color: active ? '#00F6FF' : '#2a2d4a' }}>{item.icon}</span>
              <span style={{ fontSize:13, fontWeight: active ? 600 : 500 }}>{item.label}</span>
              {active && <div style={{ marginLeft:'auto', width:3, height:16, borderRadius:99, background:'#00F6FF', boxShadow:'0 0 8px rgba(0,246,255,0.6)' }}/>}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div style={{ padding:'12px 12px 16px', borderTop:'1px solid rgba(0,246,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, background:'rgba(0,246,255,0.04)' }}>
          <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,246,255,0.12)', border:'1px solid rgba(0,246,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#00F6FF' }}>VA</span>
          </div>
          <div style={{ overflow:'hidden' }}>
            <div style={{ fontSize:12, fontWeight:600, color:'#e8ecf0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>Varghese Antony</div>
            <div style={{ fontSize:11, color:'rgba(0,246,255,0.35)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>Blendery Tech</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
