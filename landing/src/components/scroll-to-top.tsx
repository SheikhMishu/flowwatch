'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      className={`fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-white border border-zinc-200 shadow-md flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 hover:shadow-lg hover:-translate-y-[2px] active:scale-[0.92] transition-[transform,opacity,box-shadow] duration-200 ${
        visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  )
}
