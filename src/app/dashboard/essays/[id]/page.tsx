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

 async function handleDownloadPDF() {
  if (!essay || !user) return
  setDownloading(true)
  try {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = 210
    const pageH = 297
    const margin = 20
    const maxW = pageW - margin * 2
    let y = margin

    // 把文字渲染成图片（解决中文乱码）
    const textToImage = (text: string, fontSize: number, color: string, bold = false): Promise<{ dataUrl: string; widthMM: number; heightMM: number }> => {
      return new Promise(resolve => {
        const canvas = document.createElement('canvas')
        const scale = 3
        const ctx = canvas.getContext('2d')!
        const fontStr = `${bold ? 'bold ' : ''}${fontSize * scale}px "PingFang SC", "Microsoft YaHei", sans-serif`
        ctx.font = fontStr
        const textWidth = ctx.measureText(text).width
        const lineH = fontSize * scale * 1.5
        canvas.width = Math.min(textWidth + 20, maxW * scale * 3.78)
        canvas.height = lineH + 10
        ctx.font = fontStr
        ctx.fillStyle = color
        ctx.fillText(text, 0, lineH * 0.8)
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          widthMM: canvas.width / (scale * 3.78),
          heightMM: canvas.height / (scale * 3.78),
        })
      })
    }

    // 写一行文字（自动换行）
    const writeText = async (text: string, fontSize: number, bold = false, color = '#1e293b') => {
      // 按 maxW 分行
      const canvas = document.createElement('canvas')
      const scale = 3
      const ctx = canvas.getContext('2d')!
      const fontStr = `${bold ? 'bold ' : ''}${fontSize * scale}px "PingFang SC", "Microsoft YaHei", sans-serif`
      ctx.font = fontStr

      // 手动分行
      const words = text.split('')
      const lines: string[] = []
      let current = ''
      const maxPx = maxW * scale * 3.78
      for (const ch of words) {
        const test = current + ch
        if (ctx.measureText(test).width > maxPx && current) {
          lines.push(current)
          current = ch
        } else {
          current = test
        }
      }
      if (current) lines.push(current)

      const lineH = fontSize * scale * 1.6
      for (const line of lines) {
        const lineCanvas = document.createElement('canvas')
        lineCanvas.width = maxPx + 20
        lineCanvas.height = lineH + 4
        const lctx = lineCanvas.getContext('2d')!
        lctx.font = fontStr
        lctx.fillStyle = color
        lctx.fillText(line, 0, lineH * 0.82)
        const dataUrl = lineCanvas.toDataURL('image/png')
        const hMM = lineCanvas.height / (scale * 3.78)
        if (y + hMM > pageH - margin) {
          addWatermark()
          doc.addPage()
          y = margin
        }
        doc.addImage(dataUrl, 'PNG', margin, y, maxW, hMM)
        y += hMM * 0.85
      }
      y += 1
    }

    // 水印（更透明、更小、间距更大）
    const addWatermark = () => {
      doc.setTextColor(225, 225, 225)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'normal')
      const wm = user.phone || user.username || 'IELTS PRO'
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 3; col++) {
          doc.saveGraphicsState()
          doc.text(wm, 25 + col * 75, 60 + row * 60, { angle: 25, renderingMode: 'fill' })
          doc.restoreGraphicsState()
        }
      }
      doc.setTextColor(0, 0, 0)
    }

    addWatermark()

    // 标题
    await writeText('IELTS Writing - Model Essay', 15, true, '#1d4ed8')
    await writeText(`${essay.task === 'TASK2' ? 'Task 2 大作文' : 'Task 1 小作文'}${essay.score ? ` · ${essay.score}分` : ''}`, 10, false, '#64748b')
    if (essay.subtype || essay.topic) {
      await writeText(`${essay.subtype || ''}${essay.subtype && essay.topic ? ' · ' : ''}${essay.topic || ''}`, 9, false, '#94a3b8')
    }
    y += 4
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageW - margin, y)
    y += 6

    // 题目
    if (essay.questionContent) {
      await writeText('题目', 11, true, '#374151')
      await writeText(essay.questionContent, 10, false, '#374151')

      // 题目图片
if (essay.questionImageUrl) {
  try {
    const imgDataUrl = await new Promise<string>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        canvas.getContext('2d')!.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = reject
      img.src = essay.questionImageUrl + '?t=' + Date.now()
    })
    const img = new Image()
    await new Promise<void>(resolve => {
      img.onload = () => resolve()
      img.src = imgDataUrl
    })
          const imgW = Math.min(maxW, 140) // 最大 140mm 宽
          const imgH = (img.height / img.width) * imgW
          if (y + imgH > pageH - margin) {
            addWatermark()
            doc.addPage()
            y = margin
          }
          doc.addImage(imgDataUrl, 'PNG', margin + (maxW - imgW) / 2, y, imgW, imgH)
          y += imgH + 6
        } catch (e) {
          console.warn('图片加载失败', e)
        }
      }

      y += 4
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, y, pageW - margin, y)
      y += 6
    }

    // 范文正文
    await writeText('范文', 11, true, '#374151')
    const paragraphs = essay.content.split('\n').filter(p => p.trim())
    for (const p of paragraphs) {
      await writeText(p.trim(), 10, false, '#1e293b')
      y += 1
    }

    y += 4
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageW - margin, y)
    y += 4
    await writeText(`© IELTS Writing Pro · ${user.phone || user.username} · 仅供个人学习使用`, 8, false, '#94a3b8')
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

      <button
        onClick={() => router.back()}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24, padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
      >
        ← 返回范文列表
      </button>

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
          <div style={{ fontSize: 17, color: '#374151', lineHeight: 1.85, fontFamily: 'Georgia, serif' }}>
            {essay.questionContent}
          </div>
{essay.questionImageUrl && (
 <img
  src={essay.questionImageUrl}
  alt="题目图表"
  style={{ display: 'block', maxWidth: '600px', width: '100%', margin: '16px auto 0', borderRadius: 8, border: '1px solid #e2e8f0' }}
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