'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Program, Session } from '@/lib/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import ProgramIcon from './ProgramIcon'
import ApplyModal from './ApplyModal'
import RequestProgramModal from './RequestProgramModal'
import { Plus } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'

// 키워드마다 고정 색상 (동일 키워드 = 동일 색상) — 인라인 스타일로 purge 방지
const BADGE_PALETTE = [
  { background: '#fee2e2', color: '#dc2626' }, // red
  { background: '#ffedd5', color: '#c2410c' }, // orange
  { background: '#fef9c3', color: '#a16207' }, // yellow
  { background: '#dcfce7', color: '#15803d' }, // green
  { background: '#ccfbf1', color: '#0f766e' }, // teal
  { background: '#dbeafe', color: '#1d4ed8' }, // blue
  { background: '#e0e7ff', color: '#4338ca' }, // indigo
  { background: '#f3e8ff', color: '#7c3aed' }, // purple
  { background: '#fce7f3', color: '#be185d' }, // pink
  { background: '#cffafe', color: '#0e7490' }, // cyan
]

function getBadgeStyle(keyword: string) {
  let hash = 0
  for (let i = 0; i < keyword.length; i++) {
    hash = keyword.charCodeAt(i) + ((hash << 5) - hash)
  }
  return BADGE_PALETTE[Math.abs(hash) % BADGE_PALETTE.length]
}

function CategoryBadges({ category }: { category: string | null }) {
  if (!category?.trim()) return null
  const keywords = category.split(',').map(k => k.trim()).filter(Boolean)
  if (keywords.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1">
      {keywords.map((k) => {
        const style = getBadgeStyle(k)
        return (
          <span
            key={k}
            style={{ backgroundColor: style.background, color: style.color }}
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md leading-none"
          >
            {k}
          </span>
        )
      })}
    </div>
  )
}

export default function ActiveSessions() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)

  async function fetchData() {
    const nowIso = new Date().toISOString()
    const [{ data: progs }, { data: sess }] = await Promise.all([
      supabase.from('programs').select('*').eq('is_active', true).order('name'),
      supabase.from('sessions').select('*').in('status', ['active', 'reserved']).gte('end_time', nowIso),
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
      .channel('active-v5')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => { fetchData(); expireSessions() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'programs' }, fetchData)
      .subscribe()
    const dataTick = setInterval(() => { fetchData(); expireSessions() }, 30000)
    const clockTick = setInterval(() => setNow(new Date()), 1000)
    return () => { supabase.removeChannel(channel); clearInterval(dataTick); clearInterval(clockTick) }
  }, [])

  function getActiveSession(programId: string) {
    return sessions.find(s => s.program_id === programId && s.status === 'active') || null
  }

  function getReservedCount(programId: string) {
    return sessions.filter(s => s.program_id === programId && s.status === 'reserved').length
  }

  function getRemainingMinutes(endTime: string) {
    return Math.max(0, Math.floor((new Date(endTime).getTime() - now.getTime()) / 60000))
  }

  const selectedActiveSession = selectedProgram ? getActiveSession(selectedProgram.id) : null

  return (
    <>
      <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white">
        {/* 헤더 */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between" style={{ paddingTop: '18px', paddingBottom: '18px' }}>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-black">현재 상태</span>
            <span className="w-2 h-2 rounded-full bg-red-500" style={{ animation: 'pulse 2.4s ease-in-out infinite' }} />
            <span className="text-xs text-gray-400 font-medium tracking-wider uppercase">Live</span>
          </div>
          <span className="text-xs text-gray-400 tabular-nums">
            {format(now, 'M월 d일 (EEE) HH:mm:ss', { locale: ko })}
          </span>
        </div>

        {/* 카드 그리드 */}
        {loading ? (
          <div className="px-5 py-10 text-sm text-gray-400 text-center">불러오는 중...</div>
        ) : programs.length === 0 ? (
          <div className="px-5 py-10 text-sm text-gray-400 text-center">등록된 프로그램이 없습니다</div>
        ) : (
          <div className="p-4 grid grid-cols-2 gap-4">
            {programs.map(p => {
              const active = getActiveSession(p.id)
              const reservedCount = getReservedCount(p.id)
              const remaining = active ? getRemainingMinutes(active.end_time) : null

              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProgram(p)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all px-4 py-5 flex flex-col gap-3 text-left w-full"
                >
                  {/* 아이콘 + 이름 + 카테고리 */}
                  <div className="flex items-center gap-2.5">
                    <ProgramIcon websiteUrl={p.website_url} name={p.name} size={32} />
                    <div className="min-w-0 flex-1 flex flex-col gap-1">
                      <span className="text-sm font-bold text-black leading-tight truncate">{p.name}</span>
                      <CategoryBadges category={p.category} />
                    </div>
                  </div>

                  {/* 상태 2줄 */}
                  <div className="space-y-1">
                    {/* 1줄: 현재 상태 */}
                    {active ? (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                        <span className="text-xs font-semibold text-red-600">사용 중</span>
                        <span className="text-xs text-gray-400">({remaining}분)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                        <span className="text-xs font-semibold text-green-600">바로 사용 가능</span>
                      </div>
                    )}
                    {/* 2줄: 예약 건수 */}
                    {reservedCount > 0 ? (
                      <div className="flex items-center gap-1.5 pl-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                        <span className="text-xs text-yellow-600 font-medium">예약내역 {reservedCount}건</span>
                      </div>
                    ) : (
                      <div className="h-4" />
                    )}
                  </div>
                </button>
              )
            })}

            {/* Coming Soon 카드 — 프로그램 카드와 동일한 구조/크기 */}
            <button
              onClick={() => setShowRequestModal(true)}
              className="rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-400 bg-white active:scale-[0.98] transition-all px-4 py-5 flex flex-col gap-3 text-left w-full"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4 text-gray-400" />
                </div>
                <div className="min-w-0 flex-1 flex flex-col gap-1">
                  <span className="text-sm font-bold text-gray-300 leading-tight uppercase tracking-wide">Coming</span>
                  <span className="text-sm font-bold text-gray-300 leading-tight uppercase tracking-wide">Soon</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-400 underline underline-offset-2">AI 신청하기</span>
              </div>
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedProgram && (
          <ApplyModal
            key="apply-modal"
            program={selectedProgram}
            activeSession={selectedActiveSession}
            onClose={() => { setSelectedProgram(null); fetchData() }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRequestModal && (
          <RequestProgramModal key="request-modal" onClose={() => setShowRequestModal(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
