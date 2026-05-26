'use client'

import { Loader2 } from 'lucide-react'

type Props = {
  size?: number
  className?: string
}

export default function Spinner({ size = 14, className }: Props) {
  return <Loader2 className={`animate-spin ${className ?? ''}`} style={{ width: size, height: size }} aria-label="로딩 중" />
}
