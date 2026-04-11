'use client'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { Question } from '@/types'
import '@/app/dashboard/exam/exam.css'

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function ExamRoomContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const questionId = searchParams.get('questionId')
  const mixId = searchParams.get('mixId')
  const isMix = !!mixId

  const [mainQ, setMainQ] = useState<Question | null>(null)
  const [subQ, setSubQ] = useState<Question | null>(null)
  const [ready, setReady] = useState(false)
  const [mainAnswer, setMainAnswer] = useState('')
  const [subAnswer, setSubAnswer] = useState('')
  const [currentPart, setCurrentPart] = useState<1 | 2>(1)
  const [timeLeft, setTimeLeft] = useState(0)
  const [finished, setFinished] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeLeftRef = useRef(0)

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const doFinish = useCallback(() => {
    stopTimer()
    document.body.style.overflow = ''
    setFinished(true)
  }, [stopTimer])

  const doExit = useCallback(() => {
    stopTimer()
    document.body.style.overflow = ''
    router.push('/dashboard/exam')
  }, [stopTimer, router])

  useEffect(() => {
    if (!questionId) { router.push('/dashboard/exam'); return }
    const fetchAll = async () => {
      try {
        const r1 = await api.get(`/questions/${questionId}`)
        setMainQ(r1.data)
        if (mixId) {
          const r2 = await api.get(`/questions/${mixId}`)
          setSubQ(r2.data)
        }
        setReady(true)
      } catch (err) {
        console.error(err)
        router.push('/dashboard/exam')
      }
    }
    fetchAll()
  }, [questionId, mixId, router])

  useEffect(() => {
    if (!ready || !mainQ) return
    const duration = isMix ? 60 * 60 : mainQ.task === 'TASK2' ? 40 * 60 : 20 * 60
    document.body.style.overflow = 'hidden'
    timeLeftRef.current = duration
    setTimeout(() => setTimeLeft(duration), 0)
    intervalRef.current = setInterval(() => {
      timeLeftRef.current -= 1
      setTimeLeft(timeLeftRef.current)
      if (timeLeftRef.current <= 0) {
        stopTimer()
        document.body.style.overflow = ''
        setFinished(true)
      }
    }, 1000)
    return () => {
      stopTimer()
      document.body.style.overflow = ''
    }
  }, [ready, mainQ, isMix, stopTimer])

  useEffect(() => {
    if (!ready) return
    window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', doExit)
    return () => window.removeEventListener('popstate', doExit)
  }, [ready, doExit])

  if (!ready || !mainQ) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94a3b8', fontSize: '16px' }}>
        加载中...
      </div>
    )
  }

  if (finished) {
    const wc1 = mainAnswer.trim() ? mainAnswer.trim().split(/\s+/).length : 0
    const wc2 = subAnswer.trim() ? subAnswer.trim().split(/\s+/).length : 0
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', padding: '0 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
        <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e3a5f', marginBottom: '8px' }}>作答完成！</div>
        <div style={{ fontSize: '15px', color: '#64748b', marginBottom: '32px' }}>
          {isMix ? `Task 2: ${wc1} 词  |  Task 1: ${wc2} 词` : `共写了 ${wc1} 词`}
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={() => router.push('/dashboard/submit')}
            style={{ padding: '12px 28px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
            提交批改
          </button>
          <button onClick={() => router.push('/dashboard/exam')}
            style={{ padding: '12px 28px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '15px', cursor: 'pointer' }}>
            再来一题
          </button>
        </div>
      </div>
    )
  }

  const currentQ = isMix && currentPart === 2 ? subQ : mainQ
  const currentAnswer = isMix && currentPart === 2 ? subAnswer : mainAnswer
  const setCurrentAnswer = (v: string) => {
    if (isMix && currentPart === 2) setSubAnswer(v)
    else setMainAnswer(v)
  }
  const totalTime = isMix ? 60 * 60 : mainQ.task === 'TASK2' ? 40 * 60 : 20 * 60
  const isUrgent = timeLeft < 300
  const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0
  const minWords = currentQ?.task === 'TASK2' ? 250 : 150

  return (
    <div className="exam-root">
      <div className="exam-topbar">
        <div className="exam-topbar-left">
          <span className="exam-topbar-title">
            {isMix
              ? `混合模考 — ${currentPart === 1 ? 'Writing Task 2' : 'Writing Task 1'}`
              : currentQ?.task === 'TASK2' ? 'Writing Task 2' : 'Writing Task 1'}
          </span>
          {mainQ.source && <span className="exam-topbar-subtitle">{mainQ.source}</span>}
        </div>
        <div className="exam-topbar-center">
          <span className={`exam-timer${isUrgent ? ' urgent' : ''}`}>{formatTime(timeLeft)}</span>
          <div className="exam-progress-bar">
            <div className={`exam-progress-fill${isUrgent ? ' urgent' : ''}`}
              style={{ width: `${totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="exam-topbar-right">
          {isMix && (
            <div className="exam-part-switch">
              {[1, 2].map((p) => (
                <div key={p} className={`exam-part-btn${currentPart === p ? ' active' : ''}`}
                  onClick={() => setCurrentPart(p as 1 | 2)}>Part {p}</div>
              ))}
            </div>
          )}
          <button className="exam-btn-submit" onClick={doFinish}>交卷</button>
          <button className="exam-btn-exit" onClick={doExit}>保存退出</button>
        </div>
      </div>

      <div className="exam-subbar">
        {currentQ?.task === 'TASK2'
          ? 'You should spend about 40 minutes on this task. Write at least 250 words.'
          : 'You should spend about 20 minutes on this task. Write at least 150 words.'}
      </div>

      <div className="exam-body">
        <div className="exam-question-panel">
          <div className="exam-question-scroll">
            <div className="exam-task-badge">
              {currentQ?.task === 'TASK2' ? 'WRITING TASK 2' : 'WRITING TASK 1'}
            </div>
            <div className="exam-question-box">
              <div className="exam-question-text">{currentQ?.content}</div>
            </div>
            {currentQ?.task === 'TASK2' && (
              <div className="exam-question-instruction">
                Give reasons for your answer and include any relevant examples from your own knowledge or experience.
              </div>
            )}
            <div className="exam-question-hint">Write at least {minWords} words.</div>
            {currentQ?.task === 'TASK1' && (
              <div className="exam-chart-placeholder">
                {'imageUrl' in (currentQ ?? {}) ? (
                <img
src={(currentQ as Question & { imageUrl?: string }).imageUrl}
                    alt="题目图表"
                    style={{ maxWidth: '100%', borderRadius: 8 }}
                  />
                ) : (
                  <span>暂无配图</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="exam-answer-panel">
          <textarea className="exam-textarea" value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            autoFocus spellCheck={false} placeholder="在此处输入你的作文..." />
          <div className="exam-wordcount-bar">
            <span className="exam-wordcount-label">
              Word count: <strong className={`exam-wordcount-num${wordCount >= minWords ? ' reached' : ''}`}>{wordCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {isMix && (
        <div className="exam-nav-bar">
          {[1, 2].map((p) => (
            <div key={p} className={`exam-nav-part${currentPart === p ? ' active' : ''}`}
              onClick={() => setCurrentPart(p as 1 | 2)}>
              {p === 1 ? 'Part 1 · Task 2 大作文' : 'Part 2 · Task 1 小作文'}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ExamRoomPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94a3b8' }}>
        加载中...
      </div>
    }>
      <ExamRoomContent />
    </Suspense>
  )
}