'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Camera, Apple, Brain, Stethoscope, Zap } from 'lucide-react'
import { useStore } from '@/lib/store'
import './SubscriptionGate.css'

const ADDON_CONFIG = {
  gym_scan: {
    icon: Camera,
    color: 'var(--accent2)',
    label: 'Gym Scanning',
    price: '+$39/mo',
    desc: 'Unlock unlimited AI gym photo → workout plan generation.',
  },
  pantry_scan: {
    icon: Apple,
    color: 'var(--green)',
    label: 'Pantry Scanning',
    price: '+$29/mo',
    desc: 'Unlock unlimited AI pantry photo → meal plan generation.',
  },
  daily_coaching: {
    icon: Brain,
    color: 'var(--accent)',
    label: 'Coaching + Supplements + Labs',
    price: '+$19/mo',
    desc: 'Unlock daily AI coaching plans, supplement intelligence, and lab uploads.',
  },
  np_booking: {
    icon: Stethoscope,
    color: 'var(--warn)',
    label: 'NP Wellness Plan',
    price: '+$39/mo',
    desc: 'Unlock quarterly NP visits. Your provider sees your full Wuvo data before every session.',
  },
  base: {
    icon: Zap,
    color: 'var(--accent)',
    label: 'Base Plan',
    price: '$29/mo',
    desc: 'Upgrade to Base for unlimited AI coaching, wearables, and the full Wuvo platform.',
  },
}

function checkAccess(profile, feature) {
  const sub = profile?.subscription || 'free'
  if (sub === 'free') return false
  if (sub === 'base' || sub === 'base_annual') {
    if (feature === 'gym_scan') return profile?.has_gym_addon === true
    if (feature === 'pantry_scan') return profile?.has_pantry_addon === true
    if (feature === 'daily_coaching') return profile?.has_coaching_addon === true
    if (feature === 'np_booking') return profile?.has_np_addon === true
    return true
  }
  return false
}

export function SubscriptionGate({ children, feature = 'base', featureName = 'This feature' }) {
  const router = useRouter()
  const { profile } = useStore()

  const hasAccess = checkAccess(profile, feature)
  if (hasAccess) return children

  const isBaseReq = profile?.subscription === 'free'
  const reqFeature = isBaseReq ? 'base' : feature
  const reqConfig = ADDON_CONFIG[reqFeature]
  const ReqIcon = reqConfig.icon

  return (
    <div className="gate-wrapper">
      <div className="gate-preview" aria-hidden="true">
        {children}
      </div>
      <div className="gate-overlay">
        <motion.div
          className="gate-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="gate-icon" style={{ background: reqConfig.color + '18', color: reqConfig.color }}>
            <Lock size={20} />
          </div>
          <p className="gate-eyebrow">Upgrade Required</p>
          <h2 className="gate-title">{featureName}</h2>
          <p className="gate-desc">{reqConfig.desc}</p>
          <div
            className="gate-plan-badge"
            style={{ borderColor: reqConfig.color + '40', background: reqConfig.color + '10' }}
          >
            <ReqIcon size={14} style={{ color: reqConfig.color }} />
            <span style={{ color: reqConfig.color }}>
              {reqConfig.label} — {reqConfig.price}
            </span>
          </div>
          <button className="gate-cta" onClick={() => router.push('/pricing')}>
            View Plans & Upgrade
          </button>
          <button className="gate-back" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export function LockBadge({ feature = 'base' }) {
  const config = ADDON_CONFIG[feature] || ADDON_CONFIG.base
  return (
    <span className="lock-badge" style={{ background: config.color + '18', color: config.color }}>
      <Lock size={10} /> {config.label}
    </span>
  )
}

export function useAddonAccess(feature = 'base') {
  const { profile } = useStore()
  return checkAccess(profile, feature)
}

export function useHasBase() {
  const { profile } = useStore()
  const sub = profile?.subscription || 'free'
  return sub === 'base' || sub === 'base_annual'
}
