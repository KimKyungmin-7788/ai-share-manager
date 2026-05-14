'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Program, Session } from '@/lib/types'
import { addHours } from 'date-fns'
import { Zap } from 'lucide-react'
import AccountPopup from './AccountPopup'
import ProgramIcon from './ProgramIcon'

export default function ImmediateApply() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [activeSessions, setActiveSessions] = useState<Session[]>([])
  const [selectedProgram, setSelectedProgram] = useState('')
  const [hours, setHours] = useState('1')
  const [userName, setUserName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [popup, setPopup] = useState<{ accountId: string; accountPw: string; programName: string } | null>(null)
  const [error, setError] = useState('')

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
      .channel('immediate-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'programs' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const selectedProgramData = programs.find((p) => p.id === selectedProgram)
  const isOccupied = activeSessions.some((s) => s.program_id === selectedProgram)

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    if (!userName.trim() || !selectedProgram) return
    if (isOccupied) { setError('현재 사용 중인 프로그램입니다.'); return }

    setSubmitting(true)
    setError('')
    const now = new Date()
    const endTime = addHours(now, Number(hours))

    const { error: err } = await supabase.from('sessions').insert({
      program_id: selectedProgram,
      user_name: userName.trim(),
      start_time: now.toISOString(),
      end_time: endTime.toISOString(),
      status: 'active',
    })

    setSubmitting(false)
    if (err) { setError('신청 중 오류가 발생했습니다.'); return }

    if (selectedProgramData?.account_id && selectedProgramData?.account_pw) {
      setPopup({
        accountId: selectedProgramData.account_id,
        accountPw: selectedProgramData.account_pw,
        programName: selectedProgramData.name,
      })
    }
    setUserName('')
    setSelectedProgram('')
    setHours('1')
    fetchData()
  }

  const hourOptions = Array.from({ length: 8 }, (_, i) => i + 1)

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold text-gray-800">바로 사용 신청</h2>
        </div>

        <form onSubmit={handleApply} className="px-6 py-5 space-y-3">
          {/* 프로그램 선택 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">프로그램</label>
            <div className="relative">
              <select
                value={selectedProgram}
                onChange={(e) => { setSelectedProgram(e.target.value); setError('') }}
                className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                <option value="">프로그램 선택</option>
                {programs.map((p) => {
                  const busy = activeSessions.some((s) => s.program_id === p.id)
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name}{busy ? ' (사용 중)' : ' (사용 가능)'}
                    </option>
                  )
                })}
              </select>
              {selectedProgramData && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                </div>
              )}
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</div>
            </div>
            {selectedProgram && (
              <div className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium ${isOccupied ? 'text-red-500' : 'text-green-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOccupied ? 'bg-red-500' : 'bg-green-500'}`} />
                {isOccupied ? '현재 사용 중' : '사용 가능'}
              </div>
            )}
          </div>

          {/* 이용 시간 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">이용 시간</label>
            <div className="relative">
              <select
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                {hourOptions.map((h) => (
                  <option key={h} value={h}>{h}시간</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</div>
            </div>
          </div>

          {/* 이름 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">이름</label>
            <input
              type="text"
              placeholder="이름 입력"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              maxLength={20}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !userName.trim() || !selectedProgram || isOccupied}
            className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-200 disabled:text-gray-400 text-gray-900 text-sm font-bold rounded-xl transition-colors"
          >
            {submitting ? '신청 중...' : '바로 사용하기'}
          </button>
        </form>
      </div>

      {popup && (
        <AccountPopup
          accountId={popup.accountId}
          accountPw={popup.accountPw}
          programName={popup.programName}
          onClose={() => setPopup(null)}
        />
      )}
    </>
  )
}
