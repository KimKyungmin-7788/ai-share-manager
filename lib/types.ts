export type Program = {
  id: string
  name: string
  description: string | null
  is_active: boolean
  website_url: string | null
  account_id: string | null
  account_pw: string | null
  created_at: string
}

export type ProgramRequest = {
  id: string
  program_name: string
  content: string
  is_read: boolean
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
