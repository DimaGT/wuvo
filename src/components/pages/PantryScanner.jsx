'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Apple, Camera, ChevronLeft, RotateCcw, ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { pantryScan } from '@/api/nutrition'
import './PantryScanner.css'

export function PantryScanner() {
  const router = useRouter()
  const { user } = useStore()
  const fileRef = useRef(null)

  const [phase, setPhase] = useState('capture') // capture | loading | result
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [mealPlan, setMealPlan] = useState(null)
  const [goals, setGoals] = useState('muscle building, high protein')
  const [restrictions, setRestrictions] = useState('')
  const [expanded, setExpanded] = useState(null)

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const scanPantry = async () => {
    if (!photo) return
    setPhase('loading')
    try {
      const base64 = await fileToBase64(photo)
      const data = await pantryScan({
        imageBase64: base64,
        goals,
        restrictions,
        userId: user?.id,
      })
      setMealPlan(data)
      if (user) {
        await supabase.from('meal_plans').insert({
          user_id: user.id,
          plan: data,
          source: 'pantry_scan',
          created_at: new Date().toISOString(),
        })
      }
      setPhase('result')
    } catch (err) {
      // In case of failure, show simple alert as in original
      // and reset phase back to capture.
      // eslint-disable-next-line no-alert
      alert('Scan failed. Please try again.')
      setPhase('capture')
    }
  }

  const MACRO_COLORS = {
    calories: 'var(--gold)',
    protein: 'var(--green)',
    carbs: 'var(--blue-light)',
    fat: 'var(--red)',
  }

  return (
    <div className="pantry-page">
      <div className="bg-grid" />
      <header className="pantry-header">
        <button className="back-btn" onClick={() => router.push('/dashboard')}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="pantry-title">AI Pantry Scanner</h1>
          <p className="pantry-sub">Photo → Personalized Meal Plan</p>
        </div>
      </header>

      <div className="pantry-body">
        {phase === 'capture' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="pantry-explainer">
              <p className="pantry-exp-title">📸 Open Your Fridge or Pantry</p>
              <p className="pantry-exp-desc">
                Take a photo of what you have. Claude will identify your ingredients and generate a
                complete meal plan with macros, recipes, and shopping list.
              </p>
            </div>

            {preview ? (
              <div className="photo-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Pantry" />
                <button
                  className="retake-btn"
                  onClick={() => {
                    setPhoto(null)
                    setPreview(null)
                  }}
                >
                  <RotateCcw size={14} /> Retake
                </button>
              </div>
            ) : (
              <button className="camera-btn" onClick={() => fileRef.current?.click()}>
                <Apple size={32} />
                <span>Tap to photograph your pantry</span>
                <small>fridge · pantry · counter</small>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handlePhoto}
            />

            <div className="prefs-section">
              <div className="pref-group">
                <label className="form-label">Your Goals</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="e.g. high protein, muscle building"
                  value={goals}
                  onChange={e => setGoals(e.target.value)}
                />
              </div>
              <div className="pref-group">
                <label className="form-label">Dietary Restrictions (optional)</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="e.g. no dairy, gluten free"
                  value={restrictions}
                  onChange={e => setRestrictions(e.target.value)}
                />
              </div>
            </div>

            {preview && (
              <button className="generate-btn" onClick={scanPantry}>
                <Apple size={16} /> Generate Meal Plan
              </button>
            )}
          </motion.div>
        )}

        {phase === 'loading' && (
          <motion.div className="loading-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="loading-ring" />
            <p className="loading-title">Analyzing Your Pantry</p>
            <p className="loading-sub">
              Identifying ingredients and building your meal plan...
            </p>
          </motion.div>
        )}

        {phase === 'result' && mealPlan && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            {mealPlan.detectedFoods && (
              <div className="detected-section">
                <p className="section-mini-label">Ingredients Detected</p>
                <div className="detected-chips">
                  {mealPlan.detectedFoods.map(f => (
                    <span key={f} className="detected-chip">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {mealPlan.mealPlan?.dailyMacros && (
              <div className="macro-card">
                <p className="section-mini-label" style={{ marginBottom: 14 }}>
                  Daily Totals
                </p>
                <div className="macro-grid">
                  {Object.entries(mealPlan.mealPlan.dailyMacros).map(([key, val]) => (
                    <div key={key} className="macro-item">
                      <span className="macro-val" style={{ color: MACRO_COLORS[key] }}>
                        {val}
                      </span>
                      <span className="macro-key">{key}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="section-mini-label" style={{ marginBottom: 12 }}>
              Your Meal Plan
            </p>
            {(mealPlan.mealPlan?.meals || []).map((meal, i) => (
              <div key={i} className="meal-card">
                <button
                  className="meal-header"
                  onClick={() => setExpanded(expanded === i ? null : i)}
                >
                  <div className="meal-left">
                    <span className="meal-type-badge">{meal.type}</span>
                    <div>
                      <p className="meal-name">{meal.name}</p>
                      <p className="meal-meta">
                        {meal.macros?.calories} cal · {meal.macros?.protein} protein ·{' '}
                        {meal.prepTime}
                      </p>
                    </div>
                  </div>
                  {expanded === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <AnimatePresence>
                  {expanded === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="meal-detail"
                    >
                      <p className="meal-section-label">Ingredients</p>
                      <ul className="ingredient-list">
                        {meal.ingredients?.map((ing, j) => (
                          <li key={j}>{ing}</li>
                        ))}
                      </ul>
                      <p className="meal-section-label">Prep Instructions</p>
                      <p className="meal-prep">{meal.prep}</p>
                      <div className="meal-macros-detail">
                        {Object.entries(meal.macros || {}).map(([k, v]) => (
                          <span
                            key={k}
                            className="meal-macro-tag"
                            style={{ color: MACRO_COLORS[k] }}
                          >
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {mealPlan.missingItems && mealPlan.missingItems.length > 0 && (
              <div className="shopping-section">
                <p className="section-mini-label">
                  <ShoppingCart size={12} style={{ display: 'inline', marginRight: 6 }} />
                  Suggested Shopping
                </p>
                <div className="shopping-chips">
                  {mealPlan.missingItems.map(item => (
                    <span key={item} className="shopping-chip">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {mealPlan.optimization && (
              <div className="optimization-card">
                <p className="opt-label">💡 Nutritional Insight</p>
                <p className="opt-text">{mealPlan.optimization}</p>
              </div>
            )}

            <div className="result-actions">
              <button
                className="generate-btn"
                onClick={() => {
                  setPhoto(null)
                  setPreview(null)
                  setPhase('capture')
                }}
              >
                <RotateCcw size={16} /> Scan Again
              </button>
              <button className="secondary-btn" onClick={() => router.push('/dashboard')}>
                Save & Return to Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
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
