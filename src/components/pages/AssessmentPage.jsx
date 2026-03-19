'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Loader2, Zap, CheckCircle2, ArrowRight, FlaskConical, Target, Calendar, Activity } from 'lucide-react'
import { ASSESSMENT_QUESTIONS, SECTION_COLORS } from '@/lib/questions'
import { useStore } from '@/lib/store'
import { generateHealthAssessment } from '@/lib/ai'
import { supabase } from '@/lib/supabase'
import './AssessmentPage.css'

export function AssessmentPage() {
  const router = useRouter()
  const { user, profile, assessmentAnswers, setAssessmentAnswer, setAssessmentResult } = useStore()

  const [phase, setPhase] = useState('assessment')
  const [currentQ, setCurrentQ] = useState(0)
  const [direction, setDirection] = useState(1)
  const [results, setResults] = useState(null)
  const [loadingMsg, setLoadingMsg] = useState('Analyzing your responses...')
  const cardRef = useRef(null)

  const q = ASSESSMENT_QUESTIONS[currentQ]
  const total = ASSESSMENT_QUESTIONS.length
  const progress = ((currentQ + 1) / total) * 100
  const sectionColor = SECTION_COLORS[q?.section] || 'var(--gold)'

  useEffect(() => {
    if (phase === 'loading') {
      const msgs = ['Analyzing your responses...', 'Cross-referencing symptom patterns...', 'Mapping your optimization pathways...', 'Building your personalized protocol...', 'Generating lab recommendations...', 'Finalizing your report...']
      let i = 0
      const interval = setInterval(() => {
        i = (i + 1) % msgs.length
        setLoadingMsg(msgs[i])
      }, 1400)
      return () => clearInterval(interval)
    }
  }, [phase])

  const goNext = async () => {
    if (currentQ < total - 1) {
      setDirection(1)
      setCurrentQ((c) => c + 1)
    } else {
      setPhase('loading')
      try {
        const result = await generateHealthAssessment(assessmentAnswers, ASSESSMENT_QUESTIONS, profile)
        setResults(result)
        setAssessmentResult(result)
        if (user) {
          await supabase.from('assessments').insert({
            user_id: user.id,
            answers: assessmentAnswers,
            result,
            completed_at: new Date().toISOString(),
          })
        }
        setPhase('results')
      } catch (err) {
        console.error(err)
        setPhase('results')
      }
    }
  }

  const goPrev = () => {
    if (currentQ > 0) {
      setDirection(-1)
      setCurrentQ((c) => c - 1)
    }
  }

  const handleAnswer = (value) => setAssessmentAnswer(q.id, value)
  const handleCheckbox = (option) => {
    const current = assessmentAnswers[q.id] || []
    const updated = current.includes(option) ? current.filter((v) => v !== option) : [...current, option]
    setAssessmentAnswer(q.id, updated)
  }

  const currentAnswer = assessmentAnswers[q?.id]
  const hasAnswer = currentAnswer !== undefined && currentAnswer !== '' && (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : true)

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  }

  if (phase === 'loading') return <LoadingScreen message={loadingMsg} />
  if (phase === 'results' && results) return <ResultsScreen results={results} router={router} user={user} />

  return (
    <div className="assess-page">
      <div className="bg-grid" />
      <div className="assess-glow" />
      <header className="assess-header">
        <button className="assess-back" onClick={() => router.back()} aria-label="Go back">
          <ChevronLeft size={20} />
        </button>
        <div className="assess-header-center">
          <span className="assess-section-label" style={{ color: sectionColor }}>{q.section}</span>
          <span className="assess-counter">{currentQ + 1} / {total}</span>
        </div>
        <div style={{ width: 36 }} />
      </header>
      <div className="assess-progress-wrap">
        <div className="assess-progress-bar">
          <motion.div className="assess-progress-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} style={{ background: `linear-gradient(90deg, ${sectionColor}, var(--blue))` }} />
        </div>
      </div>
      <div className="assess-body">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={currentQ} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28, ease: 'easeInOut' }} className="assess-card" ref={cardRef}>
            <p className="assess-q-text">{q.question}</p>
            {q.type === 'radio' && (
              <div className="assess-options">
                {q.options.map((opt) => (
                  <button key={opt} className={`assess-option ${currentAnswer === opt ? 'selected' : ''}`} onClick={() => handleAnswer(opt)}>
                    <span className="assess-option-radio" />
                    <span className="assess-option-text">{opt}</span>
                  </button>
                ))}
              </div>
            )}
            {q.type === 'checkbox' && (
              <div className="assess-options">
                <p className="assess-hint">Select all that apply</p>
                {q.options.map((opt) => {
                  const checked = (assessmentAnswers[q.id] || []).includes(opt)
                  return (
                    <button key={opt} className={`assess-option checkbox ${checked ? 'selected' : ''}`} onClick={() => handleCheckbox(opt)}>
                      <span className="assess-option-check">{checked && <CheckCircle2 size={14} />}</span>
                      <span className="assess-option-text">{opt}</span>
                    </button>
                  )
                })}
              </div>
            )}
            {q.type === 'slider' && (
              <div className="assess-slider-wrap">
                <div className="assess-slider-value" style={{ color: sectionColor }}>{currentAnswer || 5}</div>
                <input type="range" min={q.min} max={q.max} value={currentAnswer || 5} onChange={(e) => handleAnswer(parseInt(e.target.value))} className="assess-slider" />
                <div className="assess-slider-labels">{q.labels.map((l) => <span key={l}>{l}</span>)}</div>
              </div>
            )}
            {q.type === 'text' && (
              <textarea className="assess-textarea" placeholder={q.placeholder} value={currentAnswer || ''} onChange={(e) => handleAnswer(e.target.value)} rows={5} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="assess-nav">
        <button className="assess-nav-prev" onClick={goPrev} disabled={currentQ === 0} aria-label="Previous question">
          <ChevronLeft size={20} />
        </button>
        <button className="assess-nav-next" onClick={goNext} disabled={q.type !== 'text' && q.type !== 'slider' && !hasAnswer}>
          {currentQ === total - 1 ? <>Get My Results <Zap size={16} /></> : <>Next <ChevronRight size={16} /></>}
        </button>
      </div>
    </div>
  )
}

