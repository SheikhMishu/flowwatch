import type { Metadata } from 'next'
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FlowMonix — n8n Workflow Monitoring & Incident Detection',
  description:
    'FlowMonix monitors your n8n workflows in real time, groups failures into incidents, and explains errors with AI — so you can find and fix issues in seconds, not hours. Built for agencies and freelancers.',
  metadataBase: new URL('https://flowmonix.com'),
  openGraph: {
    title: 'FlowMonix — n8n Workflow Monitoring & Incident Detection',
    description:
      'Monitor every n8n workflow in real time. Group failures into incidents, get AI-powered root cause analysis, and retry executions in one click — without ever opening n8n.',
    type: 'website',
    siteName: 'FlowMonix',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlowMonix — n8n Workflow Monitoring & Incident Detection',
    description:
      'Monitor every n8n workflow in real time. Group failures into incidents, get AI-powered root cause analysis, and retry executions in one click — without ever opening n8n.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${dmSans.variable}`}>
      <body>
        {children}
        <Script
          defer
          data-domain="flowmonix.com"
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
