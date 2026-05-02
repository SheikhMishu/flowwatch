'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'

const SUBJECTS = [
  'General inquiry',
  'Technical support',
  'Billing / subscription',
  'Feature request',
  'Bug report',
  'Other',
]

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email || !subject || !message) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setStatus('loading')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }
      setStatus('success')
    } catch {
      setError('Network error — please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="glass-card rounded-2xl p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        </div>
        <h3 className="font-display font-bold text-zinc-900 text-2xl mb-2">Message sent!</h3>
        <p className="text-zinc-500 text-sm leading-relaxed mb-6">
          Thanks for reaching out. We&apos;ll get back to you at <span className="font-medium text-zinc-700">{email}</span> within one business day.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl border border-zinc-200 text-zinc-600 text-sm font-medium hover:border-zinc-300 hover:text-zinc-800 transition-all duration-200"
        >
          Back to home
        </a>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">
              Your name
            </label>
            <input
              type="text"
              required
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">
            Subject
          </label>
          <select
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 appearance-none cursor-pointer"
          >
            <option value="" disabled className="bg-white">Select a topic...</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s} className="bg-white">{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">
            Message
          </label>
          <textarea
            required
            rows={5}
            placeholder="Tell us how we can help..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 resize-none"
          />
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm hover:opacity-90 hover:scale-[1.01] active:scale-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-indigo-300/50 mt-2"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              Send message
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
