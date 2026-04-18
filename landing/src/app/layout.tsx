import type { Metadata } from 'next'
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google'
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
  title: 'FlowMonix — n8n Workflow Monitoring',
  description:
    'FlowMonix monitors your n8n workflows, groups failures into incidents, and explains errors with AI — so you can fix issues in seconds, not hours.',
  metadataBase: new URL('https://flowmonix.com'),
  openGraph: {
    title: 'FlowMonix — n8n Workflow Monitoring',
    description: 'Know exactly what broke in your automations — instantly.',
    type: 'website',
    siteName: 'FlowMonix',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlowMonix — n8n Workflow Monitoring',
    description: 'Know exactly what broke in your automations — instantly.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
