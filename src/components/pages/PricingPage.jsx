'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, Shield, ArrowLeft, Loader2, Camera, Apple, Brain, Stethoscope } from 'lucide-react'
import { useStore } from '@/lib/store'
import { createCheckoutSession } from '@/api/stripe'
import './PricingPage.css'

const PLANS = [
  { id: 'free', name: 'FREE', price: 0, tagline: 'Try Wuvo — no credit card required', color: 'var(--text-muted)', features: ['AI health assessment', 'Dashboard & progress tracking', '1 free gym scan trial', '1 free pantry scan trial', 'Exercise demo library', 'Telehealth referral directory'] },
  { id: 'base', name: 'BASE', price: 29, priceId: process.env.NEXT_PUBLIC_STRIPE_BASE_PRICE_ID, annualPriceId: process.env.NEXT_PUBLIC_STRIPE_BASE_ANNUAL_PRICE_ID, annualPrice: 249, tagline: 'Full AI health optimization platform', color: 'var(--accent)', popular: true, features: ['Everything in Free', 'Unlimited AI coach chat', 'WHOOP + Oura wearable integration', 'Lab results upload + AI analysis', 'Supplement intelligence', 'Progress tracking with charts', 'Telehealth referral directory'] },
]

const ADDONS = [
  { id: 'gym', name: 'Gym Scanning', price: 39, priceId: process.env.NEXT_PUBLIC_STRIPE_GYM_PRICE_ID, icon: Camera, color: 'var(--accent2)', desc: 'Unlimited AI gym photo → custom workout plans' },
  { id: 'pantry', name: 'Pantry Scanning', price: 29, priceId: process.env.NEXT_PUBLIC_STRIPE_PANTRY_PRICE_ID, icon: Apple, color: 'var(--green)', desc: 'Unlimited AI pantry photo → personalized meal plans' },
  { id: 'coaching', name: 'Coaching + Supplements + Labs', price: 19, priceId: process.env.NEXT_PUBLIC_STRIPE_COACHING_PRICE_ID, icon: Brain, color: 'var(--accent)', desc: 'Daily AI plan + supplement stack builder + lab uploads' },
  { id: 'np', name: 'NP Wellness Plan', price: 39, priceId: process.env.NEXT_PUBLIC_STRIPE_NP_PRICE_ID, icon: Stethoscope, color: 'var(--warn)', desc: 'Quarterly NP visit — your provider sees your full Wuvo data before each session. $75/visit after that.' },
]

export function PricingPage() {
  const router = useRouter()
  const { user } = useStore()
  const [loading, setLoading] = useState(null)
  const [annual, setAnnual] = useState(false)

  const handleSelect = async (priceId, itemId) => {
    if (!user) { router.push('/auth'); return }
    if (!priceId) { alert('This plan is not yet configured. Contact support@wuvo.ai.'); return }
    setLoading(itemId)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { url } = await createCheckoutSession({
        priceId,
        userId: user.id,
        userEmail: user.email,
        planName: itemId,
        successUrl: `${origin}/dashboard?subscribed=true`,
        cancelUrl: `${origin}/pricing`,
      })
      if (url) window.location.href = url
    } catch (err) {
      console.error('Checkout error:', err)
      alert('Unable to start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="pricing-page">
      <div className="bg-grid" />
      <div className="pricing-glow" />
      <div className="pricing-container">
        <button className="pricing-back" onClick={() => router.back()}>
          <ArrowLeft size={16} /> Back
        </button>
        <motion.div className="pricing-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="pricing-eyebrow">Wuvo Membership</p>
          <h1 className="pricing-title">Simple, <span>Modular</span> Pricing</h1>
          <p className="pricing-subtitle">Start free. Upgrade to Base for full AI coaching.<br />Add only the features you actually use.</p>
          <div className="billing-toggle">
            <button className={`toggle-opt ${!annual ? 'active' : ''}`} onClick={() => setAnnual(false)}>Monthly</button>
            <button className={`toggle-opt ${annual ? 'active' : ''}`} onClick={() => setAnnual(true)}>Annual <span className="save-badge">Save $99</span></button>
          </div>
        </motion.div>
        <div className="pricing-grid">
          {PLANS.map((plan, i) => (
            <motion.div key={plan.id} className={`plan-card ${plan.popular ? 'popular' : ''}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              <h3 className="plan-name" style={{ color: plan.color }}>{plan.name}</h3>
              <div className="plan-price">
                <span className="price-amount">${annual && plan.annualPrice ? plan.annualPrice : plan.price}</span>
                <span className="price-period">/{annual && plan.annualPrice ? 'yr' : 'mo'}</span>
              </div>
              <p className="plan-tagline">{plan.tagline}</p>
              <ul className="plan-features">
                {plan.features.map((f) => <li key={f}><Check size={14} /> {f}</li>)}
              </ul>
              {plan.price === 0 ? (
                <button className="plan-cta free" onClick={() => router.push('/auth')}>Get Started Free</button>
              ) : (
                <button className="plan-cta paid" onClick={() => handleSelect(annual && plan.annualPriceId ? plan.annualPriceId : plan.priceId, plan.id)} disabled={loading === plan.id}>
                  {loading === plan.id ? <Loader2 size={16} className="spin" /> : `Start ${plan.name} — $${annual && plan.annualPrice ? plan.annualPrice + '/yr' : plan.price + '/mo'}`}
                </button>
              )}
            </motion.div>
          ))}
        </div>
        <motion.div className="addons-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <p className="addons-eyebrow">Add-Ons</p>
          <h2 className="addons-title">Build Your Stack</h2>
          <p className="addons-sub">Requires Base plan. Add only what you need.</p>
          <div className="addons-grid">
            {ADDONS.map((addon, i) => (
              <motion.div key={addon.id} className="addon-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.08 }} style={{ '--addon-color': addon.color }}>
                <div className="addon-header">
                  <div className="addon-icon" style={{ background: addon.color + '18', color: addon.color }}><addon.icon size={18} /></div>
                  <div>
                    <p className="addon-name">{addon.name}</p>
                    <p className="addon-price">+${addon.price}/mo</p>
                  </div>
                </div>
                <p className="addon-desc">{addon.desc}</p>
                <button className="addon-cta" style={{ borderColor: addon.color + '40', color: addon.color }} onClick={() => handleSelect(addon.priceId, addon.id)} disabled={loading === addon.id}>
                  {loading === addon.id ? <Loader2 size={16} className="spin" /> : 'Add to Plan'}
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
        <div className="trust-row">
          {['256-bit Encryption', 'Cancel Anytime', 'No Medical Claims', 'Data Never Sold'].map((t) => <span key={t} className="trust-item"><Shield size={12} /> {t}</span>)}
        </div>
        <p className="pricing-legal">Wuvo provides AI-powered wellness insights and is not a medical provider. Always consult a healthcare professional before making health decisions.</p>
      </div>
    </div>
  )
}
