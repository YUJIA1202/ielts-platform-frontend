'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
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
  reviewFileUrl: string | null
  taScore: number | null
  ccScore: number | null
  lrScore: number | null
  graScore: number | null
  overallScore: number | null
  adminComment: string | null
  question: { content: string } | null
  user: { username: string; phone: string } | null
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function countWords(text: string | null) {
  if (!text) return 0
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

export default function SubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const [s, setS] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    api.get(`/submissions/${id}`)
      .then(res => setS(res.data))
      .catch(err => {
        if (err.response?.status === 404 || err.response?.status === 403) setNotFound(true)
        else console.error(err)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
      <div style={{ fontSize: 15 }}>加载中...</div>
    </div>
  )

  if (notFound || !s) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
        <div style={{ fontSize: 15 }}>找不到该记录</div>
        <button onClick={() => router.push('/dashboard/submissions')} style={{ marginTop: 16, background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 14 }}>
          ← 返回我的批改
        </button>
      </div>
    )
  }

  const isPending = s.status === 'PENDING'
  const questionText = s.question?.content || s.customPrompt || ''
  const wordCount = countWords(s.content)
  const isFile = !!s.wordFileUrl

  // 优先用新字段 overallScore，兼容旧字段 score
  const displayOverall = s.overallScore ?? s.score



  const dims = [
    { label: 'TA', desc: '任务回应', value: s.taScore,  icon: '🎯', bg: '#eff6ff', border: '#bfdbfe' },
    { label: 'CC', desc: '连贯衔接', value: s.ccScore,  icon: '🔗', bg: '#f0fdf4', border: '#bbf7d0' },
    { label: 'LR', desc: '词汇资源', value: s.lrScore,  icon: '📚', bg: '#faf5ff', border: '#e9d5ff' },
    { label: 'GRA',desc: '语法范围', value: s.graScore, icon: '✏️', bg: '#fff7ed', border: '#fed7aa' },
  ]

  const downloadUrl = s.reviewFileUrl || s.feedbackUrl

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <style>{`
        .detail-grid { display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start; }
        .detail-sidebar { position: sticky; top: 24px; display: flex; flex-direction: column; gap: 16px; }
        @media (max-width: 900px) {
          .detail-grid { grid-template-columns: 1fr; }
          .detail-sidebar { position: static; }
        }
      `}</style>

      {/* 顶部 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, gap: 12, flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/dashboard/submissions')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 14, padding: 0 }}>
          ← 返回我的批改
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 16px', borderRadius: 20,
            background: isPending ? '#fef9ec' : '#f0fdf4',
            border: `1.5px solid ${isPending ? '#fde68a' : '#bbf7d0'}`,
            fontSize: 13, fontWeight: 600,
            color: isPending ? '#92400e' : '#166534',
          }}>
            {isPending ? '⏳ 批改中' : '✅ 已批改'}
          </span>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>提交于 {fmt(s.createdAt)}</span>
        </div>
      </div>

      {/* 已批改：两列 */}
      {!isPending ? (
        <div className="detail-grid">

          {/* 左列：题目 + 作文 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* 题目 */}
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 24px', background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>📋</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>题目</span>
              </div>
              <div style={{ padding: '24px' }}>
    {s.imageUrl && (
  <img
    src={s.imageUrl}
    alt="题目图表"
    style={{ marginBottom: questionText ? 16 : 0, maxWidth: '600px', width: '100%', borderRadius: 8, border: '1px solid #e2e8f0', display: 'block' }}
  />
)}
                {questionText && (
                  <p style={{ margin: 0, fontSize: 17, color: '#1e293b', lineHeight: 2, fontFamily: 'Georgia, serif' }}>{questionText}</p>
                )}
              </div>
            </div>

            {/* 作文 */}
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 24px', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>✍️</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>我的作文</span>
                </div>
                {!isFile && wordCount > 0 && (
                  <span style={{ fontSize: 12, color: '#64748b', background: '#e2e8f0', padding: '3px 10px', borderRadius: 99 }}>{wordCount} 词</span>
                )}
              </div>
              <div style={{ padding: '24px' }}>
                {isFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10 }}>
                    <span style={{ fontSize: 32 }}>📄</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>Word 文档形式提交</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>请下载批改文件查看</div>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 17, color: '#1e293b', lineHeight: 2, fontFamily: 'Georgia, serif', whiteSpace: 'pre-wrap' }}>{s.content}</p>
                )}
              </div>
            </div>
          </div>

          {/* 右列 sidebar */}
          <div className="detail-sidebar">

            {/* 综合分大卡片 */}
            {displayOverall != null && (
              <div style={{
                background: '#fff', border: '1.5px solid #e2e8f0',
                borderRadius: 16, padding: '24px 20px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>综合分</div>
                <div style={{ fontSize: 68, fontWeight: 900, color: '#1e3a5f', lineHeight: 1 }}>
                  {displayOverall.toFixed(1)}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 10 }}>TA · CC · LR · GRA</div>
              </div>
            )}

            {/* 四维分卡片 */}
            {dims.some(d => d.value != null) && (
              <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '20px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>四维评分</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {dims.map(d => (
                    <div key={d.label} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 10,
                      background: d.value != null ? d.bg : '#f8fafc',
                      border: `1px solid ${d.value != null ? d.border : '#f1f5f9'}`,
                    }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{d.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{d.label}</div>
                        <div style={{ fontSize: 11, color: '#b0bec5' }}>{d.desc}</div>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: d.value != null ? '#1e3a5f' : '#cbd5e1' }}>
                        {d.value != null ? d.value.toFixed(1) : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 老师评语 */}
            {s.adminComment && (
              <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '20px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  💬 老师评语
                </div>
                <p style={{
                  margin: 0, fontSize: 14, color: '#374151',
                  lineHeight: 1.85, whiteSpace: 'pre-wrap',
                  background: '#f8faff', borderRadius: 10,
                  padding: '14px 16px',
                  border: '1px solid #e8f0fe',
                }}>
                  {s.adminComment}
                </p>
              </div>
            )}

            {/* 下载批改文件 */}
            {downloadUrl ? (
              <a
                href={downloadUrl.startsWith('http') ? downloadUrl : `http://localhost:4000${downloadUrl}`}
                target="_blank" rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '16px', borderRadius: 14,
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: '#fff', fontWeight: 700, fontSize: 15,
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(59,130,246,.3)',
                }}
              >
                <span style={{ fontSize: 20 }}>⬇</span>
                下载批改文件
              </a>
            ) : (
              <div style={{ padding: '16px', borderRadius: 14, background: '#f1f5f9', textAlign: 'center', fontSize: 14, color: '#94a3b8' }}>
                批改文件暂未上传
              </div>
            )}
          </div>
        </div>

      ) : (
        /* 批改中：单列 */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 24px', background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>📋</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>题目</span>
            </div>
            <div style={{ padding: '24px' }}>
              {questionText && <p style={{ margin: 0, fontSize: 17, color: '#1e293b', lineHeight: 2, fontFamily: 'Georgia, serif' }}>{questionText}</p>}
            </div>
          </div>

          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 24px', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>✍️</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>我的作文</span>
              </div>
              {wordCount > 0 && <span style={{ fontSize: 12, color: '#64748b', background: '#e2e8f0', padding: '3px 10px', borderRadius: 99 }}>{wordCount} 词</span>}
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ margin: 0, fontSize: 17, color: '#1e293b', lineHeight: 2, fontFamily: 'Georgia, serif', whiteSpace: 'pre-wrap' }}>{s.content}</p>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>老师正在批改中</div>
            <div style={{ fontSize: 14, color: '#94a3b8' }}>通常在 48 小时内完成，批改完成后此处将显示批改文件下载按钮</div>
          </div>
        </div>
      )}

      <div style={{ height: 48 }} />
    </div>
  )
}