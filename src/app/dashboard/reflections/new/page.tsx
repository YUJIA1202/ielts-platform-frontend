'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLayoutStore } from '@/store/layoutStore'
import api from '@/lib/api'

interface Submission {
  id: number
  status: string
  overallScore: number | null
  question: { content: string } | null
  customPrompt: string | null
}

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

export default function NewReflectionPage() {
  const router = useRouter()
  const { collapsed } = useLayoutStore()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [title, setTitle]             = useState('')
  const [content, setContent]         = useState('')
  const [tags, setTags]               = useState<string[]>([])
  const [submissionId, setSubmissionId] = useState<number | null>(null)
  const [mode, setMode]               = useState<'free' | 'linked'>('free')
  const [saving, setSaving]           = useState(false)

  useEffect(() => {
    api.get('/submissions/my')
      .then(res => setSubmissions((res.data || []).filter((s: Submission) => s.status === 'REVIEWED')))
      .catch(console.error)
  }, [])

  const toggleTag = (t: string) => {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { alert('标题和内容不能为空'); return }
    setSaving(true)
    try {
      await api.post('/reflections', {
        title:        title.trim(),
        content:      content.trim(),
        tags:         tags.join(','),
        submissionId: mode === 'linked' ? submissionId : null,
      })
      router.push('/dashboard/reflections')
    } catch {
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

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
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1e3a5f' }}>新建笔记</div>
            <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>记录你的写作收获和反思</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
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
            }}>{saving ? '保存中...' : '保存笔记'}</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Step 1 — 笔记类型 */}
        <div style={{
          background: '#fff', borderRadius: 16,
          border: '1px solid #e8f0fe',
          padding: '24px 28px',
          boxShadow: '0 1px 4px rgba(59,130,246,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <StepNumber n={1} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f' }}>笔记类型</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>选择自由记录或关联某次批改</div>
            </div>
          </div>

          <div style={{ marginTop: 16, display: 'flex', background: '#f0f9ff', borderRadius: 12, padding: 4, gap: 4 }}>
            {[
              { key: 'free'   as const, label: '✏️ 自由记录',    desc: '记录任意写作心得' },
              { key: 'linked' as const, label: '📎 关联批改记录', desc: '针对某次批改做总结' },
            ].map(opt => (
              <div
                key={opt.key}
                onClick={() => { setMode(opt.key); setSubmissionId(null) }}
                style={{
                  flex: 1, textAlign: 'center', padding: '11px 0', borderRadius: 9,
                  cursor: 'pointer', transition: 'all .15s',
                  background: mode === opt.key ? '#fff' : 'transparent',
                  boxShadow: mode === opt.key ? '0 1px 6px rgba(59,130,246,0.14)' : 'none',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: mode === opt.key ? 700 : 400, color: mode === opt.key ? '#2563eb' : '#94a3b8' }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: mode === opt.key ? '#60a5fa' : '#94a3b8', marginTop: 2 }}>{opt.desc}</div>
              </div>
            ))}
          </div>

          {/* 关联批改列表 */}
          {mode === 'linked' && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 10 }}>选择关联的批改记录</div>
              {submissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: 14 }}>暂无已批改记录</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {submissions.map(sub => (
                    <div
                      key={sub.id}
                      onClick={() => setSubmissionId(sub.id)}
                      style={{
                        padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                        border: `1.5px solid ${submissionId === sub.id ? '#3b82f6' : '#e8f0fe'}`,
                        background: submissionId === sub.id ? '#eff6ff' : '#f8fafc',
                        display: 'flex', alignItems: 'center', gap: 12,
                        transition: 'all .15s',
                      }}
                    >
                      <div style={{
                        fontSize: 18, fontWeight: 800,
                        color: submissionId === sub.id ? '#3b82f6' : '#94a3b8',
                        minWidth: 40, textAlign: 'center', flexShrink: 0,
                      }}>
                        {sub.overallScore != null ? sub.overallScore.toFixed(1) : '—'}
                      </div>
                      <div style={{
                        fontSize: 14, color: '#1e3a5f', fontWeight: 500, flex: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {sub.question?.content || sub.customPrompt || '自定义题目'}
                      </div>
                      {submissionId === sub.id && (
                        <span style={{ color: '#3b82f6', fontSize: 18, flexShrink: 0 }}>✓</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2 — 标题 */}
        <div style={{
          background: '#fff', borderRadius: 16,
          border: '1px solid #e8f0fe',
          padding: '24px 28px',
          boxShadow: '0 1px 4px rgba(59,130,246,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <StepNumber n={2} />
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

        {/* Step 3 — 内容 */}
        <div style={{
          background: '#fff', borderRadius: 16,
          border: '1px solid #e8f0fe',
          padding: '24px 28px',
          boxShadow: '0 1px 4px rgba(59,130,246,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <StepNumber n={3} />
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

        {/* Step 4 — 标签 */}
        <div style={{
          background: '#fff', borderRadius: 16,
          border: '1px solid #e8f0fe',
          padding: '24px 28px',
          boxShadow: '0 1px 4px rgba(59,130,246,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <StepNumber n={4} />
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