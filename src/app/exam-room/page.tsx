'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { ExamSession, Question } from '@/types'
import '@/app/dashboard/exam/exam.css'

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const remainder = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainder}`
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function ExamRoomContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const questionId = Number(searchParams.get('questionId'))
  const mixId = Number(searchParams.get('mixId')) || null

  const [session, setSession] = useState<ExamSession | null>(null)
  const [primaryAnswer, setPrimaryAnswer] = useState('')
  const [secondaryAnswer, setSecondaryAnswer] = useState('')
  const [currentPart, setCurrentPart] = useState<1 | 2>(1)
  const [timeLeft, setTimeLeft] = useState(0)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const creatingRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef(Date.now())

  useEffect(() => {
    if (!questionId || creatingRef.current) return
    creatingRef.current = true
    api.post('/exam-sessions', {
      primaryQuestionId: questionId,
      secondaryQuestionId: mixId,
    }).then(response => {
      const next = response.data as ExamSession
      setSession(next)
      setPrimaryAnswer(next.primaryAnswer || '')
      setSecondaryAnswer(next.secondaryAnswer || '')
      setCurrentPart(next.currentPart === 2 ? 2 : 1)
      setTimeLeft(Math.max(0, next.durationSeconds - next.elapsedSeconds))
      startedAtRef.current = Date.now() - next.elapsedSeconds * 1000
    }).catch(() => router.replace('/dashboard/exam'))
  }, [questionId, mixId, router])

  useEffect(() => {
    if (!session) return
    document.body.style.overflow = 'hidden'
    intervalRef.current = setInterval(() => {
      setTimeLeft(previous => Math.max(0, previous - 1))
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.body.style.overflow = ''
    }
  }, [session])

  const elapsedSeconds = session
    ? Math.min(session.durationSeconds, Math.floor((Date.now() - startedAtRef.current) / 1000))
    : 0

  const saveSession = useCallback(async (status: ExamSession['status'] = 'IN_PROGRESS') => {
    if (!session) return null
    setSaving(true)
    try {
      const response = await api.patch(`/exam-sessions/${session.id}`, {
        primaryAnswer,
        secondaryAnswer,
        elapsedSeconds: Math.min(session.durationSeconds, Math.floor((Date.now() - startedAtRef.current) / 1000)),
        currentPart,
        status,
      })
      setSession(response.data)
      return response.data as ExamSession
    } finally {
      setSaving(false)
    }
  }, [session, primaryAnswer, secondaryAnswer, currentPart])

  useEffect(() => {
    if (!session) return
    const autosave = setInterval(() => {
      saveSession().catch(() => {})
    }, 10000)
    return () => clearInterval(autosave)
  }, [session, saveSession])

  const finishExam = useCallback(async () => {
    if (!session || submitting) return
    setSubmitting(true)
    try {
      const completed = await saveSession('COMPLETED')
      if (completed) router.replace(`/dashboard/exams/${completed.id}`)
    } catch {
      setSubmitting(false)
    }
  }, [session, submitting, saveSession, router])

  useEffect(() => {
    if (session && timeLeft === 0) finishExam()
  }, [session, timeLeft, finishExam])

  const exitExam = async () => {
    await saveSession()
    router.replace('/dashboard/exams')
  }

  if (!session) {
    return <div className="exam-loading">正在创建考试记录...</div>
  }

  const isMixed = session.mode === 'MIXED'
  const currentQuestion: Question = isMixed && currentPart === 2 && session.secondaryQuestion
    ? session.secondaryQuestion
    : session.primaryQuestion
  const currentAnswer = isMixed && currentPart === 2 ? secondaryAnswer : primaryAnswer
  const setCurrentAnswer = isMixed && currentPart === 2 ? setSecondaryAnswer : setPrimaryAnswer
  const minWords = currentQuestion.task === 'TASK2' ? 250 : 150
  const wordCount = countWords(currentAnswer)
  const isUrgent = timeLeft <= 300
  const progress = ((session.durationSeconds - timeLeft) / session.durationSeconds) * 100

  return (
    <div className="exam-root">
      <header className="exam-topbar">
        <div className="exam-topbar-left">
          <span className="exam-topbar-title">
            {isMixed ? `混合模考 · Part ${currentPart}` : currentQuestion.task === 'TASK2' ? 'Writing Task 2' : 'Writing Task 1'}
          </span>
          <span className="exam-save-state">{saving ? '保存中...' : '已自动保存'}</span>
        </div>
        <div className="exam-topbar-center">
          <span className={`exam-timer${isUrgent ? ' urgent' : ''}`}>{formatTime(timeLeft)}</span>
          <div className="exam-progress-bar">
            <div className={`exam-progress-fill${isUrgent ? ' urgent' : ''}`} style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="exam-topbar-right">
          {isMixed && (
            <div className="exam-part-switch">
              <button className={`exam-part-btn${currentPart === 1 ? ' active' : ''}`} onClick={() => setCurrentPart(1)}>Task 2</button>
              <button className={`exam-part-btn${currentPart === 2 ? ' active' : ''}`} onClick={() => setCurrentPart(2)}>Task 1</button>
            </div>
          )}
          <button className="exam-btn-submit" onClick={finishExam} disabled={submitting}>
            {submitting ? '交卷中...' : '交卷'}
          </button>
          <button className="exam-btn-exit" onClick={exitExam}>保存退出</button>
        </div>
      </header>

      <div className="exam-subbar">
        {currentQuestion.task === 'TASK2'
          ? 'You should spend about 40 minutes on this task. Write at least 250 words.'
          : 'You should spend about 20 minutes on this task. Write at least 150 words.'}
      </div>

      <main className="exam-body">
        <section className="exam-question-panel">
          <div className="exam-question-scroll">
            <div className="exam-task-badge">{currentQuestion.task === 'TASK2' ? 'WRITING TASK 2' : 'WRITING TASK 1'}</div>
            <div className="exam-question-box">
              <div className="exam-question-text">{currentQuestion.content}</div>
            </div>
            {currentQuestion.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="exam-question-image" src={currentQuestion.imageUrl} alt="题目图表" />
            )}
            <div className="exam-question-hint">Write at least {minWords} words.</div>
          </div>
        </section>

        <section className="exam-answer-panel">
          <textarea
            className="exam-textarea"
            value={currentAnswer}
            onChange={event => setCurrentAnswer(event.target.value)}
            spellCheck={false}
            placeholder="在这里输入你的作文..."
          />
          <div className="exam-wordcount-bar">
            <span className="exam-wordcount-label">
              Word count: <strong className={`exam-wordcount-num${wordCount >= minWords ? ' reached' : ''}`}>{wordCount}</strong>
            </span>
            <span className="exam-session-id">考试记录 #{session.id}</span>
          </div>
        </section>
      </main>
    </div>
  )
}

export default function ExamRoomPage() {
  return (
    <Suspense fallback={<div className="exam-loading">正在加载考试...</div>}>
      <ExamRoomContent />
    </Suspense>
  )
}
