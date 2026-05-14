'use client'

import { X, Copy, Check, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

type Props = {
  accountId: string
  accountPw: string
  programName: string
  onClose: () => void
}

export default function AccountPopup({ accountId, accountPw, programName, onClose }: Props) {
  const [copiedId, setCopiedId] = useState(false)
  const [copiedPw, setCopiedPw] = useState(false)

  function copy(text: string, type: 'id' | 'pw') {
    navigator.clipboard.writeText(text)
    if (type === 'id') { setCopiedId(true); setTimeout(() => setCopiedId(false), 2000) }
    else { setCopiedPw(true); setTimeout(() => setCopiedPw(false), 2000) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">공유 계정 안내</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-blue-600">{programName}</span> 공유 계정으로 구글 로그인 후 이용해주세요.
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-medium mb-0.5">ID</p>
                <p className="text-sm font-semibold text-gray-800 truncate">{accountId}</p>
              </div>
              <button
                onClick={() => copy(accountId, 'id')}
                className="shrink-0 p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {copiedId ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
              </button>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-medium mb-0.5">PW</p>
                <p className="text-sm font-semibold text-gray-800">{accountPw}</p>
              </div>
              <button
                onClick={() => copy(accountPw, 'pw')}
                className="shrink-0 p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {copiedPw ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              작업 후 개인정보가 포함된 자료를 검토하고 삭제해주세요.<br />
              반드시 <span className="font-semibold">로그아웃</span> 후 자리를 비워주시기 바랍니다.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  )
}
