'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  Upload,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { analyzeLabs } from '@/api/labs'
import './LabResults.css'

const REFERENCE_RANGES = {
  'Total Testosterone': { low: 300, high: 1000, unit: 'ng/dL', optimal: '600-900' },
  'Free Testosterone': { low: 8.7, high: 25, unit: 'pg/mL', optimal: '15-25' },
  'Estradiol (E2)': { low: 10, high: 40, unit: 'pg/mL', optimal: '20-30' },
  SHBG: { low: 10, high: 57, unit: 'nmol/L', optimal: '20-40' },
  LH: { low: 1.7, high: 8.6, unit: 'mIU/mL', optimal: '3-6' },
  FSH: { low: 1.5, high: 12.4, unit: 'mIU/mL', optimal: '3-8' },
  'DHEA-S': { low: 80, high: 560, unit: 'μg/dL', optimal: '300-450' },
  'Cortisol (AM)': { low: 6, high: 23, unit: 'μg/dL', optimal: '10-18' },
  'IGF-1': { low: 88, high: 246, unit: 'ng/mL', optimal: '150-220' },
  TSH: { low: 0.4, high: 4.0, unit: 'mIU/L', optimal: '1.0-2.5' },
  'Free T3': { low: 2.3, high: 4.2, unit: 'pg/mL', optimal: '3.2-4.2' },
  'Free T4': { low: 0.8, high: 1.8, unit: 'ng/dL', optimal: '1.1-1.6' },
  'Vitamin D': { low: 30, high: 100, unit: 'ng/mL', optimal: '60-80' },
  Zinc: { low: 60, high: 120, unit: 'μg/dL', optimal: '90-110' },
  Magnesium: { low: 1.7, high: 2.4, unit: 'mg/dL', optimal: '2.0-2.4' },
  PSA: { low: 0, high: 4.0, unit: 'ng/mL', optimal: '<1.5' },
  Hemoglobin: { low: 13.5, high: 17.5, unit: 'g/dL', optimal: '14.5-16.5' },
  Hematocrit: { low: 41, high: 53, unit: '%', optimal: '42-50' },
}

const MOCK_LABS = [
  {
    id: '1',
    panel_name: 'Comprehensive Hormone Panel',
    test_date: '2026-02-01',
    results: {
      'Total Testosterone': 420,
      'Free Testosterone': 11.2,
      'Estradiol (E2)': 28,
      SHBG: 38,
      'Vitamin D': 34,
      PSA: 0.8,
    },
  },
  {
    id: '2',
    panel_name: 'Thyroid Panel',
    test_date: '2026-01-15',
    results: {
      TSH: 2.1,
      'Free T3': 3.4,
      'Free T4': 1.2,
    },
  },
]

