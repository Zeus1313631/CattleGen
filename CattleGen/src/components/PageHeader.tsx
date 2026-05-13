import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  right?: ReactNode
}

export default function PageHeader({ title, subtitle, right }: Props) {
  return (
    <div className="border-b border-ranch-200 bg-white/60 backdrop-blur-sm sticky top-0 z-10">
      <div className="px-8 py-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ranch-950">{title}</h1>
          {subtitle && (
            <p className="text-sm text-ranch-600 mt-1">{subtitle}</p>
          )}
        </div>
        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>
    </div>
  )
}
