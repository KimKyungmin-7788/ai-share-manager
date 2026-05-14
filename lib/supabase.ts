import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bxbzbqqogniuajmutkjo.supabase.co'
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4YnpicXFvZ25pdWFqbXV0a2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDQ2NjIsImV4cCI6MjA5MTc4MDY2Mn0.27FNMQcyLJohXK1V6cmKUx36yS10FihpzniSOvMzANM'

export const supabase = createClient(url, key)
