'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, interested: 0, clients: 0 })
  const [topLeads, setTopLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: leads } = await supabase.from('leads').select('*').order('score', { ascending: false })
      if (leads) {
        setStats({
          total: leads.length,
          new: leads.filter(l => l.status === 'new').length,
          contacted: leads.filter(l => l.status === 'contacted').length,
          interested: leads.filter(l => l.status === 'interested').length,
          clients: leads.filter(l => l.status === 'client').length,
        })
        setTopLeads(leads.slice(0, 5))
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const statCards = [
    { label: 'Total Leads', value: stats.total, color: 'from-blue-600 to-blue-800', icon: '🎯' },
    { label: 'New', value: stats.new, color: 'from-purple-600 to-purple-800', icon: '✨' },
    { label: 'Contacted', value: stats.contacted, color: 'from-yellow-600 to-yellow-800', icon: '📧' },
    { label: 'Interested', value: stats.interested, color: 'from-green-600 to-green-800', icon: '🔥' },
    { label: 'Clients', value: stats.clients, color: 'from-emerald-600 to-emerald-800', icon: '💰' },
  ]

  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-[#1a1d27] border-r border-gray-800 p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">Blendery</h1>
          <p className="text-xs text-gray-400 mt-1">Sales System</p>
        </div>
        <nav className="flex flex-col gap-2">
          {[
            { href: '/dashboard', label: 'Dashboard', icon: '📊' },
            { href: '/leads', label: 'Leads', icon: '🎯' },
            { href: '/outreach', label: 'Outreach', icon: '📧' },
            { href: '/pipeline', label: 'Pipeline', icon: '🔄' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#252836] hover:text-white transition-all">
              <span>{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto p-3 bg-[#252836] rounded-lg">
          <p className="text-xs text-gray-400">Logged in as</p>
          <p className="text-sm text-white font-medium">Varghese Antony</p>
          <p className="text-xs text-gray-400">Blendery Tech Solutions</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-400 mt-1">Welcome back, Varghese. Here's your sales overview.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {statCards.map(card => (
            <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-xl p-4`}>
              <div className="text-2xl mb-2">{card.icon}</div>
              <div className="text-3xl font-bold text-white">{loading ? '...' : card.value}</div>
              <div className="text-sm text-white/70 mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Top Leads + Quick Actions */}
        <div className="grid grid-cols-3 gap-6">
          {/* Top Leads */}
          <div className="col-span-2 bg-[#1a1d27] rounded-xl p-6 border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">🔥 Top Leads to Contact Today</h3>
              <Link href="/leads" className="text-sm text-blue-400 hover:text-blue-300">View all →</Link>
            </div>
            {loading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : topLeads.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm mb-4">No leads yet. Let's find some!</p>
                <Link href="/leads" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-all">
                  Find Leads →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {topLeads.map(lead => (
                  <div key={lead.id} className="flex items-center justify-between p-3 bg-[#252836] rounded-lg">
                    <div>
                      <p className="text-white text-sm font-medium">{lead.full_name || `${lead.first_name} ${lead.last_name}`}</p>
                      <p className="text-gray-400 text-xs">{lead.title} @ {lead.company}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        lead.score >= 8 ? 'bg-green-900 text-green-300' :
                        lead.score >= 5 ? 'bg-yellow-900 text-yellow-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>Score: {lead.score}/10</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-900 text-blue-300">{lead.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-[#1a1d27] rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">⚡ Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <Link href="/leads?action=find" className="flex items-center gap-3 p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all">
                <span>🔍</span>
                <span className="text-sm text-white font-medium">Find New Leads</span>
              </Link>
              <Link href="/outreach?action=compose" className="flex items-center gap-3 p-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all">
                <span>✉️</span>
                <span className="text-sm text-white font-medium">Write Outreach Email</span>
              </Link>
              <Link href="/pipeline" className="flex items-center gap-3 p-3 bg-[#252836] hover:bg-[#2f3347] border border-gray-700 rounded-lg transition-all">
                <span>🔄</span>
                <span className="text-sm text-white font-medium">View Pipeline</span>
              </Link>
            </div>

            <div className="mt-6 p-3 bg-[#252836] rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">This Month</p>
              <p className="text-white text-sm">🎯 Target: <span className="text-green-400 font-bold">3 clients</span></p>
              <p className="text-white text-sm mt-1">📧 Emails sent: <span className="text-blue-400 font-bold">0</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
