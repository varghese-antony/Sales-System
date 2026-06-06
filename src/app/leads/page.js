'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [finding, setFinding] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => { loadLeads() }, [])

  async function loadLeads() {
    setLoading(true)
    const { data } = await supabase.from('leads').select('*').order('score', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }

  async function findLeads() {
    setFinding(true)
    setMessage('🔍 Searching Apollo.io for founder-led businesses in US/UK/Australia...')
    try {
      const res = await fetch('/api/find-leads', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setMessage(`✅ Found ${data.count} new leads! Refreshing...`)
        await loadLeads()
      } else {
        setMessage('❌ Error: ' + data.error)
      }
    } catch(e) {
      setMessage('❌ Something went wrong. Try again.')
    }
    setFinding(false)
    setTimeout(() => setMessage(''), 5000)
  }

  async function updateStatus(id, status) {
    await supabase.from('leads').update({ status }).eq('id', id)
    setLeads(leads.map(l => l.id === id ? {...l, status} : l))
  }

  const filtered = leads.filter(l => {
    const matchFilter = filter === 'all' || l.status === filter
    const matchSearch = !search || 
      (l.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.company || '').toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const statusColors = {
    new: 'bg-purple-900 text-purple-300',
    contacted: 'bg-yellow-900 text-yellow-300',
    replied: 'bg-blue-900 text-blue-300',
    interested: 'bg-green-900 text-green-300',
    not_interested: 'bg-red-900 text-red-300',
    client: 'bg-emerald-900 text-emerald-300',
  }

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
            { href: '/leads', label: 'Leads', icon: '🎯', active: true },
            { href: '/outreach', label: 'Outreach', icon: '📧' },
            { href: '/pipeline', label: 'Pipeline', icon: '🔄' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium
                ${item.active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-[#252836] hover:text-white'}`}>
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div className="ml-64 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">🎯 Leads</h2>
            <p className="text-gray-400 mt-1">{leads.length} leads total</p>
          </div>
          <button onClick={findLeads} disabled={finding}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2">
            {finding ? '⏳ Finding...' : '🔍 Find New Leads'}
          </button>
        </div>

        {message && (
          <div className="mb-4 p-4 bg-[#1a1d27] border border-blue-800 rounded-xl text-blue-300 text-sm">
            {message}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or company..."
            className="flex-1 bg-[#1a1d27] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
          {['all','new','contacted','interested','client'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
                ${filter === s ? 'bg-blue-600 text-white' : 'bg-[#1a1d27] text-gray-400 hover:text-white border border-gray-700'}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Leads Table */}
        <div className="bg-[#1a1d27] rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-4 text-gray-400 text-sm font-medium">Name</th>
                <th className="text-left p-4 text-gray-400 text-sm font-medium">Company</th>
                <th className="text-left p-4 text-gray-400 text-sm font-medium">Email</th>
                <th className="text-left p-4 text-gray-400 text-sm font-medium">Score</th>
                <th className="text-left p-4 text-gray-400 text-sm font-medium">Status</th>
                <th className="text-left p-4 text-gray-400 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center p-8 text-gray-400">Loading leads...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-8 text-gray-400">
                  No leads yet. Click "Find New Leads" to start!
                </td></tr>
              ) : filtered.map(lead => (
                <tr key={lead.id} className="border-b border-gray-800 hover:bg-[#252836] transition-all">
                  <td className="p-4">
                    <p className="text-white text-sm font-medium">{lead.full_name || `${lead.first_name} ${lead.last_name}`}</p>
                    <p className="text-gray-400 text-xs">{lead.title}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-white text-sm">{lead.company}</p>
                    <p className="text-gray-400 text-xs">{lead.country}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-blue-400">{lead.email || '—'}</p>
                    {lead.email_verified && <span className="text-xs text-green-400">✓ verified</span>}
                  </td>
                  <td className="p-4">
                    <span className={`text-sm font-bold ${lead.score >= 8 ? 'text-green-400' : lead.score >= 5 ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {lead.score}/10
                    </span>
                  </td>
                  <td className="p-4">
                    <select value={lead.status} onChange={e => updateStatus(lead.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${statusColors[lead.status] || 'bg-gray-700 text-gray-300'}`}>
                      {['new','contacted','replied','interested','not_interested','client'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">
                    <Link href={`/outreach?lead=${lead.id}`}
                      className="text-xs bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded-lg transition-all">
                      ✉️ Email
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
