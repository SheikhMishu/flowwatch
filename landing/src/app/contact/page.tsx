import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FlowMonixMark } from '@/components/brand-mark'
import ContactForm from '@/components/contact-form'
import Footer from '@/components/footer'

export const metadata: Metadata = {
  title: 'Contact — FlowMonix',
  description: 'Get in touch with the FlowMonix team for support, billing, or general questions.',
}

export default function ContactPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Top accent line */}
      <div className="h-[3px] bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-600" />

      {/* Nav */}
      <nav className="flex items-center justify-between max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <FlowMonixMark className="w-5 h-5" />
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight">
            <span className="text-zinc-900">Flow</span>
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>monix</span>
          </span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors duration-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </Link>
      </nav>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center py-16 px-4">
        <div className="w-full max-w-xl">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-4">Get in touch</p>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-zinc-900 mb-3">
              Contact us
            </h1>
            <p className="text-zinc-500 text-base">
              Have a question or need help? We&apos;ll get back to you within one business day.
            </p>
          </div>
          <ContactForm />
        </div>
      </div>

      <Footer />
    </main>
  )
}
