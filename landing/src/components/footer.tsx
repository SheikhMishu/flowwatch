import { FlowMonixMark } from './brand-mark'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-300/40">
              <FlowMonixMark className="w-4 h-4" />
            </div>
            <span className="font-display font-extrabold tracking-tight">
              <span className="text-zinc-700">Flow</span>
              <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>monix</span>
            </span>
            <span className="hidden sm:block text-zinc-400 text-xs font-medium">· n8n observability</span>
          </div>

          {/* Support email */}
          <a
            href="mailto:support@flowmonix.com"
            className="text-zinc-400 hover:text-zinc-700 text-xs transition-colors duration-200"
          >
            support@flowmonix.com
          </a>

          {/* Copyright */}
          <p className="text-zinc-400 text-xs">
            © {year} FlowMonix. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
