'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useLayoutStore } from '@/store/layoutStore'
import api from '@/lib/api'

const PRESET_TAGS = ['词汇', '语法', '结构', '逻辑', '审题', '表达', '其他']

function StepNumber({ n }: { n: number }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      color: '#fff', fontSize: 14, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
    }}>{n}</div>
  )
}

export default function EditReflectionPage() {
  const router = useRouter()
  const params = useParams()
  const { collapsed } = useLayoutStore()
  const id = Number(params.id)

  const [title, setTitle]     = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags]       = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    api.get(`/reflections/${id}`)
      .then(res => {
        const r = res.data
        setTitle(r.title || '')
        setContent(r.content || '')
        setTags(r.tags ? r.tags.split(',').filter(Boolean) : [])
      })
      .catch(() => router.push('/dashboard/reflections'))
      .finally(() => setLoading(false))
  }, [id, router])

  const toggleTag = (t: string) => {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { alert('标题和内容不能为空'); return }
    setSaving(true)
    try {
      await api.put(`/reflections/${id}`, {
        title:   title.trim(),
        content: content.trim(),
        tags:    tags.join(','),
      })
      router.push('/dashboard/reflections')
    } catch {
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleExportWord = () => {
    const tagsText = tags.length > 0 ? `标签：${tags.join('、')}\n\n` : ''
    const date = new Date().toLocaleDateString('zh-CN')
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: "微软雅黑", Arial, sans-serif; font-size: 12pt; line-height: 1.8; margin: 2cm; }
          h1 { font-size: 18pt; color: #1e3a5f; border-bottom: 2px solid #3b82f6; padding-bottom: 8pt; margin-bottom: 16pt; }
          .meta { font-size: 10pt; color: #64748b; margin-bottom: 20pt; }
          .content { font-size: 12pt; color: #1e293b; white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">${tagsText}导出时间：${date}</div>
        <div class="content">${content.replace(/\n/g, '<br/>')}</div>
      </body>
      </html>
    `
    const blob = new Blob(['\ufeff' + html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || '笔记'}_${date}.doc`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📖</div>
      <div>加载中...</div>
    </div>
  )

  return (
    <div style={{
      maxWidth: collapsed ? 920 : '100%',
      margin: collapsed ? '0 20% 60px 5%' : '0 0 60px',
      transition: 'all .2s ease',
    }}>

      {/* 顶部 */}
      <div style={{ marginBottom: 28 }}>
        <button onClick={() => router.push('/dashboard/reflections')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#64748b', fontSize: 14, padding: 0, marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>← 返回积累反思</button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1e3a5f' }}>编辑笔记</div>
            <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>修改你的写作反思</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={handleExportWord} style={{
              padding: '10px 20px', borderRadius: 10,
              border: '1.5px solid #bfdbfe', background: '#eff6ff',
              color: '#1d4ed8', fontSize: 14, fontWeight: 500,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>📄</span> 导出 Word
            </button>
            <button onClick={() => router.push('/dashboard/reflections')} style={{
              padding: '10px 20px', borderRadius: 10,
              border: '1.5px solid #e2e8f0', background: '#fff',
              color: '#64748b', fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}>取消</button>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: saving ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(59,130,246,.25)',
            }}>{saving ? '保存中...' : '保存修改'}</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Step 1 — 标题 */}
        <div style={{
          background: '#fff', borderRadius: 16,
          border: '1px solid #e8f0fe',
          padding: '24px 28px',
          boxShadow: '0 1px 4px rgba(59,130,246,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <StepNumber n={1} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f' }}>标题</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>给这条笔记起个名字</div>
            </div>
          </div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="例如：关于让步状语从句的总结..."
            style={{
              width: '100%', padding: '12px 16px', fontSize: 15,
              borderRadius: 10, border: '1.5px solid #e2e8f0',
              background: '#f8fafc', color: '#1e3a5f', outline: 'none',
              boxSizing: 'border-box', fontFamily: 'inherit',
            }}
            onFocus={e => e.target.style.borderColor = '#93c5fd'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        {/* Step 2 — 内容 */}
        <div style={{
          background: '#fff', borderRadius: 16,
          border: '1px solid #e8f0fe',
          padding: '24px 28px',
          boxShadow: '0 1px 4px rgba(59,130,246,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <StepNumber n={2} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f' }}>内容</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>记录你的反思、总结、好词好句</div>
            </div>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="写下你的思考..."
            rows={10}
            style={{
              width: '100%', padding: '12px 16px', fontSize: 15,
              borderRadius: 10, border: '1.5px solid #e2e8f0',
              background: '#f8fafc', color: '#1e3a5f', outline: 'none',
              resize: 'vertical', lineHeight: 1.8,
              boxSizing: 'border-box', fontFamily: 'inherit',
            }}
            onFocus={e => e.target.style.borderColor = '#93c5fd'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8, textAlign: 'right' }}>{content.length} 字</div>
        </div>

        {/* Step 3 — 标签 */}
        <div style={{
          background: '#fff', borderRadius: 16,
          border: '1px solid #e8f0fe',
          padding: '24px 28px',
          boxShadow: '0 1px 4px rgba(59,130,246,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <StepNumber n={3} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f' }}>标签</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>选择分类标签，方便以后筛选（可多选）</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PRESET_TAGS.map(t => (
              <div
                key={t}
                onClick={() => toggleTag(t)}
                style={{
                  padding: '7px 20px', borderRadius: 20, fontSize: 14, cursor: 'pointer',
                  background: tags.includes(t) ? '#eff6ff' : '#f8fafc',
                  color: tags.includes(t) ? '#2563eb' : '#64748b',
                  border: `1.5px solid ${tags.includes(t) ? '#93c5fd' : '#e2e8f0'}`,
                  fontWeight: tags.includes(t) ? 600 : 400,
                  transition: 'all .15s',
                }}
              >{t}</div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}