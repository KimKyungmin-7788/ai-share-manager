'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Program, Session } from '@/lib/types'
import { formatTime } from '@/lib/utils'
import ProgramIcon from './ProgramIcon'
import { Monitor } from 'lucide-react'

export default function ActiveSessions() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    const now = new Date().toISOString()
    const [{ data: progs }, { data: sess }] = await Promise.all([
      supabase.from('programs').select('*').eq('is_active', true).order('name'),
      supabase.from('sessions').select('*').eq('status', 'active').gte('end_time', now),
    ])
    setPrograms(progs || [])
    setSessions(sess || [])
    setLoading(false)
  }

  async function expireSessions() {
    const now = new Date().toISOString()
    await supabase.from('sessions').update({ status: 'completed' }).eq('status', 'active').lt('end_time', now)
  }

  useEffect(() => {
    fetchData()
    expireSessions()
    const channel = supabase
      .channel('active-sessions-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => { fetchData(); expireSessions() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'programs' }, fetchData)
      .subscribe()
    const timer = setInterval(() => { fetchData(); expireSessions() }, 30000)
    return () => { supabase.removeChannel(channel); clearInterval(timer) }
  }, [])

  function getActiveSession(programId: string) {
    return sessions.find((s) => s.program_id === programId) || null
  }

  function getRemainingMinutes(endTime: string) {
    return Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 60000))
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Monitor className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-800">진행 중</h2>
        <span className="ml-auto text-xs text-gray-400">{programs.length}개 프로그램</span>
      </div>

      <div className="divide-y divide-gray-50">
        {loading ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">불러오는 중...</div>
        ) : programs.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">등록된 프로그램이 없습니다</div>
        ) : (
          programs.map((p) => {
            const active = getActiveSession(p.id)
            const remaining = active ? getRemainingMinutes(active.end_time) : null
            return (
              <div key={p.id} className="px-5 py-3.5 flex items-center gap-3">
                <ProgramIcon websiteUrl={p.website_url} name={p.name} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-800 truncate">{p.name}</p>
                  {active ? (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {active.user_name} · {formatTime(active.start_time)}~{formatTime(active.end_time)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5">사용 가능</p>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  {active ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-medium text-red-600">{remaining}분 남음</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs font-medium text-green-600">사용 가능</span>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
