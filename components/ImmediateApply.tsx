'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Program, Session } from '@/lib/types'
import { formatTime } from '@/lib/utils'
import { addHours } from 'date-fns'
import { Zap, CheckCircle, XCircle } from 'lucide-react'

export default function ImmediateApply() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [activeSessions, setActiveSessions] = useState<Session[]>([])
  const [userName, setUserName] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function fetchData() {
    const now = new Date().toISOString()
    const [{ data: progs }, { data: sess }] = await Promise.all([
      supabase.from('programs').select('*').eq('is_active', true).order('name'),
      supabase.from('sessions').select('*').eq('status', 'active').gte('end_time', now),
    ])
    setPrograms(progs || [])
    setActiveSessions(sess || [])
  }

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('immediate-apply')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  function isProgramAvailable(programId: string) {
    return !activeSessions.some((s) => s.program_id === programId)
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    if (!userName.trim() || !selectedProgram) return

    if (!isProgramAvailable(selectedProgram)) {
      setMessage({ type: 'error', text: '해당 프로그램은 현재 사용 중입니다.' })
      return
    }

    setSubmitting(true)
    const now = new Date()
    const endTime = addHours(now, 1)

    const { error } = await supabase.from('sessions').insert({
      program_id: selectedProgram,
      user_name: userName.trim(),
      start_time: now.toISOString(),
      end_time: endTime.toISOString(),
      status: 'active',
    })

    setSubmitting(false)
    if (error) {
      setMessage({ type: 'error', text: '신청 중 오류가 발생했습니다.' })
    } else {
      setMessage({ type: 'success', text: `${formatTime(now.toISOString())} ~ ${formatTime(endTime.toISOString())} 사용 신청 완료!` })
      setUserName('')
      setSelectedProgram('')
    }
    setTimeout(() => setMessage(null), 4000)
  }

  const availablePrograms = programs.filter((p) => isProgramAvailable(p.id))
  const busyPrograms = programs.filter((p) => !isProgramAvailable(p.id))

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Zap className="w-5 h-5 text-yellow-500" />
        <h2 className="text-lg font-semibold text-gray-800">바로 신청</h2>
        <span className="ml-auto bg-yellow-50 text-yellow-600 text-xs font-medium px-2.5 py-1 rounded-full">
          {availablePrograms.length}개 가능
        </span>
      </div>

      <div className="px-6 py-5">
        {programs.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">등록된 프로그램이 없습니다</p>
        ) : (
          <>
            <div className="grid gap-2 mb-5">
              {programs.map((p) => {
                const available = isProgramAvailable(p.id)
                const isSelected = selectedProgram === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={!available}
                    onClick={() => available && setSelectedProgram(isSelected ? '' : p.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : available
                        ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer'
                        : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {available ? (
                      <CheckCircle className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-500' : 'text-green-400'}`} />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span className={`font-medium text-sm ${available ? 'text-gray-800' : 'text-gray-400'}`}>
                      {p.name}
                    </span>
                    <span className={`ml-auto text-xs font-medium shrink-0 ${available ? 'text-green-600' : 'text-red-500'}`}>
                      {available ? '사용 가능' : '사용 중'}
                    </span>
                  </button>
                )
              })}
            </div>

            <form onSubmit={handleApply} className="space-y-3">
              <input
                type="text"
                placeholder="이름 입력"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                maxLength={20}
              />
              <button
                type="submit"
                disabled={submitting || !userName.trim() || !selectedProgram}
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {submitting ? '신청 중...' : '바로 사용 신청 (1시간)'}
              </button>
            </form>
          </>
        )}

        {message && (
          <div
            className={`mt-3 px-4 py-3 rounded-xl text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}
