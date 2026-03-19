import { NextResponse } from 'next/server'
const { log } = require('../../../server/llm')

export async function POST(request) {
  try {
    const { userId, userEmail, npName, consultationType, slot, notes, bookingRef } =
      await request.json()

    log('info', 'book-consultation', 'created', { bookingRef, userId, npName, slot })

    return NextResponse.json({
      success: true,
      bookingRef,
      meetingUrl: 'https://meet.zoom.us/placeholder',
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

