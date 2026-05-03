import type { Metadata } from 'next'
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'FlowMonix',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web-based',
  url: 'https://flowmonix.com',
  description:
    'FlowMonix monitors your n8n workflows in real time, groups failures into incidents, and explains errors with AI.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

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
    'FlowMonix monitors your n8n workflows in real time, groups failures into incidents, and explains errors with AI. Fix issues in seconds, not hours.',
  metadataBase: new URL('https://flowmonix.com'),
  alternates: {
    canonical: 'https://flowmonix.com',
  },
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
      <head />
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Script id="fb-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','942346332108194');fbq('track','PageView');` }} />
        <Script id="ms-clarity" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","wkmrzvenzm");` }} />
        <Script id="ga4-loader" strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=G-MXFDSFWL1X" />
        <Script id="ga4-config" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-MXFDSFWL1X');` }} />
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
