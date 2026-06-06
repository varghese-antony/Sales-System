'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const STAGES = [
  { key: 'new', label: '✨ New', color: 'border-purple-600' },
  { key: 'contacted', label: '📧 Contacted', color: 'border-yellow-600' },
  { key: 'interested', label: '🔥 Interested', color: 'border-orange-600' },
  { key: 'proposal', label: '📋 Proposal', color: 'border-blue-600' },
  { key: 'won', label: '💰 Won', color: 'border-green-600' },
]

export default function Pipeline() {
  const [leads, setLeads] = useState([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('leads').select('*')
      setLeads(data || [])
    }
    load()
  }, [])

  async function moveStage(lead, newStage) {
    await supabase.from('leads').update({ status: newStage }).eq('id', lead.id)
    setLeads(leads.map(l => l.id === lead.id ? {...l, status: newStage} : l))
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
            { href: '/outreach', label: 'Outreach', icon: '📧' },
            { href: '/pipeline', label: 'Pipeline', icon: '🔄', active: true },
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
        <h2 className="text-2xl font-bold text-white mb-6">🔄 Pipeline</h2>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const stageLeads = leads.filter(l => l.status === stage.key)
            return (
              <div key={stage.key} className={`flex-shrink-0 w-64 bg-[#1a1d27] rounded-xl border-t-4 ${stage.color} p-4`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-semibold text-sm">{stage.label}</h3>
                  <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">{stageLeads.length}</span>
                </div>
                <div className="space-y-3">
                  {stageLeads.length === 0 ? (
                    <p className="text-gray-500 text-xs text-center py-4">No leads here</p>
                  ) : stageLeads.map(lead => (
                    <div key={lead.id} className="bg-[#252836] rounded-lg p-3">
                      <p className="text-white text-sm font-medium">{lead.full_name}</p>
                      <p className="text-gray-400 text-xs">{lead.company}</p>
                      <p className="text-xs text-yellow-400 mt-1">Score: {lead.score}/10</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {STAGES.filter(s => s.key !== stage.key).map(s => (
                          <button key={s.key} onClick={() => moveStage(lead, s.key)}
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-all">
                            → {s.label.split(' ')[1]}
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
    </div>
  )
}
