import ActiveSessions from '@/components/ActiveSessions'
import ImmediateApply from '@/components/ImmediateApply'
import ReservationApply from '@/components/ReservationApply'
import Link from 'next/link'
import { Bot, Settings } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-800">AI 공유계정 관리</h1>
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
            관리자
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1">
            <ActiveSessions />
          </div>
          <div className="lg:col-span-1">
            <ImmediateApply />
          </div>
          <div className="lg:col-span-1">
            <ReservationApply />
          </div>
        </div>
      </main>
    </div>
  )
}
