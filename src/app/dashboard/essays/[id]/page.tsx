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
  annotatedPdfUrl?: string
  createdAt: string
  questionImageUrl?: string 
}

export default function EssayDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { collapsed } = useLayoutStore()
  const { user } = useAuthStore()
  const [essay, setEssay] = useState<Essay | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [downloadingAnnotated, setDownloadingAnnotated] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get(`/essays/${id}`)
      .then(res => setEssay(res.data))
      .catch(() => router.push('/dashboard/essays'))
      .finally(() => setLoading(false))
  }, [id, router])

  // 生成带水印的 PDF（根据页面内容）
  async function handleDownloadPDF() {
    if (!essay || !user) return
    setDownloading(true)
    try {
      // 动态加载 jsPDF
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pageW = 210
      const pageH = 297
      const margin = 20
      const maxW = pageW - margin * 2
      let y = margin

      // 水印函数
      const addWatermark = () => {
        doc.setTextColor(220, 220, 220)
        doc.setFontSize(28)
        doc.setFont('helvetica', 'bold')
        const wm = `${user.phone || user.username || 'IELTS PRO'}`
        for (let row = 0; row < 6; row++) {
          for (let col = 0; col < 3; col++) {
            doc.saveGraphicsState()
            doc.text(wm, 30 + col * 70, 50 + row * 50, { angle: 30, renderingMode: 'fill' })
            doc.restoreGraphicsState()
          }
        }
        doc.setTextColor(0, 0, 0)
      }

      // 辅助：写文字并自动换页
      const writeText = (text: string, fontSize: number, isBold = false, color = '#1e293b') => {
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', isBold ? 'bold' : 'normal')
        const r = parseInt(color.slice(1, 3), 16)
        const g = parseInt(color.slice(3, 5), 16)
        const b = parseInt(color.slice(5, 7), 16)
        doc.setTextColor(r, g, b)
        const lines = doc.splitTextToSize(text, maxW)
        lines.forEach((line: string) => {
          if (y + fontSize * 0.5 > pageH - margin) {
            addWatermark()
            doc.addPage()
            y = margin
          }
          doc.text(line, margin, y)
          y += fontSize * 0.45
        })
        y += 3
      }

      addWatermark()

      // 标题
      writeText('IELTS Writing - Model Essay', 16, true, '#1d4ed8')
      writeText(`${essay.task === 'TASK2' ? 'Task 2 大作文' : 'Task 1 小作文'}${essay.score ? ` · ${essay.score}分` : ''}`, 11, false, '#64748b')
      if (essay.subtype || essay.topic) {
        writeText(`${essay.subtype || ''}${essay.subtype && essay.topic ? ' · ' : ''}${essay.topic || ''}`, 10, false, '#94a3b8')
      }
      y += 4

      // 分隔线
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, y, pageW - margin, y)
      y += 8

      // 题目
      if (essay.questionContent) {
        writeText('题目', 12, true, '#374151')
        writeText(essay.questionContent, 11, false, '#374151')
        y += 4
        doc.line(margin, y, pageW - margin, y)
        y += 8
      }

      // 范文正文
      writeText('范文', 12, true, '#374151')
      const paragraphs = essay.content.split('\n').filter(p => p.trim())
      paragraphs.forEach(p => {
        writeText(p.trim(), 11, false, '#1e293b')
        y += 2
      })

      y += 6
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, y, pageW - margin, y)
      y += 6

      // 水印版权声明
      writeText(`© IELTS Writing Pro · ${user.phone || user.username} · 仅供个人学习使用`, 9, false, '#94a3b8')

      // 最后一页也加水印
      addWatermark()

      const filename = `范文_${essay.task}_${essay.score || ''}分_${Date.now()}.pdf`
      doc.save(filename)
    } catch (err) {
      console.error('PDF生成失败', err)
      alert('PDF生成失败，请稍后重试')
    } finally {
      setDownloading(false)
    }
  }

  // 下载老师批注版 PDF（后端存储的文件）
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

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8', fontSize: 15 }}>加载中...</div>
  }

  if (!essay) return null

  const paragraphs = essay.content.split('\n').filter(p => p.trim())

  return (
    <div style={{ maxWidth: collapsed ? '860px' : '100%', margin: collapsed ? '0 20% 0 5%' : '0', transition: 'all .2s ease' }}>

      {/* 返回按钮 */}
      <button
        onClick={() => router.back()}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24, padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
      >
        ← 返回范文列表
      </button>

      {/* 标签行 */}
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

      {/* 下载按钮区 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: downloading ? '#cbd5e1' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff', fontWeight: 600, fontSize: 14,
            cursor: downloading ? 'not-allowed' : 'pointer',
            boxShadow: downloading ? 'none' : '0 3px 10px rgba(59,130,246,.25)',
          }}
        >
          {downloading ? (
            <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .8s linear infinite' }} />生成中...</>
          ) : '⬇ 下载范文 PDF'}
        </button>

        {essay.annotatedPdfUrl && (
          <button
            onClick={handleDownloadAnnotated}
            disabled={downloadingAnnotated}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10,
              border: '1.5px solid #e2e8f0',
              background: downloadingAnnotated ? '#f8fafc' : '#fff',
              color: downloadingAnnotated ? '#94a3b8' : '#475569',
              fontWeight: 600, fontSize: 14,
              cursor: downloadingAnnotated ? 'not-allowed' : 'pointer',
            }}
          >
            {downloadingAnnotated ? (
              <><span style={{ width: 14, height: 14, border: '2px solid #cbd5e1', borderTopColor: '#64748b', borderRadius: '50%', display: 'inline-block', animation: 'spin .8s linear infinite' }} />下载中...</>
            ) : '📎 下载批注版 PDF'}
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
          <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.85, fontFamily: 'Georgia, serif' }}>
  {essay.questionContent}
</div>
{essay.questionImageUrl && (
  <img
    src={essay.questionImageUrl}
    alt="题目图表"
    style={{ marginTop: 16, maxWidth: '100%', borderRadius: 8, border: '1px solid #e2e8f0' }}
  />
)}
        </div>
      )}

      {/* 范文正文 */}
      <div ref={contentRef} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '28px 32px', marginBottom: 32 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>范文</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {paragraphs.map((para, i) => (
            <p key={i} style={{ fontSize: 16, color: '#1e293b', lineHeight: 1.95, margin: 0, fontFamily: 'Georgia, serif', textIndent: '0', letterSpacing: '0.01em' }}>
              {para}
            </p>
          ))}
        </div>

        {/* 字数统计 */}
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}