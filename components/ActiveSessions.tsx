'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Program, Session } from '@/lib/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import ProgramIcon from './ProgramIcon'

export default function ActiveSessions() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())

  async function fetchData() {
    const nowIso = new Date().toISOString()
    const [{ data: progs }, { data: sess }] = await Promise.all([
      supabase.from('programs').select('*').eq('is_active', true).order('name'),
      supabase.from('sessions').select('*').eq('status', 'active').gte('end_time', nowIso),
    ])
    setPrograms(progs || [])
    setSessions(sess || [])
    setLoading(false)
  }

  async function expireSessions() {
    const nowIso = new Date().toISOString()
    await supabase.from('sessions').update({ status: 'completed' }).eq('status', 'active').lt('end_time', nowIso)
  }

  useEffect(() => {
    fetchData()
    expireSessions()
    const channel = supabase
      .channel('active-v4')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => { fetchData(); expireSessions() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'programs' }, fetchData)
      .subscribe()
    const dataTick = setInterval(() => { fetchData(); expireSessions() }, 30000)
    const clockTick = setInterval(() => setNow(new Date()), 1000)
    return () => { supabase.removeChannel(channel); clearInterval(dataTick); clearInterval(clockTick) }
  }, [])

  function getActiveSession(programId: string) {
    return sessions.find((s) => s.program_id === programId) || null
  }

  function getRemainingMinutes(endTime: string) {
    return Math.max(0, Math.floor((new Date(endTime).getTime() - now.getTime()) / 60000))
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* 헤더 - 한 줄 */}
      <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-black">현재 상태</span>
          <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Live Status</span>
        </div>
        <span className="text-xs text-gray-400 tabular-nums">
          {format(now, 'yyyy년 M월 d일 (EEE) HH:mm:ss', { locale: ko })}
        </span>
      </div>

      {/* 프로그램 카드 그리드 */}
      {loading ? (
        <div className="px-5 py-6 text-sm text-gray-400 text-center">불러오는 중...</div>
      ) : programs.length === 0 ? (
        <div className="px-5 py-6 text-sm text-gray-400 text-center">등록된 프로그램이 없습니다</div>
      ) : (
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {programs.map((p) => {
            const active = getActiveSession(p.id)
            const remaining = active ? getRemainingMinutes(active.end_time) : null
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-shadow px-3 py-3 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <ProgramIcon websiteUrl={p.website_url} name={p.name} size={22} />
                  <span className="text-xs font-semibold text-black truncate leading-tight">{p.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${active ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                  {active ? (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-700 leading-tight">{active.user_name}</span>
                      <span className="text-xs text-gray-400 leading-tight">{remaining}분 남음</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">사용 가능</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
