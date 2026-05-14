'use client'

import { useState } from 'react'
import { Bot } from 'lucide-react'

type Props = {
  websiteUrl: string | null
  name: string
  size?: number
}

function getDomain(url: string | null) {
  if (!url) return null
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return u.hostname
  } catch {
    return null
  }
}

export default function ProgramIcon({ websiteUrl, name, size = 24 }: Props) {
  const [error, setError] = useState(false)
  const domain = getDomain(websiteUrl)

  if (!domain || error) {
    return (
      <div
        className="rounded-lg bg-gray-100 flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <Bot className="text-gray-400" style={{ width: size * 0.6, height: size * 0.6 }} />
      </div>
    )
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt={name}
      width={size}
      height={size}
      className="rounded-lg shrink-0 object-contain"
      onError={() => setError(true)}
    />
  )
}
