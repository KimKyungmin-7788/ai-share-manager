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
            <h1 className="text-sm font-bold text-black">공용 AI 사용 신청</h1>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Link href="/admin" className="text-sm text-gray-400 hover:text-black transition-colors px-2 py-2">
              관리자
            </Link>
          </div>
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
          <AnimatedText
            text="원하는 AI 카드를 눌러주세요."
            duration={0.04}
            delay={0.06}
            textClassName="text-base text-gray-800"
            underlineGradient="from-gray-400 via-gray-500 to-gray-600"
            underlineHeight="h-[2px]"
            underlineOffset="-bottom-1.5"
          />
        </div>

        <ActiveSessions />
      </main>
    </div>
  )
}
