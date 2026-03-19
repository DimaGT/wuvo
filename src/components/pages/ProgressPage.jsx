'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Scale,
  Zap,
  Moon,
  Activity,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import './ProgressPage.css'

const CHART_METRICS = [
  { key: 'weight_kg', label: 'Weight', unit: 'lbs', color: 'var(--gold)', icon: Scale },
  { key: 'energy_level', label: 'Energy', unit: '/10', color: 'var(--green)', icon: Zap },
  { key: 'sleep_hours', label: 'Sleep', unit: 'hrs', color: 'var(--blue-light)', icon: Moon },
  { key: 'mood', label: 'Mood', unit: '/10', color: 'var(--blue)', icon: Activity },
]

const MOCK_DATA = [
  { date: 'Jan 1', weight_kg: 210, energy_level: 5, sleep_hours: 6.5, mood: 5 },
  { date: 'Jan 8', weight_kg: 209, energy_level: 5.5, sleep_hours: 6.8, mood: 6 },
  { date: 'Jan 15', weight_kg: 208, energy_level: 6, sleep_hours: 7, mood: 6.5 },
  { date: 'Jan 22', weight_kg: 207.5, energy_level: 6.5, sleep_hours: 7.2, mood: 7 },
  { date: 'Jan 29', weight_kg: 206, energy_level: 7, sleep_hours: 7.4, mood: 7 },
  { date: 'Feb 5', weight_kg: 205.5, energy_level: 7.5, sleep_hours: 7.6, mood: 7.5 },
  { date: 'Feb 12', weight_kg: 204, energy_level: 8, sleep_hours: 7.8, mood: 8 },
  { date: 'Feb 19', weight_kg: 203, energy_level: 8, sleep_hours: 8, mood: 8.5 },
]

