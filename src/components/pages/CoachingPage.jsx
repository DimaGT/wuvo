'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  Send,
  Loader2,
  Zap,
  Moon,
  Activity,
  Sun,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { getDailyBrief, coachChat } from '@/api/coach'
import './CoachingPage.css'

const MORNING_PROMPTS = [
  'How should I train today given my recovery?',
  'What should I eat today to hit my goals?',
  'Adjust my protocol based on my recent progress',
  "I'm feeling low energy — what do I do?",
  'Give me my full daily game plan',
]

export function CoachingPage() {
  const router = useRouter()
  const { user, profile } = useStore()
  const messagesEndRef = useRef(null)

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [wearableData, setWearableData] = useState(null)
  const [todaysBrief, setTodaysBrief] = useState(null)
  const [loadingBrief, setLoadingBrief] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    loadWearableData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadWearableData = async () => {
    if (!user) {
      // Demo data
      setWearableData({
        recovery_score: 74,
        hrv: 52,
        rhr: 58,
        sleep_score: 81,
        strain: 8.4,
        readiness: 78,
      })
      return
    }
    const { data } = await supabase
      .from('wearable_data')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .single()
    if (data?.metrics) setWearableData(data.metrics)
  }

  const generateDailyBrief = async () => {
    setLoadingBrief(true)
    try {
      const data = await getDailyBrief({
        userId: user?.id,
        wearableData,
        profile: {
          name: profile?.full_name?.split(' ')[0] || 'there',
          subscription: profile?.subscription || 'basic',
          goals: 'health optimization, performance',
        },
      })
      setTodaysBrief(data)
      setMessages([
        {
          role: 'assistant',
          content: data.message || buildFallbackBrief(),
          timestamp: new Date(),
        },
      ])
      setInitialized(true)
    } catch {
      const fallback = buildFallbackBrief()
      setTodaysBrief({ message: fallback })
      setMessages([{ role: 'assistant', content: fallback, timestamp: new Date() }])
      setInitialized(true)
    } finally {
      setLoadingBrief(false)
    }
  }

  const buildFallbackBrief = () => {
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    const name = profile?.full_name?.split(' ')[0] || 'there'
    const recovery = wearableData?.recovery_score || 74
    const hrv = wearableData?.hrv || 52

    const recoveryAdvice =
      recovery >= 75
        ? `Your recovery is excellent at ${recovery}% with HRV of ${hrv}ms. Good day for a solid training session — you can push intensity.`
        : recovery >= 50
          ? `Recovery is moderate at ${recovery}%. Go with moderate intensity today. Focus on quality over quantity.`
          : `Recovery is low at ${recovery}%. Active recovery or mobility work is best today — give your body time to rebuild.`

    return `${greeting}, ${name}! Here's your daily optimization brief.\n\n**Recovery Status:** ${recoveryAdvice}\n\n**Today's Priorities:**\n• Morning: Focus on a high-protein breakfast and hydration\n• Training: ${
      recovery >= 75 ? 'Strength or cardio — good day to train' : 'Light movement, e.g. walk 20-30 min'
    }\n• Nutrition: Prioritize protein and sleep-supporting foods tonight\n• Evening: No screens 90 min before bed, target 8 hours\n\nWhat would you like to focus on today? Ask me anything about training, nutrition, protocols, or how to interpret your data.`
  }

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')

    const userMsg = { role: 'user', content: msg, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const data = await coachChat({
        messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        userId: user?.id,
        wearableData,
        profile: {
          name: profile?.full_name?.split(' ')[0] || 'there',
          subscription: profile?.subscription || 'basic',
        },
      })
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.response || data.message || 'I encountered an issue. Please try again.',
          timestamp: new Date(),
        },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Connection issue. Please check your internet and try again.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const formatContent = (text) => {
    return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')
  }

  return (
    <div className="coaching-page">
      <div className="bg-grid" />
      <header className="coaching-header">
        <button className="back-btn" onClick={() => router.push('/dashboard')}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="coaching-title">AI Health Coach</h1>
          <p className="coaching-sub">Powered by Claude · Always on</p>
        </div>
        <button className="refresh-btn" onClick={generateDailyBrief}>
          <RefreshCw size={16} />
        </button>
      </header>

      {wearableData && (
        <div className="wearable-strip">
          {[
            {
              label: 'Recovery',
              val: `${wearableData.recovery_score || 74}%`,
              icon: Activity,
              color:
                wearableData.recovery_score >= 75
                  ? 'var(--green)'
                  : wearableData.recovery_score >= 50
                    ? 'var(--gold)'
                    : 'var(--red)',
            },
            { label: 'HRV', val: `${wearableData.hrv || 52}ms`, icon: Zap, color: 'var(--green)' },
            { label: 'Sleep', val: `${wearableData.sleep_score || 81}%`, icon: Moon, color: 'var(--blue-light)' },
            {
              label: 'Readiness',
              val: `${wearableData.readiness || 78}%`,
              icon: Sun,
              color: 'var(--gold)',
            },
          ].map(m => (
            <div key={m.label} className="strip-metric">
              <m.icon size={12} style={{ color: m.color }} />
              <span className="strip-val" style={{ color: m.color }}>{m.val}</span>
              <span className="strip-label">{m.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="chat-area">
        {!initialized ? (
          <div className="brief-launch">
            <motion.div className="brief-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="brief-icon"><Sparkles size={32} /></div>
              <h2 className="brief-title">
                Good {new Date().getHours() < 12 ? 'Morning' : 'Day'}, {profile?.full_name?.split(' ')[0] || 'there'}
              </h2>
              <p className="brief-desc">
                Get your personalized daily brief — training recommendations, nutrition targets, and protocol adjustments based on your wearable data.
              </p>
              <button className="brief-btn" onClick={generateDailyBrief} disabled={loadingBrief}>
                {loadingBrief ? (
                  <>
                    <Loader2 size={16} className="spin" /> Generating your brief...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Get Today's Brief
                  </>
                )}
              </button>
            </motion.div>
          </div>
        ) : (
          <div className="messages-list">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  className={`message-bubble ${msg.role}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  {msg.role === 'assistant' && (
                    <div className="assistant-avatar"><Sparkles size={14} /></div>
                  )}
                  <div className="message-body">
                    <div
                      className="message-text"
                      dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                    />
                    <span className="message-time">{formatTime(msg.timestamp)}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <div className="message-bubble assistant">
                <div className="assistant-avatar"><Sparkles size={14} /></div>
                <div className="message-body">
                  <div className="typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {initialized && (
        <div className="quick-prompts">
          {MORNING_PROMPTS.map((p, i) => (
            <button key={i} className="quick-prompt" onClick={() => sendMessage(p)}>
              {p}
            </button>
          ))}
        </div>
      )}

      {initialized && (
        <div className="chat-input-bar">
          <input
            className="chat-input"
            type="text"
            placeholder="Ask your AI coach anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          />
          <button
            className="send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            {loading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          </button>
        </div>
      )}
    </div>
  )
}
