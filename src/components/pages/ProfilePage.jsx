'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  User,
  Bell,
  CreditCard,
  Shield,
  ChevronRight,
  Check,
  Loader2,
  LogOut,
  Camera,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { createCustomerPortal } from '@/api/stripe'
import './ProfilePage.css'

const PLAN_LABELS = {
  free: { label: 'Free Tier', color: 'var(--text-muted)' },
  base: { label: 'Base — $29/mo', color: 'var(--accent)' },
  base_annual: { label: 'Base Annual — $249/yr', color: 'var(--accent)' },
}

export function ProfilePage() {
  const router = useRouter()
  const { user, profile, setProfile } = useStore()

  const [section, setSection] = useState('profile') // profile | notifications | subscription | security
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    date_of_birth: '',
    gender: '',
    height_cm: '',
    weight_kg: '',
    timezone: 'America/New_York',
    phone: '',
  })

  const [notifs, setNotifs] = useState({
    daily_brief: true,
    workout_reminders: true,
    weekly_summary: true,
    lab_alerts: true,
    marketing: false,
  })

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || '',
        height_cm: profile.height_cm || '',
        weight_kg: profile.weight_kg || '',
        timezone: profile.timezone || 'America/New_York',
        phone: profile.phone || '',
      })
    }
  }, [profile])

  const saveProfile = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single()
      if (!error && data) {
        setProfile(data)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  const signOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const manageSubscription = async () => {
    try {
      const { url } = await createCustomerPortal({
        customerId: profile?.stripe_customer_id,
        returnUrl: typeof window !== 'undefined' ? window.location.href : '',
      })
      if (url) window.location.href = url
    } catch {
      router.push('/pricing')
    }
  }

  const plan = PLAN_LABELS[profile?.subscription || 'free']

  return (
    <div className="profile-page">
      <div className="bg-grid" />
      <header className="profile-header">
        <button className="back-btn" onClick={() => router.push('/dashboard')}>
          <ChevronLeft size={20} />
        </button>
        <h1 className="profile-title">Profile & Settings</h1>
      </header>

      <div className="profile-hero">
        <div className="avatar-wrap">
          <div className="avatar-circle">
            {profile?.full_name
              ? profile.full_name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <button className="avatar-edit">
            <Camera size={14} />
          </button>
        </div>
        <div className="hero-info">
          <p className="hero-name">{profile?.full_name || user?.email || 'Your Profile'}</p>
          <p className="hero-email">{user?.email}</p>
          <span className="hero-plan" style={{ color: plan.color }}>{plan.label}</span>
        </div>
      </div>

      <div className="section-tabs">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'notifications', label: 'Alerts', icon: Bell },
          { id: 'subscription', label: 'Plan', icon: CreditCard },
          { id: 'security', label: 'Security', icon: Shield },
        ].map(tab => (
          <button
            key={tab.id}
            className={`section-tab ${section === tab.id ? 'active' : ''}`}
            onClick={() => setSection(tab.id)}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="profile-body">
        {section === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="Your full name"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              />
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label className="form-label">Date of Birth</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.date_of_birth}
                  onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
                />
              </div>
              <div className="form-group half">
                <label className="form-label">Gender</label>
                <select
                  className="form-input"
                  value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label className="form-label">Height (inches)</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="72"
                  value={form.height_cm}
                  onChange={e => setForm(f => ({ ...f, height_cm: e.target.value }))}
                />
              </div>
              <div className="form-group half">
                <label className="form-label">Weight (lbs)</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="185"
                  value={form.weight_kg}
                  onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone (for SMS reminders)</label>
              <input
                className="form-input"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select
                className="form-input"
                value={form.timezone}
                onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
              >
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
                <option value="America/Anchorage">Alaska (AKT)</option>
                <option value="Pacific/Honolulu">Hawaii (HT)</option>
              </select>
            </div>

            <button className="save-btn" onClick={saveProfile} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={16} className="spin" /> Saving...
                </>
              ) : saved ? (
                <>
                  <Check size={16} /> Saved!
                </>
              ) : (
                'Save Profile'
              )}
            </button>
          </motion.div>
        )}

        {section === 'notifications' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <p className="section-desc">
              Choose what you want to be notified about. We send via email and SMS (if phone number added).
            </p>
            {[
              { key: 'daily_brief', label: 'Daily AI Brief', desc: 'Morning coaching summary based on your wearable data' },
              { key: 'workout_reminders', label: 'Workout Reminders', desc: 'Reminders for your scheduled training sessions' },
              { key: 'weekly_summary', label: 'Weekly Progress Summary', desc: 'Your stats, wins, and focus areas for next week' },
              { key: 'lab_alerts', label: 'Lab Result Alerts', desc: 'When new lab results are ready to review' },
              { key: 'marketing', label: 'News & Updates', desc: 'New features, content, and Wuvo news' },
            ].map(item => (
              <div key={item.key} className="notif-row">
                <div className="notif-text">
                  <p className="notif-label">{item.label}</p>
                  <p className="notif-desc">{item.desc}</p>
                </div>
                <button
                  className={`toggle ${notifs[item.key] ? 'on' : 'off'}`}
                  onClick={() => setNotifs(n => ({ ...n, [item.key]: !n[item.key] }))}
                >
                  <div className="toggle-thumb" />
                </button>
              </div>
            ))}

            <button
              className="save-btn"
              onClick={() => {
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
              }}
            >
              {saved ? (
                <>
                  <Check size={16} /> Saved!
                </>
              ) : (
                'Save Preferences'
              )}
            </button>
          </motion.div>
        )}

        {section === 'subscription' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="current-plan-card">
              <p className="cp-label">Current Plan</p>
              <p className="cp-name" style={{ color: plan.color }}>{plan.label}</p>
              {profile?.subscription === 'free' ? (
                <p className="cp-desc">
                  You're on the free plan. Subscribe to unlock medical services, AI coaching, and all features.
                </p>
              ) : (
                <p className="cp-desc">Your subscription is active. Next billing date shown in the customer portal.</p>
              )}
            </div>

            {profile?.subscription === 'free' ? (
              <button className="save-btn" onClick={() => router.push('/pricing')}>
                View Plans &amp; Subscribe
              </button>
            ) : (
              <>
                <button className="manage-sub-btn" onClick={manageSubscription}>
                  Manage Subscription <ChevronRight size={16} />
                </button>
                <p className="manage-note">Opens Stripe portal — update payment, cancel, or change plan</p>
              </>
            )}

            <div className="plan-features-list">
              <p className="features-title">Your Plan Includes:</p>
              {(
                profile?.subscription === 'elite'
                  ? [
                      'NP Wellness Plan add-on available',
                      'Full AI platform + all add-ons available',
                      'Quarterly labs included',
                      'Daily AI coaching',
                      'All AI scanning features',
                      'Concierge support',
                    ]
                  : profile?.subscription === 'pro'
                    ? [
                        'NP Wellness Plan add-on available',
                        'AI coaching + supplement recommendations',
                        'Bi-annual labs included',
                        'Weekly AI coaching',
                        'AI gym + pantry scanning',
                        'Advanced wearable analytics',
                      ]
                    : profile?.subscription === 'basic'
                      ? [
                          'NP Wellness Plan add-on available',
                          'AI health assessment + coaching',
                          'AI workout plans',
                          'Basic meal planning',
                          'WHOOP + Oura integration',
                          'Video workout library',
                        ]
                      : ['AI health assessment', 'Basic dashboard', 'Progress tracking',]
              ).map((f, i) => (
                <div key={i} className="feature-row">
                  <Check size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {section === 'security' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div
              className="security-item"
              onClick={() => alert('Password reset email sent to ' + user?.email)}
            >
              <div>
                <p className="security-label">Change Password</p>
                <p className="security-desc">Send a password reset link to your email</p>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
            </div>
            <div className="security-item">
              <div>
                <p className="security-label">Two-Factor Authentication</p>
                <p className="security-desc">Add an extra layer of security to your account</p>
              </div>
              <span className="coming-soon-tag">Soon</span>
            </div>
            <div className="security-item">
              <div>
                <p className="security-label">Connected Devices</p>
                <p className="security-desc">WHOOP, Oura Ring — manage in Integrations</p>
              </div>
              <ChevronRight
                size={16}
                style={{ color: 'var(--text-3)' }}
                onClick={() => router.push('/integrations')}
              />
            </div>
            <div
              className="security-item danger"
              onClick={() => {
                if (confirm('Delete your account? This cannot be undone.')) alert('Contact support@wuvo.ai to delete your account.')
              }}
            >
              <div>
                <p className="security-label">Delete Account</p>
                <p className="security-desc">Permanently delete all your data</p>
              </div>
              <ChevronRight size={16} />
            </div>

            <button className="signout-btn" onClick={signOut} disabled={signingOut}>
              {signingOut ? <Loader2 size={16} className="spin" /> : <LogOut size={16} />}
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
