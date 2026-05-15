'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell } from 'lucide-react'
import Link from 'next/link'

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)

  async function fetchUnread() {
    const { count } = await supabase
      .from('program_requests')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
    setUnreadCount(count || 0)
  }

  useEffect(() => {
    fetchUnread()
    const channel = supabase
      .channel('bell-v1')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'program_requests' }, fetchUnread)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <Link href="/admin" className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
      <Bell className={`w-5 h-5 transition-colors ${unreadCount > 0 ? 'text-gray-800' : 'text-gray-400'}`} />
      {unreadCount > 0 && (
        <>
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full opacity-40 animate-ping" />
        </>
      )}
    </Link>
  )
}