export function ProgressPage() {
  const router = useRouter()
  const { user } = useStore()

  const [activeMetric, setActiveMetric] = useState('weight_kg')
  const [logs, setLogs] = useState(MOCK_DATA)
  const [showLogForm, setShowLogForm] = useState(false)
  const [logForm, setLogForm] = useState({
    weight_kg: '',
    energy_level: 5,
    sleep_hours: 7,
    mood: 7,
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) loadLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadLogs = async () => {
    if (!user) return
    const { data } = await supabase
      .from('progress_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('log_date', { ascending: true })
      .limit(90)
    if (data && data.length > 0) {
      setLogs(
        data.map(d => ({
          ...d,
          date: new Date(d.log_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
        })),
      )
    }
  }

  const saveLog = async () => {
    setSaving(true)
    try {
      if (user) {
        await supabase.from('progress_logs').insert({
          user_id: user.id,
          weight_kg: logForm.weight_kg ? parseFloat(logForm.weight_kg) : null,
          energy_level: logForm.energy_level,
          sleep_hours: parseFloat(logForm.sleep_hours),
          mood: logForm.mood,
          notes: logForm.notes,
          log_date: new Date().toISOString().split('T')[0],
        })
        await loadLogs()
      }
      setShowLogForm(false)
    } finally {
      setSaving(false)
    }
  }

  const metric = CHART_METRICS.find(m => m.key === activeMetric)
  const latest = logs[logs.length - 1]
  const prev = logs[logs.length - 2]
  const delta = latest && prev ? latest[activeMetric] - prev[activeMetric] : 0
  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="chart-tooltip">
          <p className="ct-date">{label}</p>
          <p className="ct-val" style={{ color: metric.color }}>
            {payload[0].value} {metric.unit}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="progress-page">
      <div className="bg-grid" />
      <header className="progress-header">
        <button className="back-btn" onClick={() => router.push('/dashboard')}>
          <ChevronLeft size={20} />
        </button>
        <h1 className="progress-title">Progress Tracking</h1>
        <button className="log-btn" onClick={() => setShowLogForm(true)}>
          <Plus size={18} />
        </button>
      </header>

      <div className="progress-body">
        <div className="metric-selector">
          {CHART_METRICS.map(m => (
            <button
              key={m.key}
              className={`metric-sel-btn ${activeMetric === m.key ? 'active' : ''}`}
              onClick={() => setActiveMetric(m.key)}
              style={{ '--mcolor': m.color }}
            >
              <m.icon size={14} />
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        <motion.div
          key={activeMetric}
          className="metric-hero"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="metric-hero-left">
            <p className="metric-hero-label">{metric.label}</p>
            <p className="metric-hero-val" style={{ color: metric.color }}>
              {latest?.[activeMetric] ?? '—'}
              <span className="metric-hero-unit">{metric.unit}</span>
            </p>
          </div>
          {delta !== 0 && (
            <div
              className={`metric-delta ${
                delta < 0 && activeMetric === 'weight_kg'
                  ? 'positive'
                  : delta > 0
                  ? 'positive'
                  : 'negative'
              }`}
            >
              <TrendIcon size={16} />
              <span>
                {Math.abs(delta).toFixed(1)} {metric.unit}
              </span>
            </div>
          )}
        </motion.div>

        <div className="chart-card">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={logs} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metric.color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 10,
                  fill: 'var(--text)',
                  fontFamily: 'DM Mono',
                }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{
                  fontSize: 10,
                  fill: 'var(--text)',
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={activeMetric}
                stroke={metric.color}
                strokeWidth={2}
                fill="url(#chartGrad)"
                dot={{ fill: metric.color, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <p className="stat-label">Start</p>
            <p className="stat-val">{logs[0]?.[activeMetric] ?? '—'}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Current</p>
            <p className="stat-val" style={{ color: metric.color }}>
              {latest?.[activeMetric] ?? '—'}
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Change</p>
            <p className="stat-val">
              {logs[0] && latest
                ? (latest[activeMetric] - logs[0][activeMetric]).toFixed(1)
                : '—'}
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Logs</p>
            <p className="stat-val">{logs.length}</p>
          </div>
        </div>

        <div className="logs-section">
          <p className="section-mini-label" style={{ marginBottom: 12 }}>
            Recent Entries
          </p>
          {logs
            .slice(-7)
            .reverse()
            .map((log, i) => (
              <div key={i} className="log-row">
                <span className="log-date">{log.date}</span>
                <div className="log-values">
                  {log.weight_kg && <span className="log-val">{log.weight_kg} lbs</span>}
                  {log.energy_level && (
                    <span className="log-val energy">Energy {log.energy_level}/10</span>
                  )}
                  {log.sleep_hours && (
                    <span className="log-val sleep">{log.sleep_hours}h sleep</span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {showLogForm && (
        <div className="modal-overlay" onClick={() => setShowLogForm(false)}>
          <motion.div
            className="log-modal"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-handle" />
            <h2 className="modal-title">Log Today&apos;s Stats</h2>

            <div className="log-form">
              <div className="log-field">
                <label>Weight (lbs)</label>
                <input
                  type="number"
                  placeholder="e.g. 185"
                  value={logForm.weight_kg}
                  onChange={e =>
                    setLogForm(f => ({
                      ...f,
                      weight_kg: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="log-field">
                <label>Energy Level — {logForm.energy_level}/10</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={logForm.energy_level}
                  onChange={e =>
                    setLogForm(f => ({
                      ...f,
                      energy_level: parseInt(e.target.value, 10),
                    }))
                  }
                  className="log-slider"
                />
              </div>
              <div className="log-field">
                <label>Sleep Hours — {logForm.sleep_hours}h</label>
                <input
                  type="range"
                  min={3}
                  max={12}
                  step={0.5}
                  value={logForm.sleep_hours}
                  onChange={e =>
                    setLogForm(f => ({
                      ...f,
                      sleep_hours: parseFloat(e.target.value),
                    }))
                  }
                  className="log-slider"
                />
              </div>
              <div className="log-field">
                <label>Mood — {logForm.mood}/10</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={logForm.mood}
                  onChange={e =>
                    setLogForm(f => ({
                      ...f,
                      mood: parseInt(e.target.value, 10),
                    }))
                  }
                  className="log-slider"
                />
              </div>
              <div className="log-field">
                <label>Notes (optional)</label>
                <textarea
                  placeholder="How are you feeling today?"
                  value={logForm.notes}
                  onChange={e =>
                    setLogForm(f => ({
                      ...f,
                      notes: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
            </div>

            <button className="save-log-btn" onClick={saveLog} disabled={saving}>
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
