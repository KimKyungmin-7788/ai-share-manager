import ActiveSessions from '@/components/ActiveSessions'
import ImmediateApply from '@/components/ImmediateApply'
import ReservationApply from '@/components/ReservationApply'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 sticky top-0 z-10 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <h1 className="text-base font-semibold text-black">AI 공유계정 관리</h1>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-black transition-colors">
            관리자
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <ActiveSessions />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImmediateApply />
          <ReservationApply />
        </div>
      </main>
    </div>
  )
}
