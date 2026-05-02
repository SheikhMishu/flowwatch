import { NextRequest, NextResponse } from 'next/server'
import { sendContactNotification } from '@/lib/email'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const name: string = (body.name ?? '').trim()
  const email: string = (body.email ?? '').trim().toLowerCase()
  const subject: string = (body.subject ?? '').trim()
  const message: string = (body.message ?? '').trim()

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: 'Message is too long.' }, { status: 400 })
  }

  try {
    await sendContactNotification({ senderName: name, senderEmail: email, subject, message })
  } catch (err) {
    console.error('Contact email failed', err)
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
