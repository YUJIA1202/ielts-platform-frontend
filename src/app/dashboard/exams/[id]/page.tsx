'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { ExamSession, Question } from '@/types'

function countWords(text: string | null) {
  return text?.trim() ? text.trim().split(/\s+/).length : 0
}

function AnswerSection({ question, answer }: { question: Question; answer: string | null }) {
  return (
    <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <span style={{ color: '#2563eb', fontSize: 12, fontWeight: 800 }}>{question.task}</span>
        <span style={{ color: '#94a3b8', fontSize: 12 }}>{countWords(answer)} 词</span>
      </div>
      <div style={{ color: '#1e3a5f', lineHeight: 1.75, fontWeight: 600, marginBottom: 18 }}>{question.content}</div>
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 18, whiteSpace: 'pre-wrap', lineHeight: 1.85, color: '#334155' }}>
        {answer || '本部分没有作答内容。'}
      </div>
    </section>
  )
}

export default function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [item, setItem] = useState<ExamSession | null>(null)

  useEffect(() => {
    api.get(`/exam-sessions/${id}`).then(response => setItem(response.data))
  }, [id])

  if (!item) return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>加载考试记录...</div>

  const submitCorrection = () => {
    sessionStorage.setItem('examSubmit', JSON.stringify({
      questionId: item.primaryQuestionId,
      questionText: item.primaryQuestion.content,
      answer: item.primaryAnswer || '',
      examSessionId: item.id,
    }))
    router.push('/dashboard/submit?fromExam=1')
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto 60px' }}>
      <div style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: '#fff', borderRadius: 18, padding: '24px 26px', marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, opacity: .72, marginBottom: 6 }}>考试记录 #{item.id}</div>
            <h1 style={{ fontSize: 24, margin: 0 }}>{item.mode === 'MIXED' ? '混合写作模考' : `${item.primaryQuestion.task} 模考`}</h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={submitCorrection} style={{ border: 0, background: '#fff', color: '#1d4ed8', borderRadius: 10, padding: '10px 18px', fontWeight: 800, cursor: 'pointer' }}>提交批改</button>
            <button onClick={() => router.push('/dashboard/exams')} style={{ border: '1px solid rgba(255,255,255,.4)', background: 'transparent', color: '#fff', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>全部记录</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 18, fontSize: 13, opacity: .85, flexWrap: 'wrap' }}>
          <span>状态：{item.status === 'COMPLETED' ? '已交卷' : '未完成'}</span>
          <span>用时：{Math.floor(item.elapsedSeconds / 60)} 分 {item.elapsedSeconds % 60} 秒</span>
          <span>开始：{new Date(item.startedAt).toLocaleString('zh-CN')}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <AnswerSection question={item.primaryQuestion} answer={item.primaryAnswer} />
        {item.secondaryQuestion && <AnswerSection question={item.secondaryQuestion} answer={item.secondaryAnswer} />}
      </div>
    </div>
  )
}
