'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLayoutStore } from '@/store/layoutStore'
import api from '@/lib/api'

interface Reflection {
  id: number
  title: string
  content: string
  tags: string | null
  submissionId: number | null
  createdAt: string
  submission: {
    id: number
    overallScore: number | null
    question: { content: string } | null
    customPrompt: string | null
  } | null
}

const PRESET_TAGS = ['词汇', '语法', '结构', '逻辑', '审题', '表达', '其他']

function ReflectionCard({ r, onDelete }: { r: Reflection; onDelete: (e: React.MouseEvent) => void }) {
  const router = useRouter()
  const tags = r.tags ? r.tags.split(',').filter(Boolean) : []
  const preview = r.content.length > 100 ? r.content.slice(0, 100) + '...' : r.content

  return (
    <div
      onClick={() => router.push(`/dashboard/reflections/${r.id}/edit`)}
      style={{
        background: '#fff', borderRadius: 14,
        border: '1px solid #e8f0fe',
        padding: '18px 20px', cursor: 'pointer',
        transition: 'all .15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.10)'
        e.currentTarget.style.borderColor = '#93c5fd'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = '#e8f0fe'
        e.currentTarget.style.transform = 'none'
      }}
    >
      {/* 关联批改标记 */}
      {r.submission && (
        <div
          onClick={e => { e.stopPropagation(); router.push(`/dashboard/submissions/${r.submission!.id}`) }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: '#3b82f6', background: '#eff6ff',
            border: '1px solid #bfdbfe', borderRadius: 6,
            padding: '3px 10px', marginBottom: 10, cursor: 'pointer', fontWeight: 500,
          }}
        >
          <span>📎</span>
          <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {r.submission.question?.content || r.submission.customPrompt || '自定义题目'}
          </span>
          {r.submission.overallScore != null && (
            <span style={{ fontWeight: 700, flexShrink: 0 }}>{r.submission.overallScore.toFixed(1)}分</span>
          )}
        </div>
      )}

      {/* 标题行 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1e3a5f', lineHeight: 1.4 }}>{r.title}</div>
        <button
          onClick={onDelete}
          style={{
            padding: '4px 12px', borderRadius: 8, border: '1px solid #fee2e2',
            background: '#fff5f5', color: '#ef4444', fontSize: 12,
            cursor: 'pointer', fontWeight: 500, flexShrink: 0,
          }}
        >删除</button>
      </div>

      {/* 预览正文 */}
      <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 12 }}>
        {preview}
      </div>

      {/* 底部：标签 + 时间 + 箭头 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tags.map(t => (
            <span key={t} style={{
              fontSize: 12, padding: '2px 10px', borderRadius: 20,
              background: '#eff6ff', color: '#3b82f6',
              border: '1px solid #bfdbfe', fontWeight: 500,
            }}>{t}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            {new Date(r.createdAt).toLocaleDateString('zh-CN')}
          </span>
          <span style={{ fontSize: 18, color: '#bfdbfe' }}>›</span>
        </div>
      </div>
    </div>
  )
}

export default function ReflectionsPage() {
  const { collapsed } = useLayoutStore()
  const router = useRouter()
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [loading, setLoading]         = useState(true)
  const [keyword, setKeyword]         = useState('')
  const [inputValue, setInputValue]   = useState('')
  const [tagFilter, setTagFilter]     = useState('')

  const fetchReflections = async (kw = keyword, tag = tagFilter) => {
    const params = new URLSearchParams()
    if (kw)  params.append('keyword', kw)
    if (tag) params.append('tag', tag)
    const res = await api.get(`/reflections?${params.toString()}`)
    setReflections(res.data || [])
  }

  useEffect(() => {
    api.get('/reflections')
      .then(res => setReflections(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = () => {
    setKeyword(inputValue.trim())
    fetchReflections(inputValue.trim(), tagFilter)
  }

  const handleTagFilter = (t: string) => {
    const next = tagFilter === t ? '' : t
    setTagFilter(next)
    fetchReflections(keyword, next)
  }

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (!confirm('确认删除这条笔记？')) return
    await api.delete(`/reflections/${id}`)
    setReflections(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div style={{
      maxWidth: collapsed ? 920 : '100%',
      margin: collapsed ? '0 20% 60px 5%' : '0 0 60px',
      transition: 'all .2s ease',
    }}>

      {/* 页头 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#1e3a5f' }}>积累反思</div>
          <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>记录每次写作的收获，积累好词好句和思路</div>
        </div>
        <button
          onClick={() => router.push('/dashboard/reflections/new')}
          style={{
            padding: '10px 22px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff', fontWeight: 600, fontSize: 14,
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(59,130,246,.25)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: 16 }}>+</span> 新建笔记
        </button>
      </div>

      {/* 搜索栏 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#94a3b8', pointerEvents: 'none' }}>🔍</span>
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              placeholder="搜索标题或内容..."
              style={{
                width: '100%', padding: '10px 14px 10px 42px', fontSize: 14,
                borderRadius: 10, border: '1.5px solid #e2e8f0',
                background: '#fff', color: '#1e3a5f', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {inputValue && (
              <span
                onClick={() => { setInputValue(''); setKeyword(''); fetchReflections('', tagFilter) }}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#94a3b8', cursor: 'pointer' }}
              >×</span>
            )}
          </div>
          <button onClick={handleSearch} style={{
            padding: '10px 22px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(59,130,246,.2)', flexShrink: 0,
          }}>搜索</button>
        </div>
      </div>

      {/* 标签筛选 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {['全部', ...PRESET_TAGS].map(t => (
          <div
            key={t}
            onClick={() => handleTagFilter(t === '全部' ? '' : t)}
            style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              background: (t === '全部' ? tagFilter === '' : tagFilter === t) ? '#eff6ff' : '#fff',
              color: (t === '全部' ? tagFilter === '' : tagFilter === t) ? '#3b82f6' : '#64748b',
              border: `1px solid ${(t === '全部' ? tagFilter === '' : tagFilter === t) ? '#93c5fd' : '#e2e8f0'}`,
              fontWeight: (t === '全部' ? tagFilter === '' : tagFilter === t) ? 600 : 400,
              transition: 'all .15s',
            }}
          >{t}</div>
        ))}
      </div>

      {/* 내容区 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📖</div>
          <div style={{ fontSize: 15 }}>加载中...</div>
        </div>
      ) : reflections.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1e3a5f', marginBottom: 8 }}>
            {keyword || tagFilter ? '没有找到匹配的笔记' : '还没有笔记'}
          </div>
          <div style={{ fontSize: 14, marginBottom: 24 }}>
            {keyword || tagFilter ? '换个关键词试试' : '点击「新建笔记」开始积累你的写作反思'}
          </div>
          {!keyword && !tagFilter && (
            <button
              onClick={() => router.push('/dashboard/reflections/new')}
              style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >+ 新建第一条笔记</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, marginBottom: 4 }}>
            共 {reflections.length} 条笔记
          </div>
          {reflections.map(r => (
            <ReflectionCard
              key={r.id}
              r={r}
              onDelete={e => handleDelete(e, r.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}