export function LabResults() {
  const router = useRouter()
  const { user, profile } = useStore()
  const fileRef = useRef(null)

  const [labs, setLabs] = useState(MOCK_LABS)
  const [expanded, setExpanded] = useState('1')
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiInsight, setAiInsight] = useState('')
  const [showManual, setShowManual] = useState(false)
  const [manualForm, setManualForm] = useState({
    panelName: '',
    testDate: '',
    markers: [{ name: '', value: '' }],
  })

  useEffect(() => {
    if (user) loadLabs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadLabs = async () => {
    if (!user) return
    const { data } = await supabase
      .from('lab_results')
      .select('*')
      .eq('user_id', user.id)
      .order('test_date', { ascending: false })
    if (data && data.length > 0) setLabs(data)
  }

  const handlePDFUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setAnalyzing(true)
    try {
      const base64 = await fileToBase64(file)
      const data = await analyzeLabs({
        pdfBase64: base64,
        userId: user?.id,
        profile,
      })
      if (data.results) {
        const newLab = {
          id: Date.now().toString(),
          panel_name: data.panelName || 'Uploaded Lab Results',
          test_date: data.testDate || new Date().toISOString().split('T')[0],
          results: data.results,
        }
        if (user) {
          await supabase.from('lab_results').insert({ user_id: user.id, ...newLab })
        }
        setLabs(prev => [newLab, ...prev])
        setAiInsight(data.insight || '')
        setExpanded(newLab.id)
      }
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Upload failed. Try entering results manually.')
    } finally {
      setUploading(false)
      setAnalyzing(false)
    }
  }

  const saveManual = async () => {
    const results = {}
    manualForm.markers.forEach(m => {
      if (m.name && m.value) results[m.name] = parseFloat(m.value)
    })
    const newLab = {
      id: Date.now().toString(),
      panel_name: manualForm.panelName || 'Manual Entry',
      test_date: manualForm.testDate || new Date().toISOString().split('T')[0],
      results,
    }
    if (user) {
      await supabase.from('lab_results').insert({ user_id: user.id, ...newLab })
    }
    setLabs(prev => [newLab, ...prev])
    setExpanded(newLab.id)
    setShowManual(false)
    setManualForm({ panelName: '', testDate: '', markers: [{ name: '', value: '' }] })
  }

  const getStatus = (marker, value) => {
    const ref = REFERENCE_RANGES[marker]
    if (!ref) return 'unknown'
    if (value < ref.low) return 'low'
    if (value > ref.high) return 'high'
    return 'normal'
  }

  const statusConfig = {
    low: { color: 'var(--red)', icon: TrendingDown, label: 'LOW' },
    high: { color: 'var(--gold)', icon: TrendingUp, label: 'HIGH' },
    normal: { color: 'var(--green)', icon: Minus, label: 'NORMAL' },
    unknown: { color: 'var(--text-3)', icon: Minus, label: '—' },
  }

  return (
    <div className="labs-page">
      <div className="bg-grid" />
      <header className="labs-header">
        <button className="back-btn" onClick={() => router.push('/dashboard')}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="labs-title">Lab Results</h1>
          <p className="labs-sub">Upload PDFs or enter manually</p>
        </div>
      </header>

      <div className="labs-body">
        <div className="labs-actions">
          <button
            className="upload-btn"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
            {uploading ? 'Analyzing...' : 'Upload Lab PDF'}
          </button>
          <button className="manual-btn" onClick={() => setShowManual(true)}>
            <Plus size={16} /> Enter Manually
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,image/*"
            style={{ display: 'none' }}
            onChange={handlePDFUpload}
          />
        </div>

        {aiInsight && (
          <motion.div
            className="ai-insight-card"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="ai-insight-label">🤖 AI Analysis</p>
            <p className="ai-insight-text">{aiInsight}</p>
          </motion.div>
        )}

        {labs.map(lab => (
          <div key={lab.id} className="lab-panel">
            <button
              className="lab-panel-header"
              onClick={() => setExpanded(expanded === lab.id ? null : lab.id)}
            >
              <div className="lab-panel-left">
                <FileText size={18} style={{ color: 'var(--blue-light)' }} />
                <div>
                  <p className="lab-panel-name">{lab.panel_name}</p>
                  <p className="lab-panel-date">
                    {new Date(lab.test_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              {expanded === lab.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <AnimatePresence>
              {expanded === lab.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="lab-markers"
                >
                  {Object.entries(lab.results).map(([marker, value]) => {
                    const status = getStatus(marker, value)
                    const config = statusConfig[status]
                    const ref = REFERENCE_RANGES[marker]
                    const StatusIcon = config.icon
                    return (
                      <div key={marker} className="marker-row">
                        <div className="marker-left">
                          <p className="marker-name">{marker}</p>
                          {ref && (
                            <p className="marker-optimal">
                              Optimal: {ref.optimal} {ref.unit}
                            </p>
                          )}
                        </div>
                        <div className="marker-right">
                          <span className="marker-value">
                            {value}{' '}
                            <span className="marker-unit">{ref?.unit || ''}</span>
                          </span>
                          <span
                            className="marker-status"
                            style={{
                              color: config.color,
                              background: `${config.color}18`,
                            }}
                          >
                            <StatusIcon size={10} />
                            {config.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  <button className="analyze-btn" onClick={() => analyzeWithAI(lab)}>
                    🤖 Get AI Analysis of This Panel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showManual && (
          <div className="modal-overlay" onClick={() => setShowManual(false)}>
            <motion.div
              className="manual-modal"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-handle" />
              <h2 className="modal-title">Enter Lab Results</h2>
              <div className="manual-form">
                <div className="mf-field">
                  <label>Panel Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Comprehensive Hormone Panel"
                    value={manualForm.panelName}
                    onChange={e =>
                      setManualForm(f => ({
                        ...f,
                        panelName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="mf-field">
                  <label>Test Date</label>
                  <input
                    type="date"
                    value={manualForm.testDate}
                    onChange={e =>
                      setManualForm(f => ({
                        ...f,
                        testDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <label className="mf-label">Markers</label>
                {manualForm.markers.map((m, i) => (
                  <div key={i} className="marker-input-row">
                    <input
                      type="text"
                      placeholder="Marker name"
                      value={m.name}
                      onChange={e =>
                        setManualForm(f => ({
                          ...f,
                          markers: f.markers.map((mk, mi) =>
                            mi === i ? { ...mk, name: e.target.value } : mk,
                          ),
                        }))
                      }
                    />
                    <input
                      type="number"
                      placeholder="Value"
                      value={m.value}
                      onChange={e =>
                        setManualForm(f => ({
                          ...f,
                          markers: f.markers.map((mk, mi) =>
                            mi === i ? { ...mk, value: e.target.value } : mk,
                          ),
                        }))
                      }
                    />
                  </div>
                ))}
                <button
                  className="add-marker-btn"
                  onClick={() =>
                    setManualForm(f => ({
                      ...f,
                      markers: [...f.markers, { name: '', value: '' }],
                    }))
                  }
                >
                  <Plus size={14} /> Add Marker
                </button>
              </div>
              <button className="save-btn" onClick={saveManual}>
                Save Results
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function analyzeWithAI(lab) {
  // Placeholder: in future can call backend AI analysis for this specific panel
  // eslint-disable-next-line no-alert
  alert(
    'AI analysis coming — this will send your panel to Claude for a full interpretation with recommendations.',
  )
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
