import ActiveSessions from '@/components/ActiveSessions'
import NotificationBell from '@/components/NotificationBell'
import { AnimatedText } from '@/components/ui/animated-text'
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
            <h1 className="text-base font-bold text-black">공용 AI 사용 신청</h1>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Link href="/admin" className="text-sm text-gray-400 hover:text-black transition-colors px-2 py-2">
              관리자
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 pb-10 space-y-5">
        {/* 히어로 */}
        <div className="px-1 py-2">
          <AnimatedText
            text="원하는 AI 카드를 눌러주세요."
            duration={0.04}
            delay={0.06}
            textClassName="text-lg text-gray-800"
            underlineGradient="from-red-500 via-orange-400 to-yellow-400"
            underlineHeight="h-[2px]"
            underlineOffset="-bottom-1.5"
          />
        </div>

        <ActiveSessions />
      </main>
    </div>
  )
}
