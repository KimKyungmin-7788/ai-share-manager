'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Program, Session } from '@/lib/types'
import { format, addHours, startOfDay, isBefore } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarClock, Users } from 'lucide-react'

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

  async function fetchData() {
    const now = new Date().toISOString()
    const [{ data: progs }, { data: sess }] = await Promise.all([
      supabase.from('programs').select('*').eq('is_active', true).order('name'),
      supabase
        .from('sessions')
        .select('*')
        .in('status', ['reserved', 'active'])
        .gte('start_time', now),
    ])
    setPrograms(progs || [])
    setSessions(sess || [])
  }

  useEffect(() => {
    fetchData()
    const today = format(new Date(), 'yyyy-MM-dd')
    setSelectedDate(today)
    const channel = supabase
      .channel('reservation-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'programs' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  function getSlotCount(date: string, hour: number, programId: string) {
    if (!programId) return 0
    return sessions.filter((s) => {
      const st = new Date(s.start_time)
      return (
        s.program_id === programId &&
        format(st, 'yyyy-MM-dd') === date &&
        st.getHours() === hour
      )
    }).length
  }

  // 시작 시간 옵션: 선택한 날짜가 오늘이면 현재 시각 이후만, 아니면 0~23
  const today = format(new Date(), 'yyyy-MM-dd')
  const currentHour = new Date().getHours()
  const hourOptions = Array.from({ length: 24 }, (_, i) => i).filter((h) => {
    if (selectedDate === today) return h > currentHour
    return true
  })

  const durationOptions = Array.from({ length: 8 }, (_, i) => i + 1)

  // 최소 날짜 = 오늘
  const minDate = format(new Date(), 'yyyy-MM-dd')

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    if (!userName.trim() || !selectedProgram || !selectedDate || startHour === '') return

    const startTime = new Date(`${selectedDate}T${String(startHour).padStart(2, '0')}:00:00`)
    const endTime = addHours(startTime, Number(hours))

    if (isBefore(startTime, new Date())) {
      setMessage({ type: 'error', text: '과거 시간은 예약할 수 없습니다.' })
      return
    }

    const duplicate = sessions.some(
      (s) =>
        s.program_id === selectedProgram &&
        s.user_name === userName.trim() &&
        new Date(s.start_time).getTime() === startTime.getTime()
    )
    if (duplicate) {
      setMessage({ type: 'error', text: '이미 해당 시간에 예약하셨습니다.' })
      return
    }

    setSubmitting(true)
    const { error } = await supabase.from('sessions').insert({
      program_id: selectedProgram,
      user_name: userName.trim(),
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'reserved',
    })

    setSubmitting(false)
    if (error) {
      setMessage({ type: 'error', text: '신청 중 오류가 발생했습니다.' })
    } else {
      const label = `${format(startTime, 'M/d(EEE) HH:mm', { locale: ko })} ~ ${format(endTime, 'HH:mm')} ${Number(hours)}시간`
      setMessage({ type: 'success', text: `예약 완료! ${label}` })
      setUserName('')
      setStartHour('')
      setHours('1')
      fetchData()
    }
    setTimeout(() => setMessage(null), 5000)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <CalendarClock className="w-5 h-5 text-purple-500" />
        <h2 className="text-lg font-semibold text-gray-800">예약 신청</h2>
      </div>

      <form onSubmit={handleApply} className="px-6 py-5 space-y-3">
        {/* 프로그램 */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">프로그램</label>
          <div className="relative">
            <select
              value={selectedProgram}
              onChange={(e) => { setSelectedProgram(e.target.value); setStartHour('') }}
              className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            >
              <option value="">프로그램 선택</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</div>
          </div>
        </div>

        {/* 날짜 */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">날짜</label>
          <input
            type="date"
            value={selectedDate}
            min={minDate}
            onChange={(e) => { setSelectedDate(e.target.value); setStartHour('') }}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          />
        </div>

        {/* 시작 시간 */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">시작 시간</label>
          <div className="relative">
            <select
              value={startHour}
              onChange={(e) => setStartHour(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            >
              <option value="">시간 선택</option>
              {hourOptions.map((h) => {
                const count = getSlotCount(selectedDate, h, selectedProgram)
                return (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00{count > 0 ? ` (${count}명 예약)` : ''}
                  </option>
                )
              })}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</div>
          </div>
          {selectedProgram && startHour !== '' && (() => {
            const count = getSlotCount(selectedDate, Number(startHour), selectedProgram)
            return count > 0 ? (
              <div className="mt-1.5 flex items-center gap-1 text-xs text-orange-500">
                <Users className="w-3 h-3" /> {count}명 이미 예약됨
              </div>
            ) : null
          })()}
        </div>

        {/* 이용 시간 */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">이용 시간</label>
          <div className="relative">
            <select
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            >
              {durationOptions.map((h) => (
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
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            maxLength={20}
          />
        </div>

        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !userName.trim() || !selectedProgram || !selectedDate || startHour === ''}
          className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-bold rounded-xl transition-colors"
        >
          {submitting ? '신청 중...' : '예약 신청하기'}
        </button>
      </form>
    </div>
  )
}
