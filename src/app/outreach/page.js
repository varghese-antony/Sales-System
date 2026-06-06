'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function OutreachContent() {
  const searchParams = useSearchParams()
  const leadId = searchParams.get('lead')
  const [leads, setLeads] = useState([])
  const [selectedLead, setSelectedLead] = useState(null)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('leads').select('*').order('score', { ascending: false })
      setLeads(data || [])
      if (leadId && data) {
        const lead = data.find(l => l.id === leadId)
        if (lead) setSelectedLead(lead)
      }
    }
    load()
  }, [leadId])

  async function generateEmail() {
    if (!selectedLead) return
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead: selectedLead }),
      })
      const data = await res.json()
      if (data.subject) setSubject(data.subject)
      if (data.body) setMessage(data.body)
    } catch(e) {
      setMessage('Error generating email. Please try again.')
    }
    setGenerating(false)
  }

  async function saveOutreach() {
    if (!selectedLead || !message) return
    await supabase.from('outreach').insert({
      lead_id: selectedLead.id,
      type: 'email',
      subject,
      message,
      status: 'draft',
    })
    await supabase.from('leads').update({ status: 'contacted' }).eq('id', selectedLead.id)
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <div className="fixed left-0 top-0 h-full w-64 bg-[#1a1d27] border-r border-gray-800 p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">Blendery</h1>
          <p className="text-xs text-gray-400 mt-1">Sales System</p>
        </div>
        <nav className="flex flex-col gap-2">
          {[
            { href: '/dashboard', label: 'Dashboard', icon: '📊' },
            { href: '/leads', label: 'Leads', icon: '🎯' },
            { href: '/outreach', label: 'Outreach', icon: '📧', active: true },
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

      <div className="ml-64 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">📧 Outreach</h2>

        <div className="grid grid-cols-3 gap-6">
          {/* Lead Selector */}
          <div className="bg-[#1a1d27] rounded-xl p-5 border border-gray-800">
            <h3 className="text-white font-semibold mb-4">Select a Lead</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {leads.map(lead => (
                <button key={lead.id} onClick={() => setSelectedLead(lead)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedLead?.id === lead.id ? 'bg-blue-600' : 'bg-[#252836] hover:bg-[#2f3347]'
                  }`}>
                  <p className="text-white text-sm font-medium">{lead.full_name}</p>
                  <p className="text-gray-400 text-xs">{lead.company}</p>
                  <p className="text-xs mt-1 text-yellow-400">Score: {lead.score}/10</p>
                </button>
              ))}
            </div>
          </div>

          {/* Email Composer */}
          <div className="col-span-2 bg-[#1a1d27] rounded-xl p-6 border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">Compose Email</h3>
              <button onClick={generateEmail} disabled={!selectedLead || generating}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
                {generating ? '⏳ Generating...' : '✨ AI Generate'}
              </button>
            </div>

            {selectedLead && (
              <div className="mb-4 p-3 bg-[#252836] rounded-lg">
                <p className="text-white text-sm font-medium">To: {selectedLead.full_name}</p>
                <p className="text-gray-400 text-xs">{selectedLead.title} @ {selectedLead.company} · {selectedLead.email}</p>
              </div>
            )}

            <input value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="Subject line..."
              className="w-full bg-[#252836] border border-gray-700 rounded-lg px-4 py-3 text-white text-sm mb-3 focus:outline-none focus:border-blue-500" />

            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder={selectedLead ? 'Click "AI Generate" to write a personalised email, or type your own...' : 'Select a lead first...'}
              rows={14}
              className="w-full bg-[#252836] border border-gray-700 rounded-lg px-4 py-3 text-white text-sm mb-4 focus:outline-none focus:border-blue-500 resize-none" />

            <div className="flex gap-3">
              <button onClick={saveOutreach} disabled={!selectedLead || !message}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white py-3 rounded-lg font-medium transition-all">
                {sent ? '✅ Saved!' : '💾 Save as Draft'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Outreach() {
  return <Suspense fallback={<div className="text-white p-8">Loading...</div>}><OutreachContent /></Suspense>
}
