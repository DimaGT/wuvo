import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { code } = await request.json()

    await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.WHOOP_CLIENT_ID,
        client_secret: process.env.WHOOP_CLIENT_SECRET,
        redirect_uri:
          process.env.FRONTEND_URL ||
          process.env.NEXT_PUBLIC_FRONTEND_URL ||
          'http://localhost:3000/integrations',
      }),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

