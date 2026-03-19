'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Dumbbell, Camera, ChevronLeft, ChevronDown, ChevronUp, Play, RotateCcw } from 'lucide-react'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { generateWorkout, gymScan } from '@/api/workouts'
import './WorkoutGenerator.css'

const GOALS = ['Build Muscle', 'Lose Fat', 'Athletic Performance', 'Endurance', 'Mobility & Flexibility']
const EQUIPMENT = ['Full Gym', 'Hotel Gym', 'Home (Dumbbells)', 'Bodyweight Only', 'Resistance Bands']
const DURATIONS = ['20 min', '30 min', '45 min', '60 min', '75 min']
const DAYS = ['3 days/week', '4 days/week', '5 days/week', '6 days/week']

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function WorkoutGenerator() {
  const router = useRouter()
  const { user } = useStore()
  const fileRef = useRef(null)

  const [mode, setMode] = useState('form')
  const [gymPhoto, setGymPhoto] = useState(null)
  const [gymPhotoPreview, setGymPhotoPreview] = useState(null)
  const [form, setForm] = useState({
    goal: '',
    equipment: '',
    duration: '45 min',
    days: '4 days/week',
    fitnessLevel: 'Intermediate',
    injuries: '',
  })
  const [workout, setWorkout] = useState(null)
  const [expandedEx, setExpandedEx] = useState(null)
  const [error, setError] = useState('')

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setGymPhoto(file)
    setGymPhotoPreview(URL.createObjectURL(file))
    setMode('scan')
  }

  const generateFromForm = async () => {
    if (!form.goal || !form.equipment) {
      setError('Please select your goal and equipment type.')
      return
    }
    setError('')
    setMode('loading')
    try {
      const data = await generateWorkout({ ...form, userId: user?.id })
      setWorkout(data)
      if (user) {
        await supabase.from('workout_plans').insert({
          user_id: user.id,
          plan: data,
          source: 'ai_form',
          created_at: new Date().toISOString(),
        })
      }
      setMode('result')
    } catch (err) {
      setError('Generation failed. Please try again.')
      setMode('form')
    }
  }

  const generateFromPhoto = async () => {
    if (!gymPhoto) return
    setMode('loading')
    try {
      const base64 = await fileToBase64(gymPhoto)
      const data = await gymScan({ imageBase64: base64, userId: user?.id })
      setWorkout(data.workoutPlan || data)
      if (user) {
        await supabase.from('workout_plans').insert({
          user_id: user.id,
          plan: data,
          source: 'gym_scan',
          created_at: new Date().toISOString(),
        })
      }
      setMode('result')
    } catch (err) {
      setError('Scan failed. Please try again.')
      setMode('scan')
    }
  }

  return (
    <div className="workout-page">
      <div className="bg-grid" />
      <header className="workout-header">
        <button className="back-btn" onClick={() => router.push('/dashboard')}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="workout-page-title">AI Workout Generator</h1>
          <p className="workout-page-sub">Form-based or gym photo scan</p>
        </div>
      </header>
      {(mode === 'form' || mode === 'scan') && (
        <div className="mode-tabs">
          <button className={`mode-tab ${mode === 'form' ? 'active' : ''}`} onClick={() => setMode('form')}>
            <Dumbbell size={16} /> Build From Goals
          </button>
          <button className={`mode-tab ${mode === 'scan' ? 'active' : ''}`} onClick={() => setMode('scan')}>
            <Camera size={16} /> Scan Gym
          </button>
        </div>
      )}
      <div className="workout-body">
        {mode === 'form' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="form-section">
              <label className="form-label">Primary Goal</label>
              <div className="chip-grid">
                {GOALS.map((g) => (
                  <button key={g} className={`chip ${form.goal === g ? 'active' : ''}`} onClick={() => setField('goal', g)}>{g}</button>
                ))}
              </div>
            </div>
            <div className="form-section">
              <label className="form-label">Available Equipment</label>
              <div className="chip-grid">
                {EQUIPMENT.map((e) => (
                  <button key={e} className={`chip ${form.equipment === e ? 'active' : ''}`} onClick={() => setField('equipment', e)}>{e}</button>
                ))}
              </div>
            </div>
            <div className="form-row">
              <div className="form-section half">
                <label className="form-label">Duration</label>
                <div className="chip-grid compact">
                  {DURATIONS.map((d) => (
                    <button key={d} className={`chip small ${form.duration === d ? 'active' : ''}`} onClick={() => setField('duration', d)}>{d}</button>
                  ))}
                </div>
              </div>
              <div className="form-section half">
                <label className="form-label">Frequency</label>
                <div className="chip-grid compact">
                  {DAYS.map((d) => (
                    <button key={d} className={`chip small ${form.days === d ? 'active' : ''}`} onClick={() => setField('days', d)}>{d}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="form-section">
              <label className="form-label">Fitness Level</label>
              <div className="chip-grid">
                {['Beginner', 'Intermediate', 'Advanced'].map((l) => (
                  <button key={l} className={`chip ${form.fitnessLevel === l ? 'active' : ''}`} onClick={() => setField('fitnessLevel', l)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="form-section">
              <label className="form-label">Injuries / Limitations (optional)</label>
              <input type="text" className="text-input" placeholder="e.g. left knee, lower back" value={form.injuries} onChange={(e) => setField('injuries', e.target.value)} />
            </div>
            {error && <p className="form-error">{error}</p>}
            <button className="generate-btn" onClick={generateFromForm}>
              <Dumbbell size={16} /> Generate My Workout Plan
            </button>
          </motion.div>
        )}
        {mode === 'scan' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="scan-section">
            <div className="scan-explainer">
              <p className="scan-title">📸 Snap Your Gym</p>
              <p className="scan-desc">Take a photo of any gym — hotel, home, or commercial — and our AI will instantly generate a complete workout using only your available equipment.</p>
            </div>
            {gymPhotoPreview ? (
              <div className="photo-preview">
                <img src={gymPhotoPreview} alt="Gym" />
                <button className="retake-btn" onClick={() => { setGymPhoto(null); setGymPhotoPreview(null) }}>
                  <RotateCcw size={14} /> Retake
                </button>
              </div>
            ) : (
              <button className="camera-btn" onClick={() => fileRef.current?.click()}>
                <Camera size={32} />
                <span>Tap to take photo</span>
                <small>or upload from library</small>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoCapture} />
            {error && <p className="form-error">{error}</p>}
            {gymPhotoPreview && (
              <button className="generate-btn" onClick={generateFromPhoto}>
                <Camera size={16} /> Scan & Generate Workout
              </button>
            )}
          </motion.div>
        )}
        {mode === 'loading' && (
          <motion.div className="loading-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="loading-ring" />
            <p className="loading-title">Building Your Workout</p>
            <p className="loading-sub">AI is analyzing and generating your personalized plan...</p>
          </motion.div>
        )}
        {mode === 'result' && workout && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="workout-result-header">
              <h2 className="workout-result-name">{workout.name || 'Your Custom Workout'}</h2>
              <div className="workout-result-meta">
                {workout.duration && <span className="meta-tag">{workout.duration}</span>}
                {workout.difficulty && <span className="meta-tag">{workout.difficulty}</span>}
              </div>
            </div>
            {workout.equipment && (
              <div className="equipment-detected">
                <p className="section-mini-label">Equipment Detected</p>
                <div className="eq-chips">
                  {workout.equipment.map((e) => <span key={e} className="eq-chip">{e}</span>)}
                </div>
              </div>
            )}
            <p className="section-mini-label" style={{ marginBottom: 12 }}>Exercises</p>
            {(workout.exercises || []).map((ex, i) => (
              <div key={i} className="exercise-card">
                <button className="exercise-header" onClick={() => setExpandedEx(expandedEx === i ? null : i)}>
                  <div className="ex-left">
                    <span className="ex-number">{i + 1}</span>
                    <div>
                      <p className="ex-name">{ex.name}</p>
                      <p className="ex-meta">{ex.sets} sets × {ex.reps} · Rest {ex.rest}</p>
                    </div>
                  </div>
                  {expandedEx === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <AnimatePresence initial={false}>
                  {expandedEx === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }} style={{ overflow: 'hidden' }} className="exercise-notes">
                      <p>{ex.notes}</p>
                      {ex.videoId && <button className="watch-btn"><Play size={14} /> Watch Demo</button>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            {workout.tips && workout.tips.length > 0 && (
              <div className="tips-section">
                <p className="section-mini-label">Pro Tips</p>
                {workout.tips.map((t, i) => <p key={i} className="tip-item">💡 {t}</p>)}
              </div>
            )}
            <div className="result-actions">
              <button className="generate-btn" onClick={() => setMode('form')}>
                <RotateCcw size={16} /> Generate New Plan
              </button>
              <button className="secondary-btn" onClick={() => router.push('/dashboard')}>Save & Return to Dashboard</button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
