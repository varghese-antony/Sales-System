'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  )},
  { href: '/leads', label: 'Leads', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )},
  { href: '/outreach', label: 'Outreach', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  )},
  { href: '/pipeline', label: 'Pipeline', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )},
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside style={{ position: 'fixed', left: 0, top: 0, height: '100vh', width: '240px', display: 'flex', flexDirection: 'column', zIndex: 50, background: '#0B0B16', borderRight: '1px solid rgba(255,255,255,0.05)' }}>

      {/* Logo */}
      <div className="px-6 py-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #F0C96B)' }}>
            <span className="text-black font-bold text-sm">B</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm tracking-wide">Blendery</p>
            <p className="text-xs" style={{ color: '#4A5568' }}>Sales Intelligence</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        <p className="text-xs font-medium px-3 mb-3 uppercase tracking-widest" style={{ color: '#2D3748' }}>Navigation</p>
        {navItems.map(item => {
          const active = path === item.href
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group"
              style={{
                background: active ? 'rgba(201,168,76,0.12)' : 'transparent',
                color: active ? '#C9A84C' : '#4A5568',
              }}>
              <span className="transition-colors duration-200" style={{ color: active ? '#C9A84C' : '#4A5568' }}>
                {item.icon}
              </span>
              <span className="text-sm font-medium" style={{ color: active ? '#C9A84C' : '#718096' }}>
                {item.label}
              </span>
              {active && (
                <div className="ml-auto w-1 h-4 rounded-full" style={{ background: '#C9A84C' }}/>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #F0C96B)', flexShrink: 0 }}>
            VA
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-xs font-medium truncate">Varghese Antony</p>
            <p className="text-xs truncate" style={{ color: '#4A5568' }}>Blendery Tech Solutions</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
