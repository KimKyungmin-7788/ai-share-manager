export type Program = {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

export type SessionStatus = 'active' | 'reserved' | 'completed' | 'cancelled'

export type Session = {
  id: string
  program_id: string
  user_name: string
  start_time: string
  end_time: string
  status: SessionStatus
  created_at: string
  programs?: Program
}
