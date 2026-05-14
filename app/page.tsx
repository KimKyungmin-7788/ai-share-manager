import ActiveSessions from '@/components/ActiveSessions'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-base shrink-0">
              🤖
            </div>
            <h1 className="text-sm font-bold text-black leading-tight">공용 AI 프로그램<br />사용 신청</h1>
          </div>
          <Link href="/admin" className="text-sm text-gray-400 hover:text-black transition-colors">
            관리자
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* 히어로 */}
        <div
          className="rounded-2xl px-6 py-5 border border-gray-200 border-l-[4px] border-l-gray-800"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 50%, #ebebeb 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <p className="text-base font-semibold text-gray-800">카드를 선택해주세요.</p>
        </div>

        <ActiveSessions />
      </main>
    </div>
  )
}
