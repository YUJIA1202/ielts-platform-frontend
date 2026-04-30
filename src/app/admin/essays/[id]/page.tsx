'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'

interface Essay {
  id: number
  score?: number
  content: string
  task: string
  subtype?: string
  topic?: string
  questionContent?: string
  annotatedPdfUrl?: string
  createdAt: string
  questionId: number
}

interface Question {
  id: number
  task: string
  content: string
}

interface Annotation {
  id: string
  start: number
  end: number
  color: string
  comment: string
}

const COLORS = [
  { value: '#fde68a', label: '黄色' },
  { value: '#bbf7d0', label: '绿色' },
  { value: '#bfdbfe', label: '蓝色' },
  { value: '#fecaca', label: '红色' },
  { value: '#e9d5ff', label: '紫色' },
]

export default function AdminEssayDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [essay, setEssay] = useState<Essay | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [form, setForm] = useState({ questionId: '', content: '', score: '' })
  const [tab, setTab] = useState<'edit' | 'annotate'>('edit')

  // 批注相关
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [savingAnnotations, setSavingAnnotations] = useState(false)
  const [popup, setPopup] = useState<{
    visible: boolean
    x: number
    y: number
    start: number
    end: number
    selectedText: string
    color: string
    comment: string
  }>({ visible: false, x: 0, y: 0, start: 0, end: 0, selectedText: '', color: '#fde68a', comment: '' })
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get(`/essays/${id}`)
      .then(res => {
        const e = res.data
        setEssay(e)
        setForm({
          questionId: String(e.questionId),
          content: e.content,
          score: e.score ? String(e.score) : '',
        })
      })
      .finally(() => setLoading(false))
    api.get('/questions', { params: { limit: '200' } })
      .then(res => setQuestions(res.data.questions || []))
    api.get(`/essays/${id}/annotations`)
      .then(res => setAnnotations(res.data || []))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleSave() {
    if (!form.content.trim()) { alert('范文内容不能为空'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('questionId', form.questionId)
      fd.append('content', form.content)
      if (form.score) fd.append('score', form.score)
      if (pdfFile) fd.append('annotatedPdf', pdfFile)
      await api.put(`/essays/${id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      alert('保存成功')
      router.push('/admin/essays')
    } catch {
      alert('保存失败')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAnnotations() {
    setSavingAnnotations(true)
    try {
      await api.put(`/essays/${id}/annotations`, { annotations })
      alert('批注保存成功')
    } catch {
      alert('保存失败')
    } finally {
      setSavingAnnotations(false)
    }
  }

  function handleTextSelect() {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return
    const selectedText = selection.toString().trim()
    if (!selectedText || !contentRef.current) return

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const containerRect = contentRef.current.getBoundingClientRect()

    // 计算在原始文本中的位置
    const content = essay?.content || ''
    const start = content.indexOf(selectedText)
    if (start === -1) return
    const end = start + selectedText.length

    setPopup({
      visible: true,
      x: rect.left - containerRect.left,
      y: rect.bottom - containerRect.top + 8,
      start,
      end,
      selectedText,
      color: '#fde68a',
      comment: '',
    })
  }

  function handleAddAnnotation() {
    if (!popup.comment.trim()) { alert('请输入批注内容'); return }
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      start: popup.start,
      end: popup.end,
      color: popup.color,
      comment: popup.comment,
    }
    setAnnotations(prev => [...prev, newAnnotation])
    setPopup(p => ({ ...p, visible: false }))
    window.getSelection()?.removeAllRanges()
  }

  function renderAnnotatedText(content: string) {
    if (annotations.length === 0) return <span>{content}</span>

    const sorted = [...annotations].sort((a, b) => a.start - b.start)
    const parts: React.ReactNode[] = []
    let cursor = 0

    sorted.forEach((ann, i) => {
      if (ann.start > cursor) {
        parts.push(<span key={`text-${i}`}>{content.slice(cursor, ann.start)}</span>)
      }
      parts.push(
        <span
          key={`ann-${ann.id}`}
          style={{
            background: ann.color,
            borderRadius: 3,
            padding: '0 2px',
            cursor: 'help',
            position: 'relative',
          }}
          title={ann.comment}
        >
          {content.slice(ann.start, ann.end)}
        </span>
      )
      cursor = ann.end
    })

    if (cursor < content.length) {
      parts.push(<span key="text-end">{content.slice(cursor)}</span>)
    }

    return <>{parts}</>
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 16px', fontSize: 16,
    borderRadius: 8, border: '1.5px solid #e8f0fe',
    background: '#f8faff', color: '#1e3a5f', outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 15, color: '#64748b', marginBottom: 8, fontWeight: 500,
    display: 'block',
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>加载中...</div>
  if (!essay) return <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>范文不存在</div>

  return (
    <div style={{ maxWidth: '100%' }}>

      <button onClick={() => router.back()} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        marginBottom: 20, padding: '9px 18px', borderRadius: 8,
        border: '1.5px solid #e2e8f0', background: '#fff',
        color: '#64748b', fontSize: 14, cursor: 'pointer',
      }}>
        ← 返回列表
      </button>

      {/* 页头 */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        border: '1.5px solid #bfdbfe', borderLeft: '5px solid #1d4ed8',
        borderRadius: 16, padding: '22px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e3a5f', marginBottom: 4 }}>
            编辑范文 #{essay.id}
          </h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {(['edit', 'annotate'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '7px 18px', borderRadius: 8, border: 'none',
                background: tab === t ? '#1d4ed8' : 'rgba(29,78,216,0.08)',
                color: tab === t ? '#fff' : '#1d4ed8',
                fontSize: 13, fontWeight: tab === t ? 700 : 500, cursor: 'pointer',
              }}>
                {t === 'edit' ? '编辑内容' : '批注编辑'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {tab === 'edit' ? (
            <>
              <button onClick={() => router.back()} style={{
                padding: '11px 22px', borderRadius: 10,
                border: '1.5px solid #e2e8f0', background: '#fff',
                color: '#64748b', fontSize: 15, fontWeight: 500, cursor: 'pointer',
              }}>取消</button>
              <button onClick={handleSave} disabled={saving} style={{
                padding: '11px 28px', borderRadius: 10, border: 'none',
                background: saving ? '#93c5fd' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                color: '#fff', fontSize: 15, fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}>{saving ? '保存中...' : '保存修改'}</button>
            </>
          ) : (
            <button onClick={handleSaveAnnotations} disabled={savingAnnotations} style={{
              padding: '11px 28px', borderRadius: 10, border: 'none',
              background: savingAnnotations ? '#93c5fd' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              color: '#fff', fontSize: 15, fontWeight: 600,
              cursor: savingAnnotations ? 'not-allowed' : 'pointer',
            }}>{savingAnnotations ? '保存中...' : '保存批注'}</button>
          )}
        </div>
      </div>

      {/* 编辑内容 Tab */}
      {tab === 'edit' && (
        <div style={{ background: '#fff', border: '1.5px solid #e8f0fe', borderRadius: 14, padding: '32px' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={labelStyle}>关联题目 *</div>
            <select value={form.questionId} onChange={e => setForm(f => ({ ...f, questionId: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
              <option value="">— 选择题目 —</option>
              {questions.map(q => (
                <option key={q.id} value={q.id}>[{q.task === 'TASK2' ? 'T2' : 'T1'}] {q.content.slice(0, 60)}...</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={labelStyle}>评分（可选）</div>
            <input type="number" min={0} max={9} step={0.5} value={form.score}
              onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
              placeholder="如：7.5" style={{ ...inp, width: 140 }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={labelStyle}>批注 PDF（可选）</div>
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 10,
              border: pdfFile ? '2px dashed #1d4ed8' : '2px dashed #93c5fd',
              borderRadius: 12, padding: '24px', cursor: 'pointer',
              background: pdfFile ? '#eff6ff' : '#f8faff',
            }}>
              <span style={{ fontSize: 28 }}>{pdfFile ? '📄' : '📎'}</span>
              <span style={{ fontSize: 15, color: pdfFile ? '#1d4ed8' : '#64748b', fontWeight: 500 }}>
                {pdfFile ? pdfFile.name : '点击上传 PDF'}
              </span>
              <input type="file" accept=".pdf" style={{ display: 'none' }}
                onChange={e => setPdfFile(e.target.files?.[0] || null)} />
            </label>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={labelStyle}>范文内容 *</div>
              <div style={{ fontSize: 14, color: '#94a3b8' }}>
                {form.content.trim().split(/\s+/).filter(Boolean).length} 词
              </div>
            </div>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={18} placeholder="输入完整范文内容..."
              style={{ ...inp, resize: 'vertical', lineHeight: 2, fontFamily: 'Georgia, serif', fontSize: 17 }} />
          </div>
        </div>
      )}

      {/* 批注编辑 Tab */}
      {tab === 'annotate' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

          {/* 左：文章区域 */}
          <div style={{ background: '#fff', border: '1.5px solid #e8f0fe', borderRadius: 14, padding: '28px 32px' }}>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
              💡 选中文字后添加批注
            </div>
            <div
              ref={contentRef}
              onMouseUp={handleTextSelect}
              style={{
                fontSize: 16, lineHeight: 2, fontFamily: 'Georgia, serif',
                color: '#1e293b', userSelect: 'text', position: 'relative',
                whiteSpace: 'pre-wrap',
              }}
            >
              {renderAnnotatedText(essay.content)}
            </div>

            {/* 批注弹出框 */}
            {popup.visible && (
              <div style={{
                position: 'absolute',
                left: Math.min(popup.x, 400),
                top: popup.y,
                background: '#fff',
                border: '1.5px solid #e8f0fe',
                borderRadius: 12,
                padding: '16px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                zIndex: 100,
                width: 280,
              }}>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>
                  选中：<strong style={{ color: '#1e3a5f' }}>{`"${popup.selectedText.slice(0, 30)}${popup.selectedText.length > 30 ? '...' : ''}"`}</strong>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {COLORS.map(c => (
                    <div key={c.value} onClick={() => setPopup(p => ({ ...p, color: c.value }))}
                      title={c.label}
                      style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: c.value, cursor: 'pointer',
                        border: popup.color === c.value ? '3px solid #1d4ed8' : '2px solid #e2e8f0',
                      }} />
                  ))}
                </div>
                <textarea
                  value={popup.comment}
                  onChange={e => setPopup(p => ({ ...p, comment: e.target.value }))}
                  placeholder="输入批注内容..."
                  rows={3}
                  style={{
                    width: '100%', padding: '8px 12px', fontSize: 13,
                    borderRadius: 8, border: '1.5px solid #e8f0fe',
                    background: '#f8faff', resize: 'none', outline: 'none',
                    marginBottom: 10, boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setPopup(p => ({ ...p, visible: false }))} style={{
                    flex: 1, padding: '8px', borderRadius: 8,
                    border: '1.5px solid #e2e8f0', background: '#fff',
                    color: '#64748b', fontSize: 13, cursor: 'pointer',
                  }}>取消</button>
                  <button onClick={handleAddAnnotation} style={{
                    flex: 1, padding: '8px', borderRadius: 8, border: 'none',
                    background: '#1d4ed8', color: '#fff', fontSize: 13,
                    fontWeight: 600, cursor: 'pointer',
                  }}>添加批注</button>
                </div>
              </div>
            )}
          </div>

          {/* 右：批注列表 */}
          <div style={{ background: '#fff', border: '1.5px solid #e8f0fe', borderRadius: 14, padding: '20px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e3a5f', marginBottom: 16 }}>
              批注列表 ({annotations.length})
            </div>
            {annotations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 14 }}>
                暂无批注
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {annotations.map(ann => (
                  <div key={ann.id} style={{
                    padding: '12px 14px', borderRadius: 10,
                    border: '1.5px solid #f1f5f9',
                    borderLeft: `4px solid ${ann.color}`,
                    background: ann.color + '30',
                  }}>
                    <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontStyle: 'italic' }}>
                      {`"${essay.content.slice(ann.start, ann.end).slice(0, 40)}..."`}
                    </div>
                    <div style={{ fontSize: 14, color: '#1e3a5f', marginBottom: 8 }}>
                      {ann.comment}
                    </div>
                    <button onClick={() => setAnnotations(prev => prev.filter(a => a.id !== ann.id))}
                      style={{
                        fontSize: 12, color: '#ef4444', background: 'none',
                        border: 'none', cursor: 'pointer', padding: 0,
                      }}>
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}