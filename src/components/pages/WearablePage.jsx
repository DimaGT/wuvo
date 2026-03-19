'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, CheckCircle2, ExternalLink, RefreshCw, Zap, Moon, Heart, Activity } from 'lucide-react'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { whoopCallback, connectOura as connectOuraApi, syncOura } from '@/api/wearables'
import './WearablePage.css'

export function WearablePage() {
  const router = useRouter()
  const { user } = useStore()
  const [ouraToken, setOuraToken] = useState('')
  const [connected, setConnected] = useState({ whoop: false, oura: false })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const whoopCode = params.get('code')
    if (whoopCode) handleWHOOPCallback(whoopCode)
    loadWearableData()
  }, [])

  const handleWHOOPCallback = async (code) => {
    try {
      await whoopCallback({ code, userId: user?.id })
      setConnected((c) => ({ ...c, whoop: true }))
    } catch (err) {
      console.error(err)
    }
  }

  const connectWHOOP = () => {
    const clientId = process.env.NEXT_PUBLIC_WHOOP_CLIENT_ID
    const redirect = typeof window !== 'undefined' ? `${window.location.origin}/integrations` : ''
    const scope = 'read:recovery read:sleep read:workout read:body_measurement'
    const url = `https://api.prod.whoop.com/oauth/oauth2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&scope=${encodeURIComponent(scope)}`
    if (typeof window !== 'undefined') window.location.href = url
  }

  const connectOura = async () => {
    if (!ouraToken.trim()) return
    setLoading(true)
    try {
      await connectOuraApi({ token: ouraToken, userId: user?.id })
      setConnected((c) => ({ ...c, oura: true }))
      syncOuraData()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadWearableData = async () => {
    if (!user) return
    const { data: rows } = await supabase
      .from('wearable_data')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(7)
    if (rows?.length > 0) {
      setData(rows)
      setConnected({ whoop: rows.some((r) => r.source === 'whoop'), oura: rows.some((r) => r.source === 'oura') })
    }
  }

  const syncOuraData = async () => {
    setSyncing(true)
    try {
      await syncOura({ userId: user?.id })
      await loadWearableData()
    } finally {
      setSyncing(false)
    }
  }

  const todayData = data?.[0]?.metrics || {
    recovery_score: 74,
    hrv: 52,
    rhr: 58,
    sleep_score: 81,
    strain: 8.4,
    readiness: 78,
  }
  const getCoachingColor = (score) => (score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--gold)' : 'var(--red)')
  const getCoachingLabel = (score) => (score >= 75 ? 'Ready to Train' : score >= 50 ? 'Moderate Activity' : 'Rest & Recover')

  return (
    <div className="wearable-page">
      <div className="bg-grid" />
      <header className="wearable-header">
        <button className="back-btn" onClick={() => router.push('/dashboard')}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="wearable-title">Wearable Integration</h1>
          <p className="wearable-sub">WHOOP · Oura Ring · Apple Health</p>
        </div>
        <button className="sync-btn" onClick={syncOuraData} disabled={syncing}>
          <RefreshCw size={16} className={syncing ? 'spin' : ''} />
        </button>
      </header>
      <div className="wearable-body">
        {(connected.whoop || connected.oura) && (
          <motion.div className="recovery-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ borderColor: getCoachingColor(todayData.recovery_score) + '40' }}>
            <div className="recovery-header">
              <div>
                <p className="recovery-label">Today&apos;s Recovery</p>
                <p className="recovery-score" style={{ color: getCoachingColor(todayData.recovery_score) }}>{todayData.recovery_score}%</p>
              </div>
              <div className="recovery-status" style={{ background: getCoachingColor(todayData.recovery_score) + '18', color: getCoachingColor(todayData.recovery_score) }}>
                {getCoachingLabel(todayData.recovery_score)}
              </div>
            </div>
            <div className="metrics-row-wear">
              {[
                { label: 'HRV', val: `${todayData.hrv}ms`, icon: Activity, color: 'var(--green)' },
                { label: 'RHR', val: `${todayData.rhr}bpm`, icon: Heart, color: 'var(--red)' },
                { label: 'Sleep', val: `${todayData.sleep_score}%`, icon: Moon, color: 'var(--blue-light)' },
                { label: 'Strain', val: todayData.strain, icon: Zap, color: 'var(--gold)' },
              ].map((m) => (
                <div key={m.label} className="wear-metric">
                  <m.icon size={14} style={{ color: m.color }} />
                  <span className="wear-metric-val" style={{ color: m.color }}>{m.val}</span>
                  <span className="wear-metric-label">{m.label}</span>
                </div>
              ))}
            </div>
            <div className="ai-coaching">
              <p className="coaching-label">🤖 AI Coaching</p>
              <p className="coaching-text">
                {todayData.recovery_score >= 75
                  ? `Recovery at ${todayData.recovery_score}% with HRV of ${todayData.hrv}ms — excellent day for a heavy training session. Push intensity today.`
                  : todayData.recovery_score >= 50
                    ? `Recovery at ${todayData.recovery_score}%. Consider moderate intensity training — focus on technique over maximum load. Prioritize sleep tonight.`
                    : `Recovery is low at ${todayData.recovery_score}%. Skip heavy lifting today. Active recovery, mobility work, or a rest day will serve you better.`}
              </p>
            </div>
          </motion.div>
        )}
        <motion.div className={`device-card ${connected.whoop ? 'connected' : ''}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="device-header">
            <div className="device-logo whoop-logo">WHOOP</div>
            {connected.whoop ? <span className="device-connected"><CheckCircle2 size={14} /> Connected</span> : <span className="device-disconnected">Not connected</span>}
          </div>
          <p className="device-desc">Sync strain, recovery score, HRV, and sleep data for AI-personalized daily coaching.</p>
          {!connected.whoop ? (
            <button className="device-btn whoop-btn" onClick={connectWHOOP}>Connect WHOOP <ExternalLink size={14} /></button>
          ) : (
            <div className="device-stats"><span>✓ Syncing daily</span><span>Last sync: today</span></div>
          )}
        </motion.div>
        <motion.div className={`device-card ${connected.oura ? 'connected' : ''}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="device-header">
            <div className="device-logo oura-logo">Oura Ring</div>
            {connected.oura ? <span className="device-connected"><CheckCircle2 size={14} /> Connected</span> : <span className="device-disconnected">Not connected</span>}
          </div>
          <p className="device-desc">Sync readiness score, sleep stages, HRV, and body temperature for holistic recovery analysis.</p>
          {!connected.oura ? (
            <div className="oura-connect">
              <p className="oura-help">
                Get your Personal Access Token at{' '}
                <a href="https://cloud.ouraring.com/personal-access-tokens" target="_blank" rel="noreferrer">cloud.ouraring.com <ExternalLink size={11} /></a>
              </p>
              <div className="oura-input-row">
                <input type="text" className="oura-token-input" placeholder="Paste your Oura API token" value={ouraToken} onChange={(e) => setOuraToken(e.target.value)} />
                <button className="device-btn oura-btn" onClick={connectOura} disabled={loading || !ouraToken}>{loading ? '...' : 'Connect'}</button>
              </div>
            </div>
          ) : (
            <div className="device-stats"><span>✓ Syncing daily</span><span>Last sync: today</span></div>
          )}
        </motion.div>
        <motion.div className="device-card coming-soon" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="device-header">
            <div className="device-logo apple-logo">Apple Health</div>
            <span className="device-soon">Coming Soon</span>
          </div>
          <p className="device-desc">Native iOS HealthKit integration for steps, workouts, heart rate, and more.</p>
        </motion.div>
      </div>
    </div>
  )
}
