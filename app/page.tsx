import ActiveSessions from '@/components/ActiveSessions'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-base font-bold text-black">AI 공유계정 관리</h1>
          <Link href="/admin" className="text-sm text-gray-400 hover:text-black transition-colors">
            관리자
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* 히어로 */}
        <div
          className="rounded-2xl px-6 py-6 border border-gray-100"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 50%, #ebebeb 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <p className="text-base font-semibold text-gray-800 leading-snug">
            프로그램 카드를 눌러<br />바로 사용하거나 예약할 수 있습니다.
          </p>
        </div>

        <ActiveSessions />
      </main>
    </div>
  )
}
