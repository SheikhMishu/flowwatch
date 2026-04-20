'use client'

import { useEffect, useRef, ReactNode } from 'react'

export type AnimVariant = 'fade-up' | 'fade-in' | 'scale-up' | 'stagger-children'

interface Props {
  children: ReactNode
  className?: string
  /** Extra delay in ms before triggering (on top of IntersectionObserver firing) */
  delay?: number
  animation?: AnimVariant
  /** 0–1 fraction of element visible before triggering */
  threshold?: number
}

export function AnimateOnScroll({
  children,
  className = '',
  delay = 0,
  animation = 'fade-up',
  threshold = 0.12,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const show = () => { el.dataset.visible = 'true' }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          delay > 0 ? setTimeout(show, delay) : show()
          observer.unobserve(el)
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay, threshold])

  return (
    <div ref={ref} className={`anim-${animation} ${className}`} data-visible="false">
      {children}
    </div>
  )
}
