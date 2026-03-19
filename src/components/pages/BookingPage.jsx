'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  User,
  Loader2,
  Star,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { bookConsultation } from '@/api/booking'
import './BookingPage.css'

const CONSULTATION_TYPES = [
  {
    id: 'initial',
    name: 'Initial Consultation',
    duration: '45 min',
    description: 'First visit — full health history review, lab review, protocol planning',
    price: 'Included in all plans',
    icon: '🩺',
    available: ['basic', 'pro', 'elite', 'free'],
  },
  {
    id: 'hormone_review',
    name: 'Hormone Review',
    duration: '30 min',
    description: 'Review your recent labs and discuss any health concerns with your NP',
    price: 'Included in all plans',
    icon: '⚗️',
    available: ['basic', 'pro', 'elite'],
  },
  {
    id: 'followup',
    name: 'Follow-Up Visit',
    duration: '20 min',
    description: 'Quick check-in on how your protocol is working, side effects, adjustments',
    price: 'Included in Pro & Elite',
    icon: '📋',
    available: ['pro', 'elite'],
  },
  {
    id: 'results_review',
    name: 'Lab Results Review',
    duration: '30 min',
    description: 'Deep dive into your latest bloodwork with your NP, full interpretation',
    price: 'Included in Pro & Elite',
    icon: '🔬',
    available: ['pro', 'elite'],
  },
]

const NPS = [
  {
    id: 'np1',
    name: 'Dr. Sarah Mitchell, NP',
    specialty: 'Preventive Health & Wellness',
    rating: 4.9,
    reviews: 127,
    avatar: '👩‍⚕️',
  },
  {
    id: 'np2',
    name: 'Dr. James Torres, NP',
    specialty: 'Sports Medicine & Recovery',
    rating: 4.8,
    reviews: 94,
    avatar: '👨‍⚕️',
  },
  {
    id: 'np3',
    name: 'Dr. Lisa Chen, NP',
    specialty: 'Longevity & Preventive Health',
    rating: 5.0,
    reviews: 63,
    avatar: '👩‍⚕️',
  },
]

function getAvailableDays() {
  const days = []
  let d = new Date()
  d.setDate(d.getDate() + 2)
  while (days.length < 14) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) {
      days.push(new Date(d))
    }
    d.setDate(d.getDate() + 1)
  }
  return days
}

const TIME_SLOTS = [
  '8:00 AM',
  '8:30 AM',
  '9:00 AM',
  '9:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '1:00 PM',
  '1:30 PM',
  '2:00 PM',
  '2:30 PM',
  '3:00 PM',
  '3:30 PM',
  '4:00 PM',
  '4:30 PM',
]

const TAKEN_SLOTS = ['9:00 AM', '10:30 AM', '2:00 PM']

const DAYS = getAvailableDays()

