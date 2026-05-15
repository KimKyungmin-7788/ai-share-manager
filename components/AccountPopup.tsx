'use client'

import { X, Copy, Check, AlertTriangle, ExternalLink, BookmarkCheck, StopCircle } from 'lucide-react'
import { useState } from 'react'

type Props = {
  accountId: string
  accountPw: string
  programName: string
  websiteUrl?: string | null
  isReservation?: boolean
  onClose: () => void
}

export default function AccountPopup({ accountId, accountPw, programName, websiteUrl, isReservation, onClose }: Props) {
  const [copiedId, setCopiedId] = useState(false)
  const [copiedPw, setCopiedPw] = useState(false)

  async function copy(text: string, type: 'id' | 'pw') {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    if (type === 'id') { setCopiedId(true); setTimeout(() => setCopiedId(false), 2000) }
    else { setCopiedPw(true); setTimeout(() => setCopiedPw(false), 2000) }
  }

  const href = websiteUrl
    ? websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`
    : null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* 헤더 */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">공유 계정 안내</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-black">{programName}</span> 공유 계정으로 구글 로그인 후 이용해주세요.
          </p>

          {/* 예약 시 기록 강조 배너 */}
          {isReservation && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex gap-2">
              <BookmarkCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed font-medium">
                예약 시간에 접속할 때 필요합니다.<br />
                <span className="font-bold">반드시 지금 기록해두세요!</span>
              </p>
            </div>
          )}

          {/* ID / PW 카드 */}
          <div className="rounded-2xl border-2 border-black bg-gray-50 overflow-hidden">
            <div className="bg-black px-4 py-2 flex items-center gap-1.5">
              <Copy className="w-3.5 h-3.5 text-white" />
              <p className="text-xs font-bold text-white tracking-wide">지금 바로 복사하세요!</p>
            </div>

            <div className="px-4 pt-4 pb-3 space-y-4">
              {/* ID */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">ID</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xl font-bold text-black font-mono tracking-tight break-all leading-tight">
                    {accountId}
                  </p>
                  <button
                    onClick={() => copy(accountId, 'id')}
                    className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      copiedId ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId ? '복사됨' : '복사'}
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200" />

              {/* PW */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">PW</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xl font-bold text-black font-mono tracking-tight break-all leading-tight">
                    {accountPw}
                  </p>
                  <button
                    onClick={() => copy(accountPw, 'pw')}
                    className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      copiedPw ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    {copiedPw ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedPw ? '복사됨' : '복사'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 조기 종료 안내 — 즉시 사용 시만 */}
          {!isReservation && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex gap-2">
              <StopCircle className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600 leading-relaxed">
                작업이 일찍 끝나면 <span className="font-bold text-black">카드를 눌러 종료</span>해주세요.<br />
                다음 사람이 바로 사용할 수 있습니다.
              </p>
            </div>
          )}

          {/* 주의사항 */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              작업 후 개인정보가 포함된 자료를 검토하고 삭제해주세요.<br />
              반드시 <span className="font-bold">로그아웃</span> 후 자리를 비워주시기 바랍니다.
            </p>
          </div>

          {/* 사이트 바로가기 */}
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-gray-800 hover:bg-black active:scale-[0.98] text-white text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              해당 사이트로 바로 가기
            </a>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-2xl transition-colors"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  )
}
