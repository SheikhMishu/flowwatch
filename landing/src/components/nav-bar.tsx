'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { FlowMonixMark } from './brand-mark'

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,box-shadow] duration-200 ${
        scrolled
          ? 'bg-white/85 backdrop-blur-md border-b border-zinc-200/70 shadow-sm'
          : ''
      }`}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <FlowMonixMark className="w-5 h-5" />
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight">
            <span className="text-zinc-900">Flow</span>
            <span
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              monix
            </span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="/blog"
            className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors duration-200"
          >
            Blog
          </a>
          <a
            href="#signup"
            className="flex items-center gap-1.5 text-sm text-zinc-800 hover:text-zinc-900 transition-colors duration-200"
          >
            Get Started Free <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </nav>
  )
}
