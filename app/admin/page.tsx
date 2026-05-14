'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Program, Session } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { Pencil, Trash2, ArrowLeft, Eye, EyeOff, Check, X, Bell } from 'lucide-react'
import ProgramIcon from '@/components/ProgramIcon'
import { ProgramRequest } from '@/lib/types'

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin1234'

type EditState = {
  name: string
  description: string
  category: string
  website_url: string
  account_id: string
  account_pw: string
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwError, setPwError] = useState(false)

  const [programs, setPrograms] = useState<Program[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [newProgramName, setNewProgramName] = useState('')
  const [newProgramDesc, setNewProgramDesc] = useState('')
  const [newProgramCategory, setNewProgramCategory] = useState('')
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('')
  const [newAccountId, setNewAccountId] = useState('')
  const [newAccountPw, setNewAccountPw] = useState('')
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<'programs' | 'history' | 'notifications'>('programs')
  const [requests, setRequests] = useState<ProgramRequest[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ name: '', description: '', category: '', website_url: '', account_id: '', account_pw: '' })
  const [saving, setSaving] = useState(false)

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) { setAuthenticated(true); setPwError(false) }
    else setPwError(true)
  }

  async function fetchData() {
    const [{ data: progs }, { data: sess }, { data: reqs }] = await Promise.all([
      supabase.from('programs').select('*').order('created_at', { ascending: false }),
      supabase.from('sessions').select('*, programs(name)').order('created_at', { ascending: false }).limit(50),
      supabase.from('program_requests').select('*').order('created_at', { ascending: false }),
    ])
    setPrograms(progs || [])
    setSessions(sess || [])
    setRequests(reqs || [])
    setUnreadCount((reqs || []).filter(r => !r.is_read).length)
  }

  async function markAllRead() {
    await supabase.from('program_requests').update({ is_read: true }).eq('is_read', false)
    fetchData()
  }

  async function deleteRequest(id: string) {
    await supabase.from('program_requests').delete().eq('id', id)
    fetchData()
  }

  useEffect(() => { if (authenticated) fetchData() }, [authenticated])

  async function createProgram(e: React.FormEvent) {
    e.preventDefault()
    if (!newProgramName.trim()) return
    setCreating(true)
    await supabase.from('programs').insert({
      name: newProgramName.trim(),
      description: newProgramDesc.trim() || null,
      category: newProgramCategory.trim() || null,
      website_url: newWebsiteUrl.trim() || null,
      account_id: newAccountId.trim() || null,
      account_pw: newAccountPw.trim() || null,
    })
    setNewProgramName(''); setNewProgramDesc(''); setNewProgramCategory(''); setNewWebsiteUrl(''); setNewAccountId(''); setNewAccountPw('')
    setCreating(false)
    fetchData()
  }

  function startEdit(p: Program) {
    setEditingId(p.id)
    setEditState({
      name: p.name,
      description: p.description || '',
      category: p.category || '',
      website_url: p.website_url || '',
      account_id: p.account_id || '',
      account_pw: p.account_pw || '',
    })
  }

  async function saveEdit(id: string) {
    if (!editState.name.trim()) return
    setSaving(true)
    await supabase.from('programs').update({
      name: editState.name.trim(),
      description: editState.description.trim() || null,
      category: editState.category.trim() || null,
      website_url: editState.website_url.trim() || null,
      account_id: editState.account_id.trim() || null,
      account_pw: editState.account_pw.trim() || null,
    }).eq('id', id)
    setSaving(false)
    setEditingId(null)
    fetchData()
  }

  async function toggleProgram(p: Program) {
    await supabase.from('programs').update({ is_active: !p.is_active }).eq('id', p.id)
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

  const statusLabel: Record<string, string> = { active: '사용 중', reserved: '예약됨', completed: '완료', cancelled: '취소' }
  const inputCls = 'px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-black'

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="border border-gray-200 rounded-lg p-8 w-full max-w-sm">
          <h1 className="text-base font-semibold text-black mb-5">관리자 로그인</h1>
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="비밀번호"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPwError(false) }}
                className={`w-full px-3 py-2 pr-9 border rounded text-sm focus:outline-none focus:border-black ${pwError ? 'border-red-400' : 'border-gray-200'}`}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pwError && <p className="text-red-500 text-xs">비밀번호가 올바르지 않습니다.</p>}
            <button type="submit" className="w-full py-2 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded transition-colors">
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
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 sticky top-0 z-10 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <h1 className="text-base font-semibold text-black">관리자 패널</h1>
          <Link href="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-black transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> 메인으로
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* 탭 */}
        <div className="flex gap-1 border-b border-gray-200">
          {(['programs', 'history', 'notifications'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); if (tab === 'notifications') markAllRead() }}
              className={`relative px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
            >
              {tab === 'programs' ? '프로그램 관리' : tab === 'history' ? '사용 내역' : (
                <span className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />
                  알림
                  {unreadCount > 0 && (
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'programs' && (
          <>
            {/* 프로그램 추가 */}
            <div className="border border-gray-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-black mb-3">프로그램 추가</h2>
              <form onSubmit={createProgram} className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input type="text" placeholder="프로그램 이름 *" value={newProgramName} onChange={(e) => setNewProgramName(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black" />
                  <input type="text" placeholder="웹사이트 URL (아이콘 자동)" value={newWebsiteUrl} onChange={(e) => setNewWebsiteUrl(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black" />
                  <input type="text" placeholder="카테고리 (쉼표로 구분: LLM, PPT, 음악)" value={newProgramCategory} onChange={(e) => setNewProgramCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black" />
                  <input type="text" placeholder="공유 계정 ID" value={newAccountId} onChange={(e) => setNewAccountId(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black" />
                  <input type="text" placeholder="공유 계정 PW" value={newAccountPw} onChange={(e) => setNewAccountPw(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black" />
                </div>
                <input type="text" placeholder="설명 (선택)" value={newProgramDesc} onChange={(e) => setNewProgramDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black" />
                <button type="submit" disabled={creating || !newProgramName.trim()}
                  className="px-5 py-2 bg-black hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded transition-colors">
                  추가
                </button>
              </form>
            </div>

            {/* 프로그램 목록 */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-black">프로그램 목록 ({programs.length}개)</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {programs.length === 0 ? (
                  <p className="px-5 py-8 text-gray-400 text-sm text-center">등록된 프로그램이 없습니다</p>
                ) : (
                  programs.map((p) => (
                    <div key={p.id}>
                      {editingId === p.id ? (
                        /* 수정 폼 */
                        <div className="px-5 py-4 space-y-2 bg-gray-50">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input value={editState.name} onChange={(e) => setEditState({ ...editState, name: e.target.value })} placeholder="프로그램 이름 *" className={inputCls} />
                            <input value={editState.website_url} onChange={(e) => setEditState({ ...editState, website_url: e.target.value })} placeholder="웹사이트 URL" className={inputCls} />
                            <input value={editState.category} onChange={(e) => setEditState({ ...editState, category: e.target.value })} placeholder="카테고리 (쉼표 구분: LLM, PPT)" className={inputCls} />
                            <input value={editState.account_id} onChange={(e) => setEditState({ ...editState, account_id: e.target.value })} placeholder="공유 계정 ID" className={inputCls} />
                            <input value={editState.account_pw} onChange={(e) => setEditState({ ...editState, account_pw: e.target.value })} placeholder="공유 계정 PW" className={inputCls} />
                          </div>
                          <input value={editState.description} onChange={(e) => setEditState({ ...editState, description: e.target.value })} placeholder="설명" className={`w-full ${inputCls}`} />
                          <div className="flex gap-2">
                            <button onClick={() => saveEdit(p.id)} disabled={saving || !editState.name.trim()}
                              className="flex items-center gap-1 px-4 py-1.5 bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white text-xs font-medium rounded transition-colors">
                              <Check className="w-3 h-3" /> 저장
                            </button>
                            <button onClick={() => setEditingId(null)}
                              className="flex items-center gap-1 px-4 py-1.5 border border-gray-300 text-gray-600 hover:bg-gray-100 text-xs font-medium rounded transition-colors">
                              <X className="w-3 h-3" /> 취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* 목록 행 */
                        <div className="px-5 py-3.5 flex items-center gap-3">
                          <ProgramIcon websiteUrl={p.website_url} name={p.name} size={28} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-black">{p.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              {p.account_id || '계정 미설정'}{p.description ? ` · ${p.description}` : ''}
                            </p>
                          </div>
                          <button onClick={() => toggleProgram(p)}
                            className={`text-xs px-2.5 py-1 rounded border transition-colors shrink-0 ${p.is_active ? 'border-gray-300 text-gray-700 hover:bg-gray-100' : 'border-gray-200 text-gray-400 hover:bg-gray-50'}`}>
                            {p.is_active ? '활성' : '비활성'}
                          </button>
                          <button onClick={() => startEdit(p)} className="p-1.5 text-gray-400 hover:text-black rounded transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteProgram(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'notifications' && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-black">AI 프로그램 신청 알림 ({requests.length}건)</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {requests.length === 0 ? (
                <p className="px-5 py-8 text-gray-400 text-sm text-center">신청 내역이 없습니다</p>
              ) : requests.map(r => (
                <div key={r.id} className={`px-5 py-4 flex items-start gap-3 ${r.is_read ? 'bg-white' : 'bg-blue-50'}`}>
                  {!r.is_read && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0 mt-1.5" />}
                  {r.is_read && <span className="w-2 h-2 shrink-0 mt-1.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black">{r.program_name}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{r.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleString('ko-KR')}</p>
                  </div>
                  <button onClick={() => deleteRequest(r.id)} className="p-1.5 text-gray-300 hover:text-red-500 rounded transition-colors shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-black">최근 사용 내역 (50건)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                    <th className="px-5 py-2.5 text-left font-medium">프로그램</th>
                    <th className="px-5 py-2.5 text-left font-medium">사용자</th>
                    <th className="px-5 py-2.5 text-left font-medium">시작</th>
                    <th className="px-5 py-2.5 text-left font-medium">종료</th>
                    <th className="px-5 py-2.5 text-left font-medium">상태</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sessions.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-sm">내역이 없습니다</td></tr>
                  ) : sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-5 py-2.5 font-medium text-black">{s.programs?.name}</td>
                      <td className="px-5 py-2.5 text-gray-600">{s.user_name}</td>
                      <td className="px-5 py-2.5 text-gray-500 tabular-nums">{formatDateTime(s.start_time)}</td>
                      <td className="px-5 py-2.5 text-gray-500 tabular-nums">{formatDateTime(s.end_time)}</td>
                      <td className="px-5 py-2.5">
                        <span className="text-xs text-gray-600">{statusLabel[s.status]}</span>
                      </td>
                      <td className="px-5 py-2.5">
                        {(s.status === 'active' || s.status === 'reserved') && (
                          <button onClick={() => cancelSession(s.id)} className="text-xs text-red-500 hover:text-red-700">취소</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
