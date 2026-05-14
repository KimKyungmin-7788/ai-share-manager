'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Program, Session } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { Bot, Plus, Trash2, ArrowLeft, Lock, Eye, EyeOff, Users, Calendar } from 'lucide-react'
import ProgramIcon from '@/components/ProgramIcon'

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin1234'

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwError, setPwError] = useState(false)

  const [programs, setPrograms] = useState<Program[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [newProgramName, setNewProgramName] = useState('')
  const [newProgramDesc, setNewProgramDesc] = useState('')
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('')
  const [newAccountId, setNewAccountId] = useState('')
  const [newAccountPw, setNewAccountPw] = useState('')
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<'programs' | 'history'>('programs')

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true)
      setPwError(false)
    } else {
      setPwError(true)
    }
  }

  async function fetchData() {
    const [{ data: progs }, { data: sess }] = await Promise.all([
      supabase.from('programs').select('*').order('created_at', { ascending: false }),
      supabase
        .from('sessions')
        .select('*, programs(name)')
        .order('created_at', { ascending: false })
        .limit(50),
    ])
    setPrograms(progs || [])
    setSessions(sess || [])
  }

  useEffect(() => {
    if (authenticated) fetchData()
  }, [authenticated])

  async function createProgram(e: React.FormEvent) {
    e.preventDefault()
    if (!newProgramName.trim()) return
    setCreating(true)
    await supabase.from('programs').insert({
      name: newProgramName.trim(),
      description: newProgramDesc.trim() || null,
      website_url: newWebsiteUrl.trim() || null,
      account_id: newAccountId.trim() || null,
      account_pw: newAccountPw.trim() || null,
    })
    setNewProgramName('')
    setNewProgramDesc('')
    setNewWebsiteUrl('')
    setNewAccountId('')
    setNewAccountPw('')
    setCreating(false)
    fetchData()
  }

  async function toggleProgram(program: Program) {
    await supabase
      .from('programs')
      .update({ is_active: !program.is_active })
      .eq('id', program.id)
    fetchData()
  }

  async function deleteProgram(id: string) {
    if (!confirm('프로그램을 삭제하면 관련 예약도 모두 삭제됩니다. 계속하시겠습니까?')) return
    await supabase.from('programs').delete().eq('id', id)
    fetchData()
  }

  async function cancelSession(id: string) {
    await supabase.from('sessions').update({ status: 'cancelled' }).eq('id', id)
    fetchData()
  }

  const statusBadge: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    reserved: 'bg-blue-100 text-blue-700',
    completed: 'bg-gray-100 text-gray-500',
    cancelled: 'bg-red-100 text-red-500',
  }
  const statusLabel: Record<string, string> = {
    active: '사용 중',
    reserved: '예약됨',
    completed: '완료',
    cancelled: '취소',
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5 text-gray-400" />
            <h1 className="text-lg font-bold text-gray-800">관리자 로그인</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="관리자 비밀번호"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPwError(false) }}
                className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                  pwError ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pwError && <p className="text-red-500 text-xs">비밀번호가 올바르지 않습니다.</p>}
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              로그인
            </button>
          </form>
          <Link href="/" className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-4 justify-center">
            <ArrowLeft className="w-3 h-3" /> 메인으로
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-800">관리자 패널</h1>
          </div>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> 메인으로
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* 탭 */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('programs')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'programs' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4" /> 프로그램 관리
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'history' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-4 h-4" /> 사용 내역
          </button>
        </div>

        {activeTab === 'programs' && (
          <>
            {/* 프로그램 추가 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4" /> 프로그램 추가
              </h2>
              <form onSubmit={createProgram} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="프로그램 이름 * (예: ChatGPT Plus)"
                    value={newProgramName}
                    onChange={(e) => setNewProgramName(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="웹사이트 URL (아이콘 자동 표시)"
                    value={newWebsiteUrl}
                    onChange={(e) => setNewWebsiteUrl(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="공유 계정 ID (이메일)"
                    value={newAccountId}
                    onChange={(e) => setNewAccountId(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="공유 계정 PW"
                    value={newAccountPw}
                    onChange={(e) => setNewAccountPw(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <input
                  type="text"
                  placeholder="설명 (선택)"
                  value={newProgramDesc}
                  onChange={(e) => setNewProgramDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={creating || !newProgramName.trim()}
                  className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  추가
                </button>
              </form>
            </div>

            {/* 프로그램 목록 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800">프로그램 목록 ({programs.length}개)</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {programs.length === 0 ? (
                  <p className="px-6 py-8 text-gray-400 text-sm text-center">등록된 프로그램이 없습니다</p>
                ) : (
                  programs.map((p) => (
                    <div key={p.id} className="px-6 py-4 flex items-center gap-3">
                      <ProgramIcon websiteUrl={p.website_url} name={p.name} size={32} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {p.account_id || '계정 미설정'}{p.description ? ` · ${p.description}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleProgram(p)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                          p.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {p.is_active ? '활성' : '비활성'}
                      </button>
                      <button
                        onClick={() => deleteProgram(p.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">최근 사용 내역 (50건)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">프로그램</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">사용자</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">시작</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">종료</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">상태</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sessions.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">내역이 없습니다</td></tr>
                  ) : (
                    sessions.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-800">{s.programs?.name}</td>
                        <td className="px-6 py-3 text-gray-600">{s.user_name}</td>
                        <td className="px-6 py-3 text-gray-500">{formatDateTime(s.start_time)}</td>
                        <td className="px-6 py-3 text-gray-500">{formatDateTime(s.end_time)}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge[s.status]}`}>
                            {statusLabel[s.status]}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          {(s.status === 'active' || s.status === 'reserved') && (
                            <button
                              onClick={() => cancelSession(s.id)}
                              className="text-xs text-red-500 hover:text-red-700 font-medium"
                            >
                              취소
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
