import ActiveSessions from '@/components/ActiveSessions'
import ImmediateApply from '@/components/ImmediateApply'
import ReservationApply from '@/components/ReservationApply'
import { AuroraBackground } from '@/components/ui/aurora-background'
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
        {/* 히어로 */}
        <AuroraBackground className="h-auto min-h-0 rounded-lg border border-gray-200 py-10 px-6">
          <div className="text-center space-y-2 relative z-10">
            <p className="text-xl font-bold text-black tracking-tight">
              지금 바로 공용 AI 툴을 신청하고 사용해보세요.
            </p>
            <p className="text-sm text-gray-500">
              사용 신청하면 공용 ID와 PW를 알려드립니다.
            </p>
          </div>
        </AuroraBackground>

        <ActiveSessions />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImmediateApply />
          <ReservationApply />
        </div>
      </main>
    </div>
  )
}
