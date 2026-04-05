'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'

interface Question {
  id: number
  task: string
  subtype?: string
  topic?: string
  content: string
  outline?: string
  source?: string
  year?: number
  month?: number
  imageUrl?: string
  createdAt: string
  essays?: { id: number; score?: number; createdAt: string }[]
}

const TASK2_SUBTYPES = ['程度同意', '报告', '优缺点', '双边']
const TASK1_SUBTYPES = ['线图', '表格', '柱状图', '混合图', '饼图', '流程图', '地图']
const TASK1_DYNAMICS = ['静态', '动态']
const TOPICS = ['教育', '科技', '环境', '社会', '健康', '经济', '文化', '交通', '媒体', '政府']

export default function AdminQuestionDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [question, setQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    task: '', subtype: '', topic: '', content: '',
    source: '', year: '', month: '', outline: '',
  })

  useEffect(() => {
    api.get(`/questions/${id}`)
      .then(res => {
        const q = res.data
        setQuestion(q)
        setForm({
          task:     q.task,
          subtype:  q.subtype  || '',
          topic:    q.topic    || '',
          content:  q.content,
          source:   q.source   || '',
          year:     q.year     ? String(q.year)  : '',
          month:    q.month    ? String(q.month) : '',
          outline:  q.outline  || '',
        })
      })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleSave() {
    if (!form.content.trim()) { alert('题目内容不能为空'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('task', form.task)
      if (form.subtype) fd.append('subtype', form.subtype)
      if (form.topic)   fd.append('topic', form.topic)
      fd.append('content', form.content)
      if (form.source)  fd.append('source', form.source)
      if (form.year)    fd.append('year', form.year)
      if (form.month)   fd.append('month', form.month)
      fd.append('outline', form.outline)
      if (imageFile)    fd.append('image', imageFile)
      await api.put(`/questions/${id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      alert('保存成功')
      router.push('/admin/questions')
    } catch {
      alert('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: 14,
    borderRadius: 8, border: '1.5px solid #e8f0fe',
    background: '#f8faff', color: '#1e3a5f', outline: 'none',
    boxSizing: 'border-box',
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>加载中...</div>
  if (!question) return <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>题目不存在</div>

  return (
    <div style={{ maxWidth: '100%' }}>

      <button onClick={() => router.back()} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        marginBottom: 20, padding: '8px 16px', borderRadius: 8,
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
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e3a5f', marginBottom: 4 }}>
            编辑题目 #{question.id}
          </h1>
          <div style={{ fontSize: 13, color: '#64748b' }}>修改后点击保存生效</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => router.back()} style={{
            padding: '10px 20px', borderRadius: 10,
            border: '1.5px solid #e2e8f0', background: '#fff',
            color: '#64748b', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>取消</button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '10px 26px', borderRadius: 10, border: 'none',
            background: saving ? '#93c5fd' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}>{saving ? '保存中...' : '保存修改'}</button>
        </div>
      </div>

      {/* 基本信息表单 */}
      <div style={{
        background: '#fff', border: '1.5px solid #e8f0fe',
        borderRadius: 14, padding: '28px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1e3a5f', marginBottom: 20 }}>基本信息</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>题型 *</div>
            <select value={form.task}
              onChange={e => setForm(f => ({ ...f, task: e.target.value, subtype: '', topic: '' }))}
              style={{ ...inp, cursor: 'pointer' }}>
              <option value="TASK2">Task 2 大作文</option>
              <option value="TASK1">Task 1 小作文</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>
              {form.task === 'TASK1' ? '图表类型' : '作文类型'}
            </div>
            <select value={form.subtype}
              onChange={e => setForm(f => ({ ...f, subtype: e.target.value }))}
              style={{ ...inp, cursor: 'pointer' }}>
              <option value="">— 不限 —</option>
              {(form.task === 'TASK2' ? TASK2_SUBTYPES : TASK1_SUBTYPES).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>
              {form.task === 'TASK1' ? '图表特征' : '话题'}
            </div>
            <select value={form.topic}
              onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              style={{ ...inp, cursor: 'pointer' }}>
              <option value="">— 不限 —</option>
              {(form.task === 'TASK1' ? TASK1_DYNAMICS : TOPICS).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>来源</div>
            <input value={form.source}
              onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              placeholder="如：考场回忆" style={inp} />
          </div>
          <div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>年份</div>
            <input type="number" value={form.year}
              onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
              placeholder="如：2024" style={inp} />
          </div>
          <div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>月份</div>
            <input type="number" min={1} max={12} value={form.month}
              onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
              placeholder="如：9" style={inp} />
          </div>
        </div>

        <div style={{ marginBottom: 0 }}>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>题目内容 *</div>
          <textarea value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            rows={6} placeholder="输入完整题目内容..."
            style={{ ...inp, resize: 'vertical', lineHeight: 1.7 }} />
        </div>

        {form.task === 'TASK1' && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>
              题目图片（可选）
            </div>
            {question.imageUrl && !imageFile && (
              <div style={{ marginBottom: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={question.imageUrl.startsWith('http') ? question.imageUrl : `http://localhost:4000${question.imageUrl}`}
                  alt="题目图片"
                  style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 10, border: '1.5px solid #e8f0fe' }}
                />
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>当前图片，上传新图片将替换</div>
              </div>
            )}
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 8,
              border: imageFile ? '2px dashed #1d4ed8' : '2px dashed #93c5fd',
              borderRadius: 12, padding: '24px', cursor: 'pointer',
              background: imageFile ? '#eff6ff' : '#f8faff',
            }}>
              <span style={{ fontSize: 28 }}>{imageFile ? '🖼️' : '📷'}</span>
              <span style={{ fontSize: 14, color: imageFile ? '#1d4ed8' : '#64748b', fontWeight: 500 }}>
                {imageFile ? imageFile.name : '点击上传题目图片'}
              </span>
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => setImageFile(e.target.files?.[0] || null)} />
            </label>
          </div>
        )}
      </div>

      {/* 写作思路卡片 */}
      <div style={{
        background: '#fff', border: '1.5px solid #e8f0fe',
        borderRadius: 14, padding: '28px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e3a5f' }}>💡 写作思路</div>
          <span style={{
            fontSize: 12, padding: '2px 10px', borderRadius: 20,
            background: '#f0fdf4', color: '#16a34a', fontWeight: 500,
          }}>用户端「看思路」展示</span>
        </div>
        <textarea
          value={form.outline}
          onChange={e => setForm(f => ({ ...f, outline: e.target.value }))}
          rows={10}
          placeholder={`输入写作思路、提纲建议等内容，支持换行...\n\n例：\n【审题】本题为双边讨论题，需讨论两方观点并给出自己立场\n\n【结构】\n- 段1：引言 + 观点\n- 段2：支持一方论点\n- 段3：支持另一方论点\n- 段4：结论`}
          style={{ ...inp, resize: 'vertical', lineHeight: 1.8, minHeight: 200 }}
        />
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
          留空则用户端显示「暂无思路内容，管理员尚未添加」
        </div>
      </div>

      {/* 关联范文 */}
      {question.essays && question.essays.length > 0 && (
        <div style={{
          background: '#fff', border: '1.5px solid #e8f0fe',
          borderRadius: 14, padding: '24px',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1d4ed8', marginBottom: 14 }}>
            📝 关联范文（{question.essays.length} 篇）
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {question.essays.map(e => (
              <div key={e.id}
                onClick={() => router.push(`/admin/essays/${e.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', background: '#f8faff', borderRadius: 10,
                  cursor: 'pointer', border: '1px solid #e8f0fe',
                }}
                onMouseEnter={el => (el.currentTarget.style.background = '#eff6ff')}
                onMouseLeave={el => (el.currentTarget.style.background = '#f8faff')}
              >
                <span style={{ fontSize: 15, color: '#1e3a5f', fontWeight: 500 }}>范文 #{e.id}</span>
                {e.score && (
                  <span style={{ fontSize: 13, background: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>
                    ⭐ {e.score} 分
                  </span>
                )}
                <span style={{ fontSize: 13, color: '#94a3b8' }}>
                  {new Date(e.createdAt).toLocaleDateString('zh-CN')} →
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}