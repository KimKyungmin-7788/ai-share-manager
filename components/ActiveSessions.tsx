'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Session } from '@/lib/types'
import { formatTime, isSessionExpired } from '@/lib/utils'
import { Monitor, Clock, User, CheckCircle } from 'lucide-react'

export default function ActiveSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchActiveSessions() {
    const now = new Date().toISOString()
    const { data } = await supabase
      .from('sessions')
      .select('*, programs(name)')
      .eq('status', 'active')
      .gte('end_time', now)
      .order('start_time', { ascending: true })
    setSessions(data || [])
    setLoading(false)
  }

  async function markExpiredSessions() {
    const now = new Date().toISOString()
    await supabase
      .from('sessions')
      .update({ status: 'completed' })
      .eq('status', 'active')
      .lt('end_time', now)
  }

  useEffect(() => {
    fetchActiveSessions()
    markExpiredSessions()

    const channel = supabase
      .channel('sessions-active')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        fetchActiveSessions()
        markExpiredSessions()
      })
      .subscribe()

    const timer = setInterval(() => {
      fetchActiveSessions()
      markExpiredSessions()
    }, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(timer)
    }
  }, [])

  function getRemainingMinutes(endTime: string) {
    const diff = new Date(endTime).getTime() - Date.now()
    return Math.max(0, Math.floor(diff / 60000))
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Monitor className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-800">진행 중</h2>
        <span className="ml-auto bg-blue-50 text-blue-600 text-xs font-medium px-2.5 py-1 rounded-full">
          {sessions.length}개 활성
        </span>
      </div>

      <div className="divide-y divide-gray-50">
        {loading ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">불러오는 중...</div>
        ) : sessions.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <CheckCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">현재 사용 중인 프로그램이 없습니다</p>
          </div>
        ) : (
          sessions.map((s) => {
            const remaining = getRemainingMinutes(s.end_time)
            const isUrgent = remaining <= 10
            return (
              <div key={s.id} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{s.programs?.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <User className="w-3 h-3" />
                      {s.user_name}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatTime(s.start_time)} ~ {formatTime(s.end_time)}
                    </span>
                  </div>
                </div>
                <div className={`text-right shrink-0`}>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      isUrgent
                        ? 'bg-red-50 text-red-600'
                        : 'bg-green-50 text-green-600'
                    }`}
                  >
                    {remaining}분 남음
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
