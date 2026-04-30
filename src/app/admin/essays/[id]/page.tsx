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

const COLORS = [
  { value: '#1d4ed8', label: '蓝色' },
  { value: '#b45309', label: '黄色' },
  { value: '#166534', label: '绿色' },
  { value: '#991b1b', label: '红色' },
  { value: '#6b21a8', label: '紫色' },
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
  const [savingAnnotations, setSavingAnnotations] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#1d4ed8')
  const editorRef = useRef<HTMLDivElement>(null)

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
      .then(res => {
        if (editorRef.current && typeof res.data === 'string' && res.data) {
          editorRef.current.innerHTML = res.data
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // 切换到批注tab时初始化编辑器内容
  useEffect(() => {
    if (tab === 'annotate' && editorRef.current && essay) {
      if (!editorRef.current.innerHTML.trim()) {
        editorRef.current.innerHTML = essay.content
      }
    }
  }, [tab, essay])

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
    if (!editorRef.current) return
    setSavingAnnotations(true)
    try {
      await api.put(`/essays/${id}/annotations`, {
        annotations: editorRef.current.innerHTML
      })
      alert('批注保存成功')
    } catch {
      alert('保存失败')
    } finally {
      setSavingAnnotations(false)
    }
  }

  function applyColor(color: string) {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return
    document.execCommand('foreColor', false, color)
    setSelectedColor(color)
  }

  function clearFormat() {
    document.execCommand('removeFormat')
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
        <div style={{ background: '#fff', border: '1.5px solid #e8f0fe', borderRadius: 14, padding: '28px 32px' }}>

          {/* 工具栏 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 16, padding: '10px 14px',
            background: '#f8faff', border: '1.5px solid #e8f0fe',
            borderRadius: 10, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>选中文字后点颜色：</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLORS.map(c => (
                <div
                  key={c.value}
                  onClick={() => applyColor(c.value)}
                  title={c.label}
                  style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: c.value, cursor: 'pointer',
                    border: selectedColor === c.value ? '3px solid #1e3a5f' : '2px solid transparent',
                    transition: 'transform 0.1s',
                  }}
                />
              ))}
            </div>
            <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
            <button
              onClick={clearFormat}
              style={{
                fontSize: 12, padding: '4px 12px', borderRadius: 6,
                border: '1.5px solid #e2e8f0', background: '#fff',
                color: '#64748b', cursor: 'pointer',
              }}
            >
              清除颜色
            </button>
            <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>
              💡 直接粘贴Word文章，选中文字点颜色即可
            </span>
          </div>

          {/* 富文本编辑区 */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            style={{
              fontSize: 17,
              lineHeight: 2,
              fontFamily: 'Georgia, serif',
              color: '#1e293b',
              minHeight: 400,
              outline: 'none',
              whiteSpace: 'pre-wrap',
            }}
          />
        </div>
      )}
    </div>
  )
}