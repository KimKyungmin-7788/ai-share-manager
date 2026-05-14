'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Program, Session } from '@/lib/types'
import { addHours, format, isBefore } from 'date-fns'
import { X, Zap, CalendarClock, Check } from 'lucide-react'
import AccountPopup from './AccountPopup'

type Props = {
  program: Program
  activeSession: Session | null
  onClose: () => void
}

type Step = 'choose' | 'immediate' | 'reservation' | 'done'

export default function ApplyModal({ program, activeSession, onClose }: Props) {
  const [step, setStep] = useState<Step>(activeSession ? 'reservation' : 'choose')
  const [userName, setUserName] = useState('')
  const [hours, setHours] = useState('1')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [startHour, setStartHour] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [reservedSessions, setReservedSessions] = useState<Session[]>([])
  const [popup, setPopup] = useState<{ accountId: string; accountPw: string; programName: string } | null>(null)
  const [isClosing, setIsClosing] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')
  const currentHour = new Date().getHours()
  const hourOptions = Array.from({ length: 24 }, (_, i) => i).filter(h =>
    selectedDate === today ? h > currentHour : true
  )

  useEffect(() => {
    async function fetchReservations() {
      const now = new Date().toISOString()
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('program_id', program.id)
        .in('status', ['reserved', 'active'])
        .gte('end_time', now)
      setReservedSessions(data || [])
    }
    fetchReservations()
  }, [program.id])

  function close() {
    setIsClosing(true)
    setTimeout(() => onClose(), 250)
  }

  function getSlotCount(date: string, hour: number) {
    return reservedSessions.filter(s => {
      const st = new Date(s.start_time)
      return format(st, 'yyyy-MM-dd') === date && st.getHours() === hour
    }).length
  }

  async function handleImmediate() {
    if (!userName.trim()) return
    setSubmitting(true)
    setError('')
    const now = new Date()
    const { error: err } = await supabase.from('sessions').insert({
      program_id: program.id,
      user_name: userName.trim(),
      start_time: now.toISOString(),
      end_time: addHours(now, Number(hours)).toISOString(),
      status: 'active',
    })
    setSubmitting(false)
    if (err) { setError('신청 중 오류가 발생했습니다.'); return }
    if (program.account_id && program.account_pw) {
      setPopup({ accountId: program.account_id, accountPw: program.account_pw, programName: program.name })
    } else {
      close()
    }
  }

  async function handleReservation() {
    if (!userName.trim() || !selectedDate || startHour === '') return
    const startTime = new Date(`${selectedDate}T${String(startHour).padStart(2, '0')}:00:00`)
    const endTime = addHours(startTime, Number(hours))

    if (isBefore(startTime, new Date())) {
      setError('과거 시간은 예약할 수 없습니다.')
      return
    }

    const conflicting = reservedSessions.filter(
      s => new Date(s.start_time).getTime() === startTime.getTime()
    )
    if (conflicting.length > 0) {
      setError('해당 시간에 이미 예약이 있습니다. 다른 시간을 선택해주세요.')
      return
    }

    setSubmitting(true)
    setError('')
    const { error: err } = await supabase.from('sessions').insert({
      program_id: program.id,
      user_name: userName.trim(),
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'reserved',
    })
    setSubmitting(false)
    if (err) { setError('신청 중 오류가 발생했습니다.'); return }
    setStep('done')
  }

  if (popup) {
    return (
      <AccountPopup
        accountId={popup.accountId}
        accountPw={popup.accountPw}
        programName={popup.programName}
        onClose={close}
      />
    )
  }

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-end justify-center z-50 ${isClosing ? 'modal-backdrop-out' : 'modal-backdrop-in'}`}
      onClick={close}
    >
      <div
        className={`bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] flex flex-col ${isClosing ? 'modal-sheet-out' : 'modal-sheet-in'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="px-5 py-3 flex items-start justify-between shrink-0">
          <div>
            <p className="text-lg font-bold text-black">{program.name}</p>
            {step === 'choose' && (
              <p className="text-sm text-gray-500 mt-0.5">신청 방식을 선택해주세요</p>
            )}
            {step === 'immediate' && (
              <p className="text-sm text-gray-500 mt-0.5">지금 바로 사용 신청</p>
            )}
            {step === 'reservation' && (
              <p className="text-sm text-gray-500 mt-0.5">예약 신청</p>
            )}
          </div>
          <button onClick={close} className="p-2 hover:bg-gray-100 rounded-xl transition-colors mt-0.5">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="px-5 pb-10 space-y-4 overflow-y-auto">

          {/* 사용 중 안내 — 간결하게 */}
          {step === 'reservation' && activeSession && (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
              <p className="text-sm font-semibold text-gray-800">
                현재 {activeSession.user_name}선생님 사용 중
                <span className="font-normal text-gray-500"> (~{format(new Date(activeSession.end_time), 'HH:mm')} 종료)</span>
              </p>
              <p className="text-sm text-gray-500 mt-0.5">이후 시간으로 예약해주세요.</p>
            </div>
          )}

          {/* STEP: 방식 선택 */}
          {step === 'choose' && (
            <div className="space-y-3 pt-1">
              <button
                onClick={() => setStep('immediate')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-100 rounded-2xl hover:border-black hover:bg-gray-50 active:bg-gray-100 transition-all text-left"
              >
                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-base font-bold text-black">지금 바로 사용</p>
                  <p className="text-sm text-gray-500 mt-0.5">즉시 계정을 받아 바로 시작합니다</p>
                </div>
              </button>
              <button
                onClick={() => setStep('reservation')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-100 rounded-2xl hover:border-black hover:bg-gray-50 active:bg-gray-100 transition-all text-left"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center shrink-0">
                  <CalendarClock className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-base font-bold text-black">예약하기</p>
                  <p className="text-sm text-gray-500 mt-0.5">원하는 시간을 미리 예약합니다</p>
                </div>
              </button>
            </div>
          )}

          {/* STEP: 바로 사용 */}
          {step === 'immediate' && (
            <div className="space-y-5 pt-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이용 시간</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHours(String(h))}
                      className={`py-3 rounded-xl text-sm font-semibold transition-colors ${
                        hours === String(h)
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                      }`}
                    >
                      {h}시간
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                <input
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  maxLength={20}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base focus:outline-none focus:border-black transition-colors"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                onClick={handleImmediate}
                disabled={submitting || !userName.trim()}
                className="w-full py-4 bg-black hover:bg-gray-800 active:bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 text-white text-base font-bold rounded-2xl transition-colors"
              >
                {submitting ? '신청 중...' : '바로 사용 신청하기'}
              </button>
            </div>
          )}

          {/* STEP: 예약 */}
          {step === 'reservation' && (
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={today}
                  onChange={e => { setSelectedDate(e.target.value); setStartHour('') }}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base bg-white focus:outline-none focus:border-black transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">시작 시간</label>
                <div className="relative">
                  <select
                    value={startHour}
                    onChange={e => setStartHour(e.target.value)}
                    className="w-full appearance-none px-4 py-3.5 border border-gray-200 rounded-2xl text-base bg-white focus:outline-none focus:border-black transition-colors"
                  >
                    <option value="">시간 선택</option>
                    {hourOptions.map(h => {
                      const count = getSlotCount(selectedDate, h)
                      return (
                        <option key={h} value={h}>
                          {String(h).padStart(2, '0')}:00{count > 0 ? ` (${count}명 예약됨)` : ''}
                        </option>
                      )
                    })}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">▾</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이용 시간</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHours(String(h))}
                      className={`py-3 rounded-xl text-sm font-semibold transition-colors ${
                        hours === String(h)
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                      }`}
                    >
                      {h}시간
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                <input
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  maxLength={20}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base focus:outline-none focus:border-black transition-colors"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                onClick={handleReservation}
                disabled={submitting || !userName.trim() || !selectedDate || startHour === ''}
                className="w-full py-4 bg-black hover:bg-gray-800 active:bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 text-white text-base font-bold rounded-2xl transition-colors"
              >
                {submitting ? '신청 중...' : '예약 신청하기'}
              </button>
            </div>
          )}

          {/* STEP: 완료 */}
          {step === 'done' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-black">예약 완료!</p>
                <p className="text-sm text-gray-500 mt-1">{program.name} 예약이 접수되었습니다.</p>
              </div>
              <button
                onClick={close}
                className="w-full py-4 bg-black hover:bg-gray-800 text-white text-base font-bold rounded-2xl transition-colors"
              >
                확인
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
