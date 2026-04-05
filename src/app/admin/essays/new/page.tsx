'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLayoutStore } from '@/store/layoutStore'
import api from '@/lib/api'

interface Question {
  id: number
  task: string
  content: string
}

export default function AdminEssayNewPage() {
  const router = useRouter()
  const { collapsed } = useLayoutStore()

  const [questions, setQuestions] = useState<Question[]>([])
  const [form, setForm] = useState({ questionId: '', content: '', score: '' })
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/questions', { params: { limit: '200' } })
      .then(res => setQuestions(res.data.questions || []))
  }, [])

  async function handleSave() {
    setError('')
    if (!form.questionId) { setError('请选择关联题目'); return }
    if (!form.content.trim()) { setError('范文内容不能为空'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('questionId', form.questionId)
      fd.append('content', form.content)
      if (form.score) fd.append('score', form.score)
      if (pdfFile) fd.append('annotatedPdf', pdfFile)
      await api.post('/essays', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      router.push('/admin/essays')
    } catch {
      setError('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const outerStyle: React.CSSProperties = collapsed
    ? { maxWidth: 960, margin: '0 5% 60px 3%', transition: 'all .2s ease' }
    : { maxWidth: '100%', margin: '0 0 60px', transition: 'all .2s ease' }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: 14,
    borderRadius: 8, border: '1.5px solid #e8f0fe',
    background: '#f8faff', color: '#1e3a5f', outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={outerStyle}>

      {/* 返回 */}
      <button onClick={() => router.push('/admin/essays')} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        marginBottom: 20, padding: '8px 16px', borderRadius: 8,
        border: '1.5px solid #e2e8f0', background: '#fff',
        color: '#64748b', fontSize: 14, cursor: 'pointer', fontWeight: 500,
      }}>
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
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e3a5f', marginBottom: 4 }}>新增范文</h1>
          <div style={{ fontSize: 13, color: '#64748b' }}>填写完成后点击保存</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => router.push('/admin/essays')} style={{
            padding: '9px 20px', borderRadius: 9,
            border: '1.5px solid #e2e8f0', background: '#fff',
            color: '#64748b', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>取消</button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '9px 24px', borderRadius: 9, border: 'none',
            background: saving ? '#93c5fd' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: saving ? 'none' : '0 4px 12px rgba(29,78,216,0.25)',
          }}>{saving ? '保存中...' : '保存范文'}</button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 10, padding: '12px 16px',
          color: '#dc2626', fontSize: 14, marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      {/* 表单 */}
      <div style={{
        background: '#fff', borderRadius: 14,
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(59,130,246,0.06)',
        padding: '28px',
      }}>

        {/* 关联题目 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>关联题目 *</div>
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
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>评分（可选）</div>
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
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>批注 PDF（可选）</div>
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 8,
            border: pdfFile ? '2px dashed #1d4ed8' : '2px dashed #93c5fd',
            borderRadius: 12, padding: '24px', cursor: 'pointer',
            background: pdfFile ? '#eff6ff' : '#f8faff',
          }}>
            <span style={{ fontSize: 28 }}>{pdfFile ? '📄' : '📎'}</span>
            <span style={{ fontSize: 14, color: pdfFile ? '#1d4ed8' : '#64748b', fontWeight: 500 }}>
              {pdfFile ? pdfFile.name : '点击上传 PDF'}
            </span>
            <input type="file" accept=".pdf" style={{ display: 'none' }}
              onChange={e => setPdfFile(e.target.files?.[0] || null)} />
          </label>
        </div>

        {/* 范文内容 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>范文内容 *</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>
              {form.content.trim().split(/\s+/).filter(Boolean).length} 词
            </div>
          </div>
          <textarea
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            rows={18}
            placeholder="输入完整范文内容..."
            style={{
              ...inp, resize: 'vertical', lineHeight: 2,
              fontFamily: 'Georgia, serif', fontSize: 16,
            }}
          />
        </div>
      </div>
    </div>
  )
}