export function BookingPage() {
  const router = useRouter()
  const { user, profile } = useStore()

  const [step, setStep] = useState(1) // 1=type, 2=np, 3=datetime, 4=confirm, 5=success
  const [selectedType, setSelectedType] = useState(null)
  const [selectedNP, setSelectedNP] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [dayOffset, setDayOffset] = useState(0)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [bookingRef, setBookingRef] = useState('')

  const userPlan = profile?.subscription || 'free'
  const visibleDays = DAYS.slice(dayOffset, dayOffset + 5)

  const handleBook = async () => {
    setLoading(true)
    try {
      const ref = `AP-${Date.now().toString(36).toUpperCase()}`
      const scheduledAt = new Date(`${selectedDay.toDateString()} ${selectedTime}`)

      if (user) {
        await supabase.from('consultations').insert({
          user_id: user.id,
          np_name: selectedNP.name,
          consultation_type: selectedType.id,
          scheduled_at: scheduledAt.toISOString(),
          duration_min: parseInt(selectedType.duration, 10),
          status: 'scheduled',
          notes,
        })
      }

      await bookConsultation({
        userId: user?.id,
        userEmail: user?.email,
        npName: selectedNP.name,
        consultationType: selectedType.name,
        slot: scheduledAt.toISOString(),
        notes,
        bookingRef: ref,
      }).catch(() => {})

      setBookingRef(ref)
      setStep(5)
    } catch (err) {
      console.error(err)
      alert('Booking failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDay = (d) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return { dow: days[d.getDay()], date: d.getDate(), month: months[d.getMonth()] }
  }

  return (
    <div className="booking-page">
      <div className="bg-grid" />
      <header className="booking-header">
        <button
          className="back-btn"
          onClick={() =>
            step > 1 && step < 5 ? setStep(s => s - 1) : router.push('/dashboard')
          }
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="booking-title">Book Consultation</h1>
          <p className="booking-sub">Licensed Nurse Practitioners</p>
        </div>
        {step < 5 && (
          <div className="booking-steps">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`step-dot ${step >= s ? 'active' : ''}`} />
            ))}
          </div>
        )}
      </header>

      <div className="booking-body">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <p className="step-label">Step 1 of 4 — Choose Type</p>
            <h2 className="step-title">What kind of visit do you need?</h2>
            <div className="type-list">
              {CONSULTATION_TYPES.map(type => {
                const locked = !type.available.includes(userPlan)
                return (
                  <button
                    key={type.id}
                    className={`type-card ${selectedType?.id === type.id ? 'selected' : ''} ${locked ? 'locked' : ''}`}
                    onClick={() => !locked && setSelectedType(type)}
                  >
                    <span className="type-icon">{type.icon}</span>
                    <div className="type-body">
                      <div className="type-row">
                        <span className="type-name">{type.name}</span>
                        <span className="type-duration">
                          <Clock size={12} />
                          {type.duration}
                        </span>
                      </div>
                      <p className="type-desc">{type.description}</p>
                      <p className="type-price">{locked ? '🔒 Upgrade to Pro or Elite' : type.price}</p>
                    </div>
                    {selectedType?.id === type.id && <CheckCircle2 size={18} className="type-check" />}
                  </button>
                )
              })}
            </div>
            <button className="next-btn" disabled={!selectedType} onClick={() => setStep(2)}>
              Continue <ChevronRight size={16} />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <p className="step-label">Step 2 of 4 — Choose Provider</p>
            <h2 className="step-title">Select your Nurse Practitioner</h2>
            <div className="np-list">
              {NPS.map(np => (
                <button
                  key={np.id}
                  className={`np-card ${selectedNP?.id === np.id ? 'selected' : ''}`}
                  onClick={() => setSelectedNP(np)}
                >
                  <div className="np-avatar">{np.avatar}</div>
                  <div className="np-body">
                    <p className="np-name">{np.name}</p>
                    <p className="np-specialty">{np.specialty}</p>
                    <div className="np-rating">
                      <Star size={12} fill="var(--gold)" color="var(--gold)" />
                      <span>{np.rating}</span>
                      <span className="np-reviews">({np.reviews} reviews)</span>
                    </div>
                  </div>
                  {selectedNP?.id === np.id && <CheckCircle2 size={18} className="type-check" />}
                </button>
              ))}
            </div>
            <button className="next-btn" disabled={!selectedNP} onClick={() => setStep(3)}>
              Continue <ChevronRight size={16} />
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <p className="step-label">Step 3 of 4 — Pick Date & Time</p>
            <h2 className="step-title">When works for you?</h2>

            <div className="day-picker">
              <button
                className="day-nav"
                onClick={() => setDayOffset(Math.max(0, dayOffset - 5))}
                disabled={dayOffset === 0}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="day-grid">
                {visibleDays.map((d, i) => {
                  const { dow, date, month } = formatDay(d)
                  const isSelected = selectedDay?.toDateString() === d.toDateString()
                  return (
                    <button
                      key={i}
                      className={`day-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedDay(d)
                        setSelectedTime(null)
                      }}
                    >
                      <span className="day-dow">{dow}</span>
                      <span className="day-date">{date}</span>
                      <span className="day-month">{month}</span>
                    </button>
                  )
                })}
              </div>
              <button
                className="day-nav"
                onClick={() => setDayOffset(Math.min(DAYS.length - 5, dayOffset + 5))}
                disabled={dayOffset >= DAYS.length - 5}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {selectedDay && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <p className="time-label">
                  Available times — {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <div className="time-grid">
                  {TIME_SLOTS.map(slot => {
                    const taken = TAKEN_SLOTS.includes(slot)
                    const isSelected = selectedTime === slot
                    return (
                      <button
                        key={slot}
                        className={`time-btn ${isSelected ? 'selected' : ''} ${taken ? 'taken' : ''}`}
                        onClick={() => !taken && setSelectedTime(slot)}
                        disabled={taken}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            <div className="timezone-note">
              <Clock size={12} /> All times shown in your local timezone
            </div>

            <button className="next-btn" disabled={!selectedDay || !selectedTime} onClick={() => setStep(4)}>
              Continue <ChevronRight size={16} />
            </button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <p className="step-label">Step 4 of 4 — Confirm</p>
            <h2 className="step-title">Review your appointment</h2>

            <div className="confirm-card">
              <div className="confirm-row">
                <span className="confirm-label">Type</span>
                <span className="confirm-val">
                  {selectedType?.icon} {selectedType?.name}
                </span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Provider</span>
                <span className="confirm-val">
                  {selectedNP?.avatar} {selectedNP?.name}
                </span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Date</span>
                <span className="confirm-val">
                  <Calendar size={14} />
                  {selectedDay?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Time</span>
                <span className="confirm-val">
                  <Clock size={14} />
                  {selectedTime}
                </span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Duration</span>
                <span className="confirm-val">{selectedType?.duration}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Format</span>
                <span className="confirm-val">
                  <Video size={14} /> Video Call (link sent by email)
                </span>
              </div>
            </div>

            <div className="notes-field">
              <label className="form-label">Notes for your NP (optional)</label>
              <textarea
                className="notes-input"
                placeholder="e.g. Latest labs attached, concerned about energy levels, recent concerns, health goals, or questions for your NP..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            <button className="next-btn" onClick={handleBook} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" /> Booking...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Confirm Booking
                </>
              )}
            </button>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div className="success-screen" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="success-icon">✅</div>
            <h2 className="success-title">Appointment Confirmed!</h2>
            <p className="success-ref">Ref: {bookingRef}</p>
            <p className="success-desc">
              Your {selectedType?.name} with {selectedNP?.name} is confirmed for{' '}
              {selectedDay?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {selectedTime}.
            </p>
            <div className="success-details">
              <div className="success-row">
                <Video size={16} />
                <span>Video call link will be sent to {user?.email || 'your email'} 24 hours before</span>
              </div>
              <div className="success-row">
                <Calendar size={16} />
                <span>Calendar invite sent automatically</span>
              </div>
              <div className="success-row">
                <User size={16} />
                <span>Your NP will review your assessment results before the call</span>
              </div>
            </div>
            <button className="next-btn" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
