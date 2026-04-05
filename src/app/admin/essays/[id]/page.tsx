'use client'
import { useEffect, useState } from 'react'
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

export default function AdminEssayDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [essay, setEssay] = useState<Essay | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [form, setForm] = useState({ questionId: '', content: '', score: '' })

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

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 16px', fontSize: 16,
    borderRadius: 8, border: '1.5px solid #e8f0fe',
    background: '#f8faff', color: '#1e3a5f', outline: 'none',
  }

  const label: React.CSSProperties = {
    fontSize: 15, color: '#64748b', marginBottom: 8, fontWeight: 500,
    display: 'block',
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>加载中...</div>
  }

  if (!essay) {
    return <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>范文不存在</div>
  }

  const pdfHref = essay.annotatedPdfUrl
    ? (essay.annotatedPdfUrl.startsWith('http')
        ? essay.annotatedPdfUrl
        : 'http://localhost:4000' + essay.annotatedPdfUrl)
    : ''

  return (
    <div style={{ maxWidth: '100%' }}>

      <button
        onClick={() => router.back()}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          marginBottom: 20, padding: '9px 18px', borderRadius: 8,
          border: '1.5px solid #e2e8f0', background: '#fff',
          color: '#64748b', fontSize: 14, cursor: 'pointer',
        }}
      >
        ← 返回列表
      </button>

      {/* 页头 */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        border: '1.5px solid #bfdbfe', borderLeft: '5px solid #1d4ed8',
        borderRadius: 16, padding: '22px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e3a5f', marginBottom: 4 }}>
            编辑范文 #{essay.id}
          </h1>
          <div style={{ fontSize: 14, color: '#64748b' }}>修改后点击保存生效</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: '11px 22px', borderRadius: 10,
              border: '1.5px solid #e2e8f0', background: '#fff',
              color: '#64748b', fontSize: 15, fontWeight: 500, cursor: 'pointer',
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '11px 28px', borderRadius: 10, border: 'none',
              background: saving ? '#93c5fd' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              color: '#fff', fontSize: 15, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </div>

      {/* 表单 */}
      <div style={{
        background: '#fff', border: '1.5px solid #e8f0fe',
        borderRadius: 14, padding: '32px',
      }}>

        {/* 关联题目 */}
        <div style={{ marginBottom: 20 }}>
          <div style={label}>关联题目 *</div>
          <select
            value={form.questionId}
            onChange={e => setForm(f => ({ ...f, questionId: e.target.value }))}
            style={{ ...inp, cursor: 'pointer' }}
          >
            <option value="">— 选择题目 —</option>
            {questions.map(q => (
              <option key={q.id} value={q.id}>
                [{q.task === 'TASK2' ? 'T2' : 'T1'}] {q.content.slice(0, 60)}...
              </option>
            ))}
          </select>
        </div>

        {/* 评分 */}
        <div style={{ marginBottom: 20 }}>
          <div style={label}>评分（可选）</div>
          <input
            type="number" min={0} max={9} step={0.5}
            value={form.score}
            onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
            placeholder="如：7.5"
            style={{ ...inp, width: 140 }}
          />
        </div>

        {/* 批注 PDF */}
        <div style={{ marginBottom: 20 }}>
          <div style={label}>批注 PDF（可选）</div>
          {pdfHref && !pdfFile && (
            <div style={{ marginBottom: 12 }}>
              <a
                href={pdfHref}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 15, color: '#1d4ed8', fontWeight: 500 }}
              >
                📄 查看当前批注 PDF →
              </a>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                上传新文件将替换
              </div>
            </div>
          )}
          <label style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10,
            border: pdfFile ? '2px dashed #1d4ed8' : '2px dashed #93c5fd',
            borderRadius: 12, padding: '24px', cursor: 'pointer',
            background: pdfFile ? '#eff6ff' : '#f8faff',
          }}>
            <span style={{ fontSize: 28 }}>{pdfFile ? '📄' : '📎'}</span>
            <span style={{ fontSize: 15, color: pdfFile ? '#1d4ed8' : '#64748b', fontWeight: 500 }}>
              {pdfFile ? pdfFile.name : '点击上传 PDF'}
            </span>
            <input
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={e => setPdfFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        {/* 范文内容 */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 8,
          }}>
            <div style={label}>范文内容 *</div>
            <div style={{ fontSize: 14, color: '#94a3b8' }}>
              {form.content.trim().split(/\s+/).filter(Boolean).length} 词
            </div>
          </div>
          <textarea
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            rows={18}
            placeholder="输入完整范文内容..."
            style={{
              ...inp,
              resize: 'vertical',
              lineHeight: 2,
              fontFamily: 'Georgia, serif',
              fontSize: 17,
            }}
          />
        </div>

      </div>
    </div>
  )
}