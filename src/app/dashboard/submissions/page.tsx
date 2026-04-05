'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLayoutStore } from '@/store/layoutStore'
import api from '@/lib/api'

type SubmissionStatus = 'PENDING' | 'REVIEWED'

interface Submission {
  id: number
  createdAt: string
  updatedAt: string
  customPrompt: string | null
  imageUrl: string | null
  content: string | null
  wordFileUrl: string | null
  status: SubmissionStatus
  score: number | null
  feedbackUrl: string | null
  question: { content: string } | null
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function scoreColor(n: number) {
  if (n >= 7.5) return '#22c55e'
  if (n >= 6.5) return '#3b82f6'
  if (n >= 6.0) return '#f59e0b'
  return '#ef4444'
}

function countWords(text: string | null) {
  if (!text) return 0
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

export default function SubmissionsPage() {
  const router = useRouter()
  const { collapsed } = useLayoutStore()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | SubmissionStatus>('ALL')

  useEffect(() => {
    api.get('/submissions/my')
      .then(res => setSubmissions(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const list = submissions.filter(s => filter === 'ALL' || s.status === filter)
  const pending = submissions.filter(s => s.status === 'PENDING').length
  const reviewed = submissions.filter(s => s.status === 'REVIEWED').length

  return (
    <div style={{ maxWidth: collapsed ? 920 : '100%', margin: collapsed ? '0 20% 0 5%' : '0', transition: 'all .2s ease' }}>

      {/* 页头 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>我的批改</h1>
          <p style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>查看所有提交记录及批改结果</p>
        </div>
        <a href="/dashboard/submit" style={{ padding: '9px 22px', borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none', boxShadow: '0 3px 10px rgba(59,130,246,.30)', display: 'inline-block' }}>
          + 提交新作文
        </a>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: '累计提交', value: submissions.length, color: '#64748b', icon: '📝' },
          { label: '批改中', value: pending, color: '#f59e0b', icon: '⏳' },
          { label: '已批改', value: reviewed, color: '#22c55e', icon: '✅' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ flex: 1, minWidth: 120, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 26 }}>{icon}</span>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 筛选 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {([
          { val: 'ALL' as const, label: '全部' },
          { val: 'PENDING' as const, label: '⏳ 批改中' },
          { val: 'REVIEWED' as const, label: '✅ 已批改' },
        ]).map(({ val, label }) => (
          <button key={val} onClick={() => setFilter(val)} style={{ padding: '6px 18px', borderRadius: 20, fontSize: 13, cursor: 'pointer', border: filter === val ? '1.5px solid #3b82f6' : '1.5px solid #e2e8f0', background: filter === val ? '#eff6ff' : '#f8fafc', color: filter === val ? '#2563eb' : '#64748b', fontWeight: filter === val ? 600 : 400, transition: 'all .15s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* 列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>加载中...</div>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 15 }}>暂无提交记录</div>
          <a href="/dashboard/submit" style={{ display: 'inline-block', marginTop: 16, fontSize: 14, color: '#3b82f6', textDecoration: 'none' }}>去提交第一篇作文 →</a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map(s => {
            const questionText = s.question?.content || s.customPrompt || ''
            const wordCount = countWords(s.content)
            const isFile = !!s.wordFileUrl
            return (
              <div
                key={s.id}
                onClick={() => router.push(`/dashboard/submissions/${s.id}`)}
                style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '18px 22px', cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'flex-start', transition: 'border-color .15s, box-shadow .15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,.10)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, fontSize: 22, flexShrink: 0, background: s.status === 'PENDING' ? '#fef9ec' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                  {s.status === 'PENDING' ? '⏳' : '✅'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    {s.imageUrl && (
                      <span style={{ fontSize: 11, background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>🖼️ 含图片</span>
                    )}
                    <span style={{ fontSize: 11, background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 7px' }}>
                      {isFile ? '📄 Word文档' : `✏️ ${wordCount} 词`}
                    </span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{fmt(s.createdAt)} 提交</span>
                  </div>

                  <p style={{ margin: '0 0 6px', fontSize: 14, color: '#1e293b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {questionText || '（题目以图片形式提交）'}
                  </p>

                  {s.content && (
                    <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.content}
                    </p>
                  )}

                  {s.status === 'REVIEWED' && s.score !== null && s.score !== undefined && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 12px' }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>估分</span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: scoreColor(s.score) }}>{s.score.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ color: '#cbd5e1', fontSize: 20, flexShrink: 0, marginTop: 8 }}>›</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}