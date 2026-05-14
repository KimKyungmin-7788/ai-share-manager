'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Check } from 'lucide-react'

type Props = {
  onClose: () => void
}

export default function RequestProgramModal({ onClose }: Props) {
  const [programName, setProgramName] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  function close() {
    setIsClosing(true)
    setTimeout(() => onClose(), 250)
  }

  async function handleSubmit() {
    if (!programName.trim() || !content.trim()) return
    setSubmitting(true)
    await supabase.from('program_requests').insert({
      program_name: programName.trim(),
      content: content.trim(),
    })
    setSubmitting(false)
    setDone(true)
  }

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-end justify-center z-50 ${isClosing ? 'modal-backdrop-out' : 'modal-backdrop-in'}`}
      onClick={close}
    >
      <div
        className={`bg-white rounded-t-3xl w-full max-w-lg ${isClosing ? 'modal-sheet-out' : 'modal-sheet-in'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 py-3 flex items-start justify-between">
          <div>
            <p className="text-lg font-bold text-black">AI 프로그램 신청</p>
            <p className="text-sm text-gray-500 mt-0.5">원하는 AI 프로그램을 신청해주세요</p>
          </div>
          <button onClick={close} className="p-2 hover:bg-gray-100 rounded-xl transition-colors mt-0.5">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-5 pb-10 space-y-4">
          {!done ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">프로그램 이름</label>
                <input
                  type="text"
                  placeholder="예: Midjourney, Perplexity, Notion AI..."
                  value={programName}
                  onChange={e => setProgramName(e.target.value)}
                  maxLength={50}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base focus:outline-none focus:border-black transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">신청 내용</label>
                <textarea
                  placeholder="어떤 용도로 사용하실 건지 간단히 적어주세요."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  maxLength={200}
                  rows={4}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base focus:outline-none focus:border-black transition-colors resize-none"
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || !programName.trim() || !content.trim()}
                className="w-full py-4 bg-black hover:bg-gray-800 active:bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 text-white text-base font-bold rounded-2xl transition-colors"
              >
                {submitting ? '신청 중...' : '요청하기'}
              </button>
            </>
          ) : (
            <div className="py-6 text-center space-y-4">
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-black">신청 완료!</p>
                <p className="text-sm text-gray-500 mt-1">관리자에게 알림이 전달되었습니다.</p>
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
