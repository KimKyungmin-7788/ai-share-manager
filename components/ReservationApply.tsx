'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Program, Session } from '@/lib/types'
import { format, addHours, isBefore } from 'date-fns'
import { ko } from 'date-fns/locale'
import { X } from 'lucide-react'

type ConflictInfo = {
  programName: string
  reservations: { user_name: string; start_time: string; end_time: string }[]
}

export default function ReservationApply() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedProgram, setSelectedProgram] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [startHour, setStartHour] = useState('')
  const [hours, setHours] = useState('1')
  const [userName, setUserName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [conflict, setConflict] = useState<ConflictInfo | null>(null)

  async function fetchData() {
    const now = new Date().toISOString()
    const [{ data: progs }, { data: sess }] = await Promise.all([
      supabase.from('programs').select('*').eq('is_active', true).order('name'),
      supabase.from('sessions').select('*').in('status', ['reserved', 'active']).gte('start_time', now),
    ])
    setPrograms(progs || [])
    setSessions(sess || [])
  }

  useEffect(() => {
    fetchData()
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
    const channel = supabase
      .channel('reservation-v4')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'programs' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  function getSlotCount(date: string, hour: number, programId: string) {
    if (!programId) return 0
    return sessions.filter((s) => {
      const st = new Date(s.start_time)
      return s.program_id === programId && format(st, 'yyyy-MM-dd') === date && st.getHours() === hour
    }).length
  }

  const today = format(new Date(), 'yyyy-MM-dd')
  const currentHour = new Date().getHours()
  const hourOptions = Array.from({ length: 24 }, (_, i) => i).filter((h) =>
    selectedDate === today ? h > currentHour : true
  )

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    if (!userName.trim() || !selectedProgram || !selectedDate || startHour === '') return

    const startTime = new Date(`${selectedDate}T${String(startHour).padStart(2, '0')}:00:00`)
    const endTime = addHours(startTime, Number(hours))

    if (isBefore(startTime, new Date())) {
      setMessage({ type: 'error', text: '과거 시간은 예약할 수 없습니다.' })
      return
    }

    // 중복 체크 (같은 프로그램, 같은 시간)
    const conflicting = sessions.filter(
      (s) => s.program_id === selectedProgram &&
        new Date(s.start_time).getTime() === startTime.getTime()
    )

    if (conflicting.length > 0) {
      const prog = programs.find((p) => p.id === selectedProgram)
      // 해당 프로그램의 전체 예약 현황 표시
      const allReservations = sessions
        .filter((s) => s.program_id === selectedProgram)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        .map((s) => ({ user_name: s.user_name, start_time: s.start_time, end_time: s.end_time }))

      setConflict({ programName: prog?.name || '', reservations: allReservations })
      return
    }

    const dup = sessions.some(
      (s) => s.program_id === selectedProgram && s.user_name === userName.trim() && new Date(s.start_time).getTime() === startTime.getTime()
    )
    if (dup) { setMessage({ type: 'error', text: '이미 해당 시간에 예약하셨습니다.' }); return }

    setSubmitting(true)
    const { error } = await supabase.from('sessions').insert({
      program_id: selectedProgram,
      user_name: userName.trim(),
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'reserved',
    })
    setSubmitting(false)
    if (error) { setMessage({ type: 'error', text: '신청 중 오류가 발생했습니다.' }); return }
    setMessage({ type: 'success', text: `예약 완료: ${format(startTime, 'M/d(EEE) HH:mm', { locale: ko })} ~ ${format(endTime, 'HH:mm')} (${hours}시간)` })
    setUserName(''); setStartHour(''); setHours('1')
    fetchData()
    setTimeout(() => setMessage(null), 5000)
  }

  return (
    <>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 text-center">
          <p className="text-base font-bold text-black">예약 신청</p>
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mt-0.5">Reserve</p>
        </div>

        <form onSubmit={handleApply} className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">프로그램</label>
            <div className="relative">
              <select value={selectedProgram} onChange={(e) => { setSelectedProgram(e.target.value); setStartHour('') }}
                className="w-full appearance-none px-3 py-2 pr-8 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:border-black">
                <option value="">선택하세요</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">날짜</label>
            <input type="date" value={selectedDate} min={today}
              onChange={(e) => { setSelectedDate(e.target.value); setStartHour('') }}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:border-black" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">시작 시간</label>
            <div className="relative">
              <select value={startHour} onChange={(e) => setStartHour(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-8 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:border-black">
                <option value="">선택하세요</option>
                {hourOptions.map((h) => {
                  const count = getSlotCount(selectedDate, h, selectedProgram)
                  return <option key={h} value={h}>{String(h).padStart(2, '0')}:00{count > 0 ? ` (${count}명 예약)` : ''}</option>
                })}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">이용 시간</label>
            <div className="relative">
              <select value={hours} onChange={(e) => setHours(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-8 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:border-black">
                {Array.from({ length: 8 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={h}>{h}시간</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">이름</label>
            <input type="text" placeholder="이름 입력" value={userName} onChange={(e) => setUserName(e.target.value)}
              maxLength={20}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black" />
          </div>

          {message && (
            <p className={`text-xs ${message.type === 'success' ? 'text-gray-700' : 'text-red-500'}`}>{message.text}</p>
          )}

          <button type="submit" disabled={submitting || !userName.trim() || !selectedProgram || !selectedDate || startHour === ''}
            className="w-full py-2 bg-black hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded-md transition-colors">
            {submitting ? '신청 중...' : '예약 신청하기'}
          </button>
        </form>
      </div>

      {/* 중복 예약 팝업 */}
      {conflict && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-black">{conflict.programName} 예약 현황</p>
                <p className="text-xs text-gray-500 mt-0.5">비어있는 시간을 골라 입력해주세요.</p>
              </div>
              <button onClick={() => setConflict(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {conflict.reservations.length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">예약 내역이 없습니다.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">시간</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">사용자</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {conflict.reservations.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-xs text-gray-700 tabular-nums">
                          {format(new Date(r.start_time), 'M/d HH:mm', { locale: ko })} ~{' '}
                          {format(new Date(r.end_time), 'HH:mm')}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-700">{r.user_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-100">
              <button onClick={() => setConflict(null)}
                className="w-full py-2 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-md transition-colors">
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
