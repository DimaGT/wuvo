'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  Apple,
  Bell,
  BookOpen,
  ChevronRight,
  Dumbbell,
  FlaskConical,
  Heart,
  Lock,
  MessageCircle,
  Moon,
  Pill,
  Settings,
  Stethoscope,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAddonAccess, useHasBase } from '@/components/SubscriptionGate'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import './Dashboard.css'

export function Dashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile } = useStore()

  const [wearable, setWearable] = useState(null)
  const [showWelcome, setShowWelcome] = useState(false)

  const hasBase = useHasBase()
  const canGym = useAddonAccess('gym_scan')
  const canPantry = useAddonAccess('pantry_scan')
  const canNP = useAddonAccess('np_booking')

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    if (searchParams.get('subscribed') === 'true') {
      setShowWelcome(true)
      setTimeout(() => setShowWelcome(false), 4000)
    }
    loadWearable()
  }, [searchParams])

  const loadWearable = async () => {
    if (!user) {
      setWearable({ recovery_score: 74, hrv: 52, rhr: 58, sleep_score: 81 })
      return
    }
    const { data } = await supabase
      .from('wearable_data')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .single()
    setWearable(data?.metrics || { recovery_score: 74, hrv: 52, rhr: 58, sleep_score: 81 })
  }

  const recovery = wearable?.recovery_score || 74
  const recoveryColor =
    recovery >= 75 ? 'var(--accent)' : recovery >= 50 ? 'var(--warn)' : 'var(--danger)'
  const recoveryLabel = recovery >= 75 ? 'Peak' : recovery >= 50 ? 'Moderate' : 'Low'

  const ACTIONS = [
    { icon: MessageCircle, label: 'AI Coach', sub: 'Daily brief', route: '/coach', locked: !hasBase, color: 'var(--accent)' },
    { icon: Dumbbell, label: 'Workout', sub: canGym ? 'Scan your gym' : 'Generate plan', route: '/gym-scan', locked: false, color: 'var(--accent2)' },
    { icon: Apple, label: 'Nutrition', sub: canPantry ? 'Scan pantry' : 'Upgrade for scan', route: '/pantry-scan', locked: false, color: 'var(--green)' },
    { icon: Pill, label: 'Supplements', sub: 'AI stack builder', route: '/coach', locked: !hasBase, color: 'var(--accent)' },
    { icon: BookOpen, label: 'Exercises', sub: 'Demo library', route: '/gym-scan', locked: false, color: 'var(--accent2)' },
    { icon: Activity, label: 'Wearables', sub: 'WHOOP · Oura', route: '/integrations', locked: !hasBase, color: 'var(--accent)' },
    { icon: FlaskConical, label: 'Labs', sub: 'Upload results', route: '/labs', locked: !hasBase, color: 'var(--accent2)' },
    { icon: canNP ? Stethoscope : Activity, label: canNP ? 'NP Visit' : 'Telehealth', sub: canNP ? 'Book consultation' : 'Find a provider', route: '/book', locked: false, color: 'var(--warn)' },
  ]

  return (
    <div className="dashboard">
      <div className="bg-grid" />
      <AnimatePresence>
        {showWelcome && (
          <motion.div className="welcome-toast" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            🎉 Welcome to Wuvo! Your subscription is active.
          </motion.div>
        )}
      </AnimatePresence>
      <header className="dash-header">
        <div className="dash-greeting">
          <p className="greeting-sub">{greeting}</p>
          <h1 className="greeting-name">{firstName}</h1>
        </div>
        <div className="dash-header-right">
          <button className="dash-icon-btn" onClick={() => router.push('/coach')}>
            <Bell size={20} />
          </button>
          <button className="dash-avatar" onClick={() => router.push('/profile')}>
            {profile?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
          </button>
        </div>
      </header>
      <div className="dash-body">
        {wearable && (
          <motion.div
            className="recovery-hero"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ borderColor: recoveryColor + '30' }}
            onClick={() => router.push('/integrations')}
          >
            <div className="rh-left">
              <p className="rh-label">Today&apos;s Recovery</p>
              <p className="rh-score" style={{ color: recoveryColor }}>{recovery}%</p>
              <span className="rh-status" style={{ background: recoveryColor + '18', color: recoveryColor }}>
                {recoveryLabel} — {recovery >= 75 ? 'Train hard today' : recovery >= 50 ? 'Moderate intensity' : 'Rest & recover'}
              </span>
            </div>
            <div className="rh-metrics">
              {[
                { icon: Zap, val: `${wearable.hrv || 52}ms`, label: 'HRV', color: 'var(--accent)' },
                { icon: Heart, val: `${wearable.rhr || 58}`, label: 'RHR', color: 'var(--danger)' },
                { icon: Moon, val: `${wearable.sleep_score || 81}%`, label: 'Sleep', color: 'var(--accent2)' },
              ].map((m) => (
                <div key={m.label} className="rh-metric">
                  <m.icon size={12} style={{ color: m.color }} />
                  <span style={{ color: m.color }}>{m.val}</span>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {!hasBase && (
          <motion.div className="upgrade-strip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => router.push('/pricing')}>
            <Zap size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <div className="upgrade-strip-text">
              <span className="upgrade-strip-title">Unlock Wuvo</span>
              <span className="upgrade-strip-sub">AI coaching · Wearables · Full platform — $29/mo</span>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          </motion.div>
        )}
        <div className="section-header-row">
          <p className="section-title">Quick Actions</p>
        </div>
        <div className="actions-grid">
          {ACTIONS.map((action, i) => (
            <motion.button
              key={action.route + action.label}
              className={`action-tile ${action.locked ? 'locked' : ''}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => router.push(action.locked ? '/pricing' : action.route)}
            >
              <div className="tile-icon" style={{ background: action.color + '18', color: action.color }}>
                {action.locked ? <Lock size={18} /> : <action.icon size={20} />}
              </div>
              <p className="tile-label">{action.label}</p>
              <p className="tile-sub">{action.locked ? 'Upgrade' : action.sub}</p>
            </motion.button>
          ))}
        </div>
        <div className="section-header-row">
          <p className="section-title">Recent Activity</p>
          <button className="see-all" onClick={() => router.push('/progress')}>See all</button>
        </div>
        <div className="activity-list">
          {[
            { icon: TrendingUp, label: 'Progress logged', sub: 'Weight: 203 lbs · Energy 8/10', time: 'Today', color: 'var(--accent)' },
            { icon: Dumbbell, label: 'Workout generated', sub: 'Full Body · 45 min', time: 'Feb 26', color: 'var(--accent2)' },
            { icon: FlaskConical, label: 'Labs uploaded', sub: 'Metabolic Health Panel', time: 'Feb 15', color: 'var(--warn)' },
          ].map((item, i) => (
            <div key={i} className="activity-row">
              <div className="activity-icon" style={{ background: item.color + '18', color: item.color }}>
                <item.icon size={16} />
              </div>
              <div className="activity-text">
                <p className="activity-label">{item.label}</p>
                <p className="activity-sub">{item.sub}</p>
              </div>
              <span className="activity-time">{item.time}</span>
            </div>
          ))}
        </div>
        <button className="settings-row" onClick={() => router.push('/profile')}>
          <Settings size={16} />
          <span>Profile & Settings</span>
          <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
        </button>
      </div>
    </div>
  )
}
