'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'

interface AiScore {
  id: number
  dimension: string
  score: number | null
  rationale: string
  evidence: string | null
}

interface AiFinding {
  id: number
  category: string
  severity: string
  title: string
  explanation: string
  suggestion: string | null
}

interface AiAnnotation {
  id: number
  sentenceIndex: number
  originalText: string
  issueType: string
  subtype: string | null
  severity: string
  explanation: string
  suggestion: string | null
  rubricDimension: string | null
}

interface AiRewrite {
  id: number
  sentenceIndex: number | null
  originalText: string
  rewrittenText: string
  reason: string | null
}

interface AiReview {
  id: number
  overallBand: number | null
  summary: string
  priorityAdvice: string | null
  provider: string
  model: string
  createdAt: string
  request: {
    questionText: string | null
    essayText: string
    task: 'TASK1' | 'TASK2' | null
    subtype: string | null
  }
  scores: AiScore[]
  findings: AiFinding[]
  annotations: AiAnnotation[]
  rewrites: AiRewrite[]
}

export default function AiReviewDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [review, setReview] = useState<AiReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSentence, setActiveSentence] = useState<number | null>(null)
  const [tab, setTab] = useState<'annotations' | 'rewrites'>('annotations')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await api.get(`/ai-reviews/${params.id}`)
        setReview(res.data)
        setActiveSentence(res.data.annotations?.[0]?.sentenceIndex ?? null)
      } catch (err: any) {
        setError(err.response?.data?.error || '加载 AI 批改结果失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  const sentenceRows = useMemo(() => {
    if (!review) return []
    const annotationsBySentence = new Map<number, AiAnnotation[]>()
    for (const annotation of review.annotations) {
      const list = annotationsBySentence.get(annotation.sentenceIndex) || []
      list.push(annotation)
      annotationsBySentence.set(annotation.sentenceIndex, list)
    }

    const rewritesBySentence = new Map<number, AiRewrite[]>()
    for (const rewrite of review.rewrites) {
      if (rewrite.sentenceIndex == null) continue
      const list = rewritesBySentence.get(rewrite.sentenceIndex) || []
      list.push(rewrite)
      rewritesBySentence.set(rewrite.sentenceIndex, list)
    }

    const indexes = new Set<number>()
    review.annotations.forEach(item => indexes.add(item.sentenceIndex))
    review.rewrites.forEach(item => item.sentenceIndex && indexes.add(item.sentenceIndex))

    return Array.from(indexes).sort((a, b) => a - b).map(index => ({
      index,
      text: annotationsBySentence.get(index)?.[0]?.originalText || rewritesBySentence.get(index)?.[0]?.originalText || '',
      annotations: annotationsBySentence.get(index) || [],
      rewrites: rewritesBySentence.get(index) || [],
    }))
  }, [review])

  const activeRow = sentenceRows.find(row => row.index === activeSentence) || sentenceRows[0]

  if (loading) {
    return <div style={{ padding: 40, color: '#64748b' }}>正在加载 AI 批改结果...</div>
  }

  if (error || !review) {
    return (
      <div style={{ maxWidth: 720, margin: '60px auto', padding: 24, border: '1px solid #fecaca', borderRadius: 18, background: '#fef2f2', color: '#991b1b' }}>
        {error || 'AI 批改结果不存在'}
      </div>
    )
  }

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: 48 }}>
      <section style={{
        border: '1px solid #dbeafe',
        borderRadius: 24,
        padding: 26,
        background: 'radial-gradient(circle at 86% 14%, rgba(245,158,11,.18), transparent 26%), linear-gradient(135deg, #f8fbff, #eef6ff)',
        boxShadow: '0 18px 45px rgba(30,64,175,.08)',
        marginBottom: 18,
      }}>
        <button
          onClick={() => router.push('/dashboard/ai-review-demo')}
          style={{ border: 0, background: 'transparent', color: '#2563eb', fontWeight: 800, cursor: 'pointer', padding: 0, marginBottom: 12 }}
        >
          ← 返回 AI 批改
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, alignItems: 'start' }}>
          <div>
            <div style={{ color: '#2563eb', fontSize: 13, fontWeight: 900 }}>AI REVIEW RESULT</div>
            <h1 style={{ margin: '8px 0 10px', color: '#17345f', fontSize: 32, lineHeight: 1.15, fontWeight: 900 }}>
              AI 批改详情
            </h1>
            <p style={{ color: '#526b8f', fontSize: 15, lineHeight: 1.75, maxWidth: 820, margin: 0 }}>{review.summary}</p>
            {review.priorityAdvice && (
              <p style={{ color: '#1d4ed8', fontSize: 14, lineHeight: 1.7, maxWidth: 820, margin: '12px 0 0', fontWeight: 700 }}>
                优先建议：{review.priorityAdvice}
              </p>
            )}
          </div>
          <div style={{
            minWidth: 150,
            borderRadius: 20,
            background: '#fff',
            border: '1px solid #dbeafe',
            padding: '18px 20px',
            textAlign: 'center',
          }}>
            <div style={{ color: '#7d91af', fontSize: 12, fontWeight: 900 }}>OVERALL</div>
            <div style={{ color: '#1d4ed8', fontSize: 40, fontWeight: 900, marginTop: 4 }}>
              {review.overallBand ?? '-'}
            </div>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 18 }}>
        {review.scores.map(score => (
          <div key={score.id} style={scoreCardStyle}>
            <div style={{ color: '#7d91af', fontSize: 11, fontWeight: 900 }}>{dimensionLabel(score.dimension)}</div>
            <div style={{ color: '#1d4ed8', fontSize: 26, fontWeight: 900, margin: '4px 0 6px' }}>{score.score ?? '-'}</div>
            <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.55 }}>{score.rationale}</div>
          </div>
        ))}
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitle}>整体问题</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {review.findings.map(finding => (
            <div key={finding.id} style={{ border: '1px solid #dbeafe', borderRadius: 16, padding: 15, background: '#fff' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <Badge>{finding.category}</Badge>
                <Badge tone={finding.severity === 'HIGH' ? 'red' : finding.severity === 'LOW' ? 'green' : 'orange'}>{finding.severity}</Badge>
              </div>
              <b style={{ color: '#17345f' }}>{finding.title}</b>
              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.65 }}>{finding.explanation}</p>
              {finding.suggestion && <p style={{ color: '#1d4ed8', fontSize: 13, lineHeight: 1.65, fontWeight: 700 }}>建议：{finding.suggestion}</p>}
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 18, marginTop: 18, alignItems: 'start' }}>
        <div style={cardStyle}>
          <h2 style={sectionTitle}>逐句定位</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {sentenceRows.map(row => (
              <button
                key={row.index}
                onClick={() => setActiveSentence(row.index)}
                style={{
                  position: 'relative',
                  border: `1.5px solid ${activeSentence === row.index ? '#60a5fa' : '#dbeafe'}`,
                  background: activeSentence === row.index ? 'linear-gradient(90deg, #eff6ff, #fff)' : '#fff',
                  borderRadius: 15,
                  padding: '13px 14px 13px 48px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#233954',
                  fontFamily: 'Georgia, Times New Roman, serif',
                  fontSize: 16,
                  lineHeight: 1.8,
                }}
              >
                <span style={{
                  position: 'absolute',
                  left: 13,
                  top: 16,
                  width: 23,
                  height: 23,
                  borderRadius: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#eaf3ff',
                  color: '#1d4ed8',
                  fontFamily: 'Arial',
                  fontSize: 12,
                  fontWeight: 900,
                }}>
                  {row.index}
                </span>
                {row.text}
              </button>
            ))}
          </div>
        </div>

        <aside style={{ ...cardStyle, position: 'sticky', top: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, background: '#edf5ff', padding: 5, borderRadius: 14, marginBottom: 14 }}>
            <button onClick={() => setTab('annotations')} style={tabButtonStyle(tab === 'annotations')}>批注</button>
            <button onClick={() => setTab('rewrites')} style={tabButtonStyle(tab === 'rewrites')}>改写</button>
          </div>

          {!activeRow && <div style={{ color: '#64748b' }}>暂无逐句批注。</div>}

          {activeRow && tab === 'annotations' && (
            <>
              <h2 style={sectionTitle}>第 {activeRow.index} 句批注</h2>
              {activeRow.annotations.length === 0 && <p style={{ color: '#64748b' }}>这一句暂无批注。</p>}
              {activeRow.annotations.map(annotation => (
                <div key={annotation.id} style={{ border: '1px solid #dbeafe', background: '#fff', borderRadius: 15, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <Badge>{annotation.issueType}</Badge>
                    <Badge tone={annotation.severity === 'HIGH' ? 'red' : annotation.severity === 'LOW' ? 'green' : 'orange'}>{annotation.severity}</Badge>
                    {annotation.rubricDimension && <Badge tone="purple">{dimensionLabel(annotation.rubricDimension)}</Badge>}
                  </div>
                  <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.7 }}>{annotation.explanation}</p>
                  {annotation.suggestion && (
                    <div style={{ background: '#f8fbff', color: '#1d4ed8', borderRadius: 12, padding: 11, fontSize: 13, lineHeight: 1.6, fontWeight: 700 }}>
                      建议：{annotation.suggestion}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {activeRow && tab === 'rewrites' && (
            <>
              <h2 style={sectionTitle}>第 {activeRow.index} 句改写</h2>
              {activeRow.rewrites.length === 0 && <p style={{ color: '#64748b' }}>这一句暂无改写。</p>}
              {activeRow.rewrites.map(rewrite => (
                <div key={rewrite.id} style={{ border: '1px solid #bfdbfe', background: 'linear-gradient(180deg, #f8fbff, #fff)', borderRadius: 15, padding: 14, marginBottom: 10 }}>
                  <div style={{ color: '#1d4ed8', fontSize: 12, fontWeight: 900, marginBottom: 8 }}>REVISED SENTENCE</div>
                  <p style={{ color: '#17345f', fontFamily: 'Georgia, Times New Roman, serif', fontSize: 16, lineHeight: 1.8 }}>{rewrite.rewrittenText}</p>
                  {rewrite.reason && <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>{rewrite.reason}</p>}
                </div>
              ))}
            </>
          )}
        </aside>
      </section>
    </main>
  )
}

function dimensionLabel(value: string) {
  const map: Record<string, string> = {
    OVERALL: 'Overall',
    TASK_RESPONSE: 'TR',
    COHERENCE_COHESION: 'CC',
    LEXICAL_RESOURCE: 'LR',
    GRAMMAR_RANGE_ACCURACY: 'GRA',
  }
  return map[value] || value
}

function Badge({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'orange' | 'green' | 'red' | 'purple' }) {
  const colors = {
    blue: ['#eff6ff', '#1d4ed8', '#bfdbfe'],
    orange: ['#fff7ed', '#c2410c', '#fed7aa'],
    green: ['#f0fdf4', '#166534', '#bbf7d0'],
    red: ['#fff1f2', '#be123c', '#fecdd3'],
    purple: ['#f5f3ff', '#6d28d9', '#ddd6fe'],
  }[tone]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: 9,
      background: colors[0],
      color: colors[1],
      border: `1px solid ${colors[2]}`,
      padding: '5px 8px',
      fontSize: 12,
      fontWeight: 900,
    }}>
      {children}
    </span>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #dbeafe',
  borderRadius: 20,
  padding: 20,
  boxShadow: '0 10px 30px rgba(30,64,175,.06)',
}

const scoreCardStyle: React.CSSProperties = {
  ...cardStyle,
  padding: 15,
}

const sectionTitle: React.CSSProperties = {
  margin: '0 0 14px',
  color: '#17345f',
  fontSize: 20,
  fontWeight: 900,
}

function tabButtonStyle(active: boolean): React.CSSProperties {
  return {
    border: 0,
    borderRadius: 10,
    padding: '10px 8px',
    background: active ? '#fff' : 'transparent',
    color: active ? '#1d4ed8' : '#617593',
    boxShadow: active ? '0 5px 16px rgba(30,64,175,.12)' : 'none',
    fontWeight: 900,
    cursor: 'pointer',
  }
}
