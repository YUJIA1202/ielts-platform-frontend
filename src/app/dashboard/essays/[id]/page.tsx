'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useLayoutStore } from '@/store/layoutStore'
import { useAuthStore } from '@/store/authStore'

interface Essay {
  id: number
  title?: string
  task: string
  subtype?: string
  topic?: string
  score?: string
  year?: number
  month?: number
  source?: string
  content: string
  questionContent?: string
  questionImageUrl?: string
  annotatedPdfUrl?: string
  createdAt: string
}

export default function EssayDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { collapsed } = useLayoutStore()
  const { user } = useAuthStore()
  const [essay, setEssay] = useState<Essay | null>(null)
  const [annotatedHtml, setAnnotatedHtml] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [downloadingAnnotated, setDownloadingAnnotated] = useState(false)
  const [tab, setTab] = useState<'essay' | 'annotated'>('essay')
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get(`/essays/${id}`)
      .then(res => setEssay(res.data))
      .catch(() => router.push('/dashboard/essays'))
      .finally(() => setLoading(false))
    api.get(`/essays/${id}/annotations`)
      .then(res => {
        if (typeof res.data === 'string') {
          setAnnotatedHtml(res.data)
        }
      })
      .catch(() => {})
  }, [id, router])

  async function handleDownloadPDF() {
    if (!essay || !user) return
    setDownloading(true)
    try {
      const res = await api.get(`/essays/${essay.id}/pdf`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `范文_${essay.task}_${essay.score || ''}分_${Date.now()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('PDF生成失败，请稍后重试')
    } finally {
      setDownloading(false)
    }
  }

  async function handleDownloadAnnotated() {
    if (!essay?.annotatedPdfUrl || !user) return
    setDownloadingAnnotated(true)
    try {
      const res = await api.get(`/essays/${essay.id}/annotated-pdf`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `批注版_${essay.task}_${essay.score || ''}分_${Date.now()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('下载失败，请稍后重试')
    } finally {
      setDownloadingAnnotated(false)
    }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8', fontSize: 15 }}>加载中...</div>
  )

  if (!essay) return null

  const paragraphs = essay.content.split('\n').filter(p => p.trim())
  const hasAnnotations = !!annotatedHtml.trim()

  return (
    <div style={{ maxWidth: collapsed ? '860px' : '100%', margin: collapsed ? '0 20% 0 5%' : '0', transition: 'all .2s ease' }}>

      <button onClick={() => router.back()} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        marginBottom: 24, padding: '8px 16px', borderRadius: 8,
        border: '1.5px solid #e2e8f0', background: '#fff',
        color: '#64748b', fontSize: 14, fontWeight: 500, cursor: 'pointer',
      }}>
        ← 返回范文列表
      </button>

      {/* 标签 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 13, background: '#eff6ff', color: '#1d4ed8', padding: '4px 12px', borderRadius: 6, fontWeight: 600 }}>
          {essay.task === 'TASK2' ? 'Task 2 大作文' : 'Task 1 小作文'}
        </span>
        {essay.subtype && <span style={{ fontSize: 13, background: '#eff6ff', color: '#3b82f6', padding: '4px 12px', borderRadius: 6, fontWeight: 500 }}>{essay.subtype}</span>}
        {essay.topic && <span style={{ fontSize: 13, background: '#f0fdf4', color: '#16a34a', padding: '4px 12px', borderRadius: 6, fontWeight: 500 }}>{essay.topic}</span>}
        {essay.score && (
          <span style={{ fontSize: 13, background: '#fef3c7', color: '#d97706', padding: '4px 12px', borderRadius: 6, fontWeight: 700 }}>
            ⭐ {essay.score} 分
          </span>
        )}
        {essay.year && <span style={{ fontSize: 13, color: '#94a3b8', padding: '4px 0' }}>{essay.year}/{essay.month}</span>}
        {essay.source && <span style={{ fontSize: 13, color: '#94a3b8', padding: '4px 0' }}>{essay.source}</span>}
      </div>

      {/* Tab 切换 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        <button onClick={() => setTab('essay')} style={{
          padding: '9px 20px', borderRadius: 9, border: 'none',
          background: tab === 'essay' ? '#1d4ed8' : '#eff6ff',
          color: tab === 'essay' ? '#fff' : '#1d4ed8',
          fontSize: 14, fontWeight: tab === 'essay' ? 700 : 500, cursor: 'pointer',
        }}>📄 范文</button>
        <button onClick={() => setTab('annotated')} style={{
          padding: '9px 20px', borderRadius: 9, border: 'none',
          background: tab === 'annotated' ? '#1d4ed8' : '#eff6ff',
          color: tab === 'annotated' ? '#fff' : '#1d4ed8',
          fontSize: 14, fontWeight: tab === 'annotated' ? 700 : 500,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          🖊 批注版
          {hasAnnotations && (
            <span style={{
              fontSize: 11, background: '#fff', color: '#1d4ed8',
              padding: '1px 6px', borderRadius: 10, fontWeight: 700,
            }}>✓</span>
          )}
        </button>
      </div>

      {/* 下载按钮 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {tab === 'essay' && (
          <button onClick={handleDownloadPDF} disabled={downloading} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: downloading ? '#cbd5e1' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff', fontWeight: 600, fontSize: 14,
            cursor: downloading ? 'not-allowed' : 'pointer',
            boxShadow: downloading ? 'none' : '0 3px 10px rgba(59,130,246,.25)',
          }}>
            {downloading ? (
              <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .8s linear infinite' }} />生成中...</>
            ) : '⬇ 下载范文 PDF'}
          </button>
        )}
        {tab === 'annotated' && essay.annotatedPdfUrl && (
          <button onClick={handleDownloadAnnotated} disabled={downloadingAnnotated} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: downloadingAnnotated ? '#cbd5e1' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff', fontWeight: 600, fontSize: 14,
            cursor: downloadingAnnotated ? 'not-allowed' : 'pointer',
            boxShadow: downloadingAnnotated ? 'none' : '0 3px 10px rgba(59,130,246,.25)',
          }}>
            {downloadingAnnotated ? (
              <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .8s linear infinite' }} />下载中...</>
            ) : '⬇ 下载批注版 PDF'}
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
          🔒 PDF 含个人水印，仅供学习使用
        </div>
      </div>

      {/* 题目卡片 */}
      {essay.questionContent && (
        <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>题目</div>
          <div style={{ fontSize: 17, color: '#374151', lineHeight: 1.85, fontFamily: 'Georgia, serif' }}>
            {essay.questionContent}
          </div>
          {essay.questionImageUrl && (
            <img src={essay.questionImageUrl} alt="题目图表"
              style={{ display: 'block', maxWidth: '600px', width: '100%', margin: '16px auto 0', borderRadius: 8, border: '1px solid #e2e8f0' }} />
          )}
        </div>
      )}

      {/* 范文 Tab */}
      {tab === 'essay' && (
        <div ref={contentRef} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '28px 32px', marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>范文</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {paragraphs.map((para, i) => (
              <p key={i} style={{ fontSize: 16, color: '#1e293b', lineHeight: 1.95, margin: 0, fontFamily: 'Georgia, serif', letterSpacing: '0.01em' }}>
                {para}
              </p>
            ))}
          </div>
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', gap: 20 }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>
              字数：<strong style={{ color: '#64748b' }}>{essay.content.trim().split(/\s+/).length} 词</strong>
            </span>
            {essay.score && (
              <span style={{ fontSize: 13, color: '#94a3b8' }}>
                评分：<strong style={{ color: '#d97706' }}>⭐ {essay.score} 分</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* 批注版 Tab */}
      {tab === 'annotated' && (
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '28px 32px', marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>批注版范文</div>
          {hasAnnotations ? (
            <div
              style={{ fontSize: 16, color: '#1e293b', lineHeight: 2, fontFamily: 'Georgia, serif' }}
              dangerouslySetInnerHTML={{ __html: annotatedHtml }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
              <div style={{ fontSize: 14 }}>暂无批注</div>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}