function LoadingScreen({ message }) {
  return (
    <div className="loading-screen">
      <div className="bg-grid" />
      <div className="loading-glow" />
      <div className="loading-content">
        <div className="loading-logo">W<span>UVO</span></div>
        <div className="loading-spinner-wrap">
          <div className="loading-ring" />
          <Activity size={28} className="loading-icon" />
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={message} className="loading-msg" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>{message}</motion.p>
        </AnimatePresence>
        <p className="loading-sub">Our AI is building your personalized protocol</p>
      </div>
    </div>
  )
}

const STATUS_COLORS = { Critical: 'var(--red)', 'Needs Work': 'var(--gold)', Good: 'var(--blue-light)', Optimized: 'var(--green)' }
const URGENCY_COLORS = { Essential: 'var(--red)', Priority: 'var(--gold)', Recommended: 'var(--blue)' }

function ResultsScreen({ results, router, user }) {
  const scoreColor = results.score >= 80 ? 'var(--green)' : results.score >= 60 ? 'var(--blue-light)' : results.score >= 45 ? 'var(--gold)' : 'var(--red)'
  return (
    <div className="results-page">
      <div className="bg-grid" />
      <div className="results-glow" style={{ background: `radial-gradient(circle, ${scoreColor}14, transparent 60%)` }} />
      <header className="results-header">
        <div className="results-logo">W<span>UVO</span></div>
        <p className="results-header-sub">Your Health Assessment Results</p>
      </header>
      <div className="results-body">
        <motion.div className="score-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} style={{ borderColor: scoreColor + '40' }}>
          <div className="score-pulse" style={{ background: scoreColor + '0a' }} />
          <p className="score-label">Health Optimization Score</p>
          <div className="score-number" style={{ color: scoreColor }}>{results.score}<span>/100</span></div>
          <div className="score-badge" style={{ background: scoreColor + '20', color: scoreColor }}>{results.scoreLabel}</div>
          <p className="score-insight">{results.scoreInsight}</p>
        </motion.div>
        <section className="results-section">
          <h2 className="results-section-title"><Activity size={18} /> Priority Areas</h2>
          <div className="priority-grid">
            {results.priorityAreas?.map((area, i) => (
              <motion.div key={area.area} className="priority-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} style={{ borderColor: STATUS_COLORS[area.status] + '30' }}>
                <div className="priority-header">
                  <span className="priority-area">{area.area}</span>
                  <span className="priority-status" style={{ color: STATUS_COLORS[area.status], background: STATUS_COLORS[area.status] + '18' }}>{area.status}</span>
                </div>
                <p className="priority-insight">{area.insight}</p>
              </motion.div>
            ))}
          </div>
        </section>
        <section className="results-section">
          <h2 className="results-section-title"><FlaskConical size={18} /> Recommended Lab Tests</h2>
          {results.labRecommendations?.map((lab, i) => (
            <motion.div key={lab.panel} className="lab-card" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
              <div className="lab-header">
                <span className="lab-panel">{lab.panel}</span>
                <span className="lab-urgency" style={{ color: URGENCY_COLORS[lab.urgency], background: URGENCY_COLORS[lab.urgency] + '18' }}>{lab.urgency}</span>
              </div>
              <p className="lab-reason">{lab.reason}</p>
              <div className="lab-tests">{lab.tests?.map((t) => <span key={t} className="lab-test-tag">{t}</span>)}</div>
            </motion.div>
          ))}
        </section>
        <section className="results-section">
          <h2 className="results-section-title"><Target size={18} /> Your Personalized Protocol</h2>
          {results.protocols?.map((protocol, i) => (
            <motion.div key={protocol.title} className="protocol-card" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 + 0.2 }}>
              <div className="protocol-meta">
                <span className="protocol-category">{protocol.category}</span>
                <span className="protocol-timeline">{protocol.timeline}</span>
              </div>
              <h3 className="protocol-title">{protocol.title}</h3>
              <p className="protocol-desc">{protocol.description}</p>
            </motion.div>
          ))}
        </section>
        <motion.div className="results-cta" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Calendar size={32} className="cta-icon" />
          <h2 className="cta-title">{results.nextStep?.title}</h2>
          <p className="cta-desc">{results.nextStep?.description}</p>
          <button className="cta-btn" onClick={() => router.push(user ? '/dashboard' : '/auth')}>
            {results.nextStep?.cta || 'Go to Dashboard'} <ArrowRight size={16} />
          </button>
          {!user && <p className="cta-note">Create a free account to save your results and access your dashboard</p>}
        </motion.div>
        <div style={{ height: 'calc(40px + var(--safe-bottom))' }} />
      </div>
    </div>
  )
}
