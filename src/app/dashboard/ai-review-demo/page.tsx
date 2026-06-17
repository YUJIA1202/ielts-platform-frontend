'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

type TaskType = 'TASK1' | 'TASK2'

export default function AiReviewPage() {
  const router = useRouter()
  const [task, setTask] = useState<TaskType>('TASK2')
  const [subtype, setSubtype] = useState('')
  const [topic, setTopic] = useState('')
  const [questionText, setQuestionText] = useState('')
  const [essayText, setEssayText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0
  const canSubmit = essayText.trim().length > 40

  async function submitReview() {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const res = await api.post('/ai-reviews/requests', {
        task,
        subtype: subtype || null,
        topic: topic || null,
        questionText: questionText || null,
        essayText,
      })
      router.push(`/dashboard/ai-review-demo/${res.data.review.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'AI 批改提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', paddingBottom: 48 }}>
      <section style={{
        border: '1px solid #dbeafe',
        borderRadius: 24,
        padding: 28,
        background: 'radial-gradient(circle at 82% 16%, rgba(245,158,11,.18), transparent 28%), linear-gradient(135deg, #f8fbff, #eef6ff)',
        boxShadow: '0 18px 45px rgba(30,64,175,.08)',
        marginBottom: 22,
      }}>
        <div style={{ color: '#2563eb', fontSize: 13, fontWeight: 900, letterSpacing: .5 }}>AI WRITING REVIEW</div>
        <h1 style={{ margin: '10px 0 10px', color: '#17345f', fontSize: 34, lineHeight: 1.15, fontWeight: 900 }}>
          AI 自助批改
        </h1>
        <p style={{ maxWidth: 820, color: '#526b8f', fontSize: 15, lineHeight: 1.8, margin: 0 }}>
          这是独立于“提交人工批改”的 AI 页面。系统会先清洗、分段、分句和识别题型，再检索 RAG 材料，最后生成结构化批改结果。
          当前如果后端没有配置模型 Key，会使用本地占位批改来验证完整链路。
        </p>
      </section>

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, .9fr) minmax(0, 1.1fr)',
        gap: 18,
      }}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>题目信息</h2>

          <label style={labelStyle}>任务类型</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {(['TASK2', 'TASK1'] as const).map(item => (
              <button
                key={item}
                onClick={() => setTask(item)}
                style={{
                  border: `1.5px solid ${task === item ? '#3b82f6' : '#dbeafe'}`,
                  background: task === item ? '#eff6ff' : '#fff',
                  color: task === item ? '#1d4ed8' : '#526b8f',
                  borderRadius: 14,
                  padding: '12px 14px',
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <label style={labelStyle}>题型 / 话题</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <input
              value={subtype}
              onChange={e => setSubtype(e.target.value)}
              placeholder="如 discussion / opinion"
              style={inputStyle}
            />
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="如 education / society"
              style={inputStyle}
            />
          </div>

          <label style={labelStyle}>题目</label>
          <textarea
            value={questionText}
            onChange={e => setQuestionText(e.target.value)}
            placeholder="粘贴题目内容。如果不填，系统也可以只根据作文做基础诊断。"
            style={{ ...textareaStyle, minHeight: 180 }}
          />

          <div style={{
            marginTop: 16,
            borderRadius: 16,
            background: '#f8fbff',
            border: '1px solid #dbeafe',
            padding: 14,
            color: '#526b8f',
            lineHeight: 1.7,
            fontSize: 13,
          }}>
            <b style={{ color: '#17345f' }}>这一页不会创建普通 Submission。</b>
            <br />
            它会创建 AI 专用的 `AiReviewRequest`，这样 AI 批改和人工提交批改不会混在一起。
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
            <h2 style={titleStyle}>作文内容</h2>
            <span style={{
              borderRadius: 999,
              background: '#eff6ff',
              color: '#1d4ed8',
              padding: '6px 10px',
              fontSize: 13,
              fontWeight: 900,
            }}>
              {wordCount} words
            </span>
          </div>

          <textarea
            value={essayText}
            onChange={e => setEssayText(e.target.value)}
            placeholder="在这里粘贴你的 IELTS Writing 作文。"
            style={{ ...textareaStyle, minHeight: 420, fontFamily: 'Georgia, Times New Roman, serif', fontSize: 16, lineHeight: 1.8 }}
          />

          {error && (
            <div style={{ marginTop: 14, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 12 }}>
              {error}
            </div>
          )}

          <button
            onClick={submitReview}
            disabled={!canSubmit || submitting}
            style={{
              marginTop: 16,
              width: '100%',
              border: 0,
              borderRadius: 16,
              padding: '15px 18px',
              background: !canSubmit || submitting ? '#cbd5e1' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff',
              fontWeight: 900,
              fontSize: 16,
              cursor: !canSubmit || submitting ? 'not-allowed' : 'pointer',
              boxShadow: !canSubmit || submitting ? 'none' : '0 12px 24px rgba(37, 99, 235, .2)',
            }}
          >
            {submitting ? '正在批改...' : '开始 AI 批改'}
          </button>
        </div>
      </section>
    </main>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #dbeafe',
  borderRadius: 20,
  padding: 22,
  boxShadow: '0 10px 30px rgba(30,64,175,.06)',
}

const titleStyle: React.CSSProperties = {
  margin: '0 0 16px',
  color: '#17345f',
  fontSize: 21,
  fontWeight: 900,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#17345f',
  fontSize: 14,
  fontWeight: 800,
  marginBottom: 8,
}

const inputStyle: React.CSSProperties = {
  border: '1.5px solid #dbeafe',
  borderRadius: 13,
  padding: '12px 13px',
  outline: 'none',
  color: '#17345f',
  fontSize: 14,
  background: '#f8fbff',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1.5px solid #dbeafe',
  borderRadius: 16,
  padding: 15,
  outline: 'none',
  color: '#17345f',
  fontSize: 14,
  lineHeight: 1.7,
  background: '#f8fbff',
  resize: 'vertical',
}
