'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Program, Session } from '@/lib/types'
import { getNextHourSlots } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarClock, Users } from 'lucide-react'

type SlotInfo = {
  start: Date
  end: Date
  label: string
  count: number
}

export default function ReservationApply() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedProgram, setSelectedProgram] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null)
  const [userName, setUserName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function fetchData() {
    const now = new Date().toISOString()
    const later = new Date(Date.now() + 13 * 60 * 60 * 1000).toISOString()
    const [{ data: progs }, { data: sess }] = await Promise.all([
      supabase.from('programs').select('*').eq('is_active', true).order('name'),
      supabase
        .from('sessions')
        .select('*')
        .in('status', ['reserved', 'active'])
        .gte('start_time', now)
        .lte('start_time', later),
    ])
    setPrograms(progs || [])
    setSessions(sess || [])
  }

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('reservation-apply')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  function getSlotCount(slot: { start: Date; end: Date }, programId: string) {
    return sessions.filter(
      (s) =>
        s.program_id === programId &&
        new Date(s.start_time).getTime() === slot.start.getTime()
    ).length
  }

  const slots = getNextHourSlots(12)
  const slotsWithCount: SlotInfo[] = selectedProgram
    ? slots.map((s) => ({
        ...s,
        count: getSlotCount(s, selectedProgram),
      }))
    : slots.map((s) => ({ ...s, count: 0 }))

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    if (!userName.trim() || !selectedProgram || !selectedSlot) return

    const duplicate = sessions.some(
      (s) =>
        s.program_id === selectedProgram &&
        s.user_name === userName.trim() &&
        new Date(s.start_time).getTime() === selectedSlot.start.getTime()
    )
    if (duplicate) {
      setMessage({ type: 'error', text: '이미 해당 시간에 신청하셨습니다.' })
      return
    }

    setSubmitting(true)
    const { error } = await supabase.from('sessions').insert({
      program_id: selectedProgram,
      user_name: userName.trim(),
      start_time: selectedSlot.start.toISOString(),
      end_time: selectedSlot.end.toISOString(),
      status: 'reserved',
    })

    setSubmitting(false)
    if (error) {
      setMessage({ type: 'error', text: '신청 중 오류가 발생했습니다.' })
    } else {
      setMessage({ type: 'success', text: `${selectedSlot.label} 예약 완료!` })
      setUserName('')
      setSelectedSlot(null)
      fetchData()
    }
    setTimeout(() => setMessage(null), 4000)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <CalendarClock className="w-5 h-5 text-purple-500" />
        <h2 className="text-lg font-semibold text-gray-800">예약 신청</h2>
      </div>

      <div className="px-6 py-5 space-y-4">
        {programs.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">등록된 프로그램이 없습니다</p>
        ) : (
          <>
            {/* 프로그램 선택 */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                프로그램 선택
              </label>
              <div className="grid gap-2">
                {programs.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProgram(selectedProgram === p.id ? '' : p.id)
                      setSelectedSlot(null)
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                      selectedProgram === p.id
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-purple-300 text-gray-700'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 시간 슬롯 선택 */}
            {selectedProgram && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  시간대 선택
                </label>
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                  {slotsWithCount.map((slot) => (
                    <button
                      key={slot.start.toISOString()}
                      type="button"
                      onClick={() => setSelectedSlot(selectedSlot?.start.getTime() === slot.start.getTime() ? null : slot)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${
                        selectedSlot?.start.getTime() === slot.start.getTime()
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-100 hover:border-purple-200 hover:bg-purple-50/40'
                      }`}
                    >
                      <span className="text-gray-700 font-medium">{slot.label}</span>
                      <span className={`flex items-center gap-1 text-xs font-semibold shrink-0 ${
                        slot.count === 0 ? 'text-green-500' : 'text-orange-500'
                      }`}>
                        <Users className="w-3 h-3" />
                        {slot.count === 0 ? '여유' : `${slot.count}명 대기`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 이름 입력 및 신청 */}
            <form onSubmit={handleApply} className="space-y-3">
              <input
                type="text"
                placeholder="이름 입력"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                maxLength={20}
              />
              <button
                type="submit"
                disabled={submitting || !userName.trim() || !selectedProgram || !selectedSlot}
                className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {submitting ? '신청 중...' : '예약 신청하기'}
              </button>
            </form>

            {message && (
              <div
                className={`px-4 py-3 rounded-xl text-sm font-medium ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
