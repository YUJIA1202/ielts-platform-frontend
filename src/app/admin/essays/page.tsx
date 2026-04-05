'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  year?: number
  month?: number
  source?: string
  createdAt: string
  questionId: number
}

export default function AdminEssaysPage() {
  const router = useRouter()
  const [essays, setEssays] = useState<Essay[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [taskFilter, setTaskFilter] = useState('ALL')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const limit = 10

  const fetchEssays = () => {
    setLoading(true)
    const params: Record<string, string> = { page: String(page), limit: String(limit) }
    if (taskFilter !== 'ALL') params.task = taskFilter
    if (keyword) params.keyword = keyword
    api.get('/essays', { params })
      .then(res => { setEssays(res.data.essays || []); setTotal(res.data.total || 0) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchEssays()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, taskFilter])

  async function handleDelete(id: number) {
    try {
      await api.delete(`/essays/${id}`)
      setDeleteId(null)
      fetchEssays()
    } catch {
      alert('删除失败')
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: 14,
    borderRadius: 8, border: '1.5px solid #e8f0fe',
    background: '#f8faff', color: '#1e3a5f', outline: 'none',
  }
  const totalPages = Math.ceil(total / limit)

  return (
    <div style={{ maxWidth: '100%' }}>

      {/* 页头 */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        border: '1.5px solid #bfdbfe', borderLeft: '5px solid #1d4ed8',
        borderRadius: 16, padding: '24px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e3a5f', marginBottom: 6 }}>范文管理</h1>
          <div style={{ fontSize: 15, color: '#64748b' }}>
            共 <strong style={{ color: '#1d4ed8' }}>{total}</strong> 篇范文
          </div>
        </div>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
        }}>📝</div>
      </div>

      {/* 筛选 */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center',
        background: '#fff', border: '1.5px solid #e8f0fe',
        borderRadius: 12, padding: '12px 16px', flexWrap: 'wrap',
      }}>
        <select value={taskFilter} onChange={e => { setTaskFilter(e.target.value); setPage(1) }}
          style={{ ...inp, width: 'auto', cursor: 'pointer' }}>
          <option value="ALL">全部类型</option>
          <option value="TASK1">Task 1</option>
          <option value="TASK2">Task 2</option>
        </select>
        <input
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchEssays()}
          placeholder="搜索范文内容..."
          style={{ ...inp, width: 220 }}
        />
        <button onClick={fetchEssays} style={{
          padding: '10px 18px', borderRadius: 8, border: 'none',
          background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}>搜索</button>
        <button
          onClick={() => router.push('/admin/essays/new')}
          style={{
            marginLeft: 'auto', padding: '10px 20px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}
        >+ 新增范文</button>
      </div>

      {/* 列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 16 }}>加载中...</div>
      ) : essays.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 16 }}>暂无数据</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {essays.map(e => (
            <div
              key={e.id}
              onClick={() => router.push(`/admin/essays/${e.id}`)}
              style={{
                background: '#fff', border: '1.5px solid #e8f0fe',
                borderRadius: 14, padding: '20px 24px',
                cursor: 'pointer', transition: 'background .15s',
              }}
              onMouseEnter={el => (el.currentTarget.style.background = '#f8faff')}
              onMouseLeave={el => (el.currentTarget.style.background = '#fff')}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    <span style={{
                      fontSize: 13, padding: '4px 12px', borderRadius: 20, fontWeight: 600,
                      background: e.task === 'TASK2' ? '#eff6ff' : '#f0fdf4',
                      color: e.task === 'TASK2' ? '#1d4ed8' : '#166534',
                    }}>
                      {e.task === 'TASK2' ? 'Task 2' : 'Task 1'}
                    </span>
                    {e.subtype && <span style={{ fontSize: 13, padding: '4px 10px', borderRadius: 20, background: '#f5f3ff', color: '#7c3aed', fontWeight: 500 }}>{e.subtype}</span>}
                    {e.topic && <span style={{ fontSize: 13, padding: '4px 10px', borderRadius: 20, background: '#fef9c3', color: '#854d0e', fontWeight: 500 }}>{e.topic}</span>}
                    {e.score && <span style={{ fontSize: 13, padding: '4px 10px', borderRadius: 20, background: '#fef3c7', color: '#92400e', fontWeight: 700 }}>⭐ {e.score} 分</span>}
                    {e.annotatedPdfUrl && <span style={{ fontSize: 13, padding: '4px 10px', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', fontWeight: 500 }}>📎 含批注PDF</span>}
                  </div>
                  {e.questionContent && (
                    <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8, fontStyle: 'italic' }}>
                      题目：{e.questionContent.slice(0, 80)}{e.questionContent.length > 80 ? '...' : ''}
                    </div>
                  )}
                  <div style={{
                    fontSize: 15, color: '#1e3a5f', lineHeight: 1.7,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {e.content}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}
                  onClick={ev => ev.stopPropagation()}>
                  <button onClick={() => router.push(`/admin/essays/${e.id}`)}
                    style={{ fontSize: 14, padding: '8px 18px', borderRadius: 8, border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, cursor: 'pointer' }}>
                    编辑
                  </button>
                  <button onClick={() => setDeleteId(e.id)}
                    style={{ fontSize: 14, padding: '8px 18px', borderRadius: 8, border: '1.5px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontWeight: 600, cursor: 'pointer' }}>
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e8f0fe', background: page === 1 ? '#f8faff' : '#fff', color: page === 1 ? '#94a3b8' : '#1d4ed8', fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 14 }}>← 上一页</button>
          <span style={{ padding: '8px 16px', fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center' }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e8f0fe', background: page === totalPages ? '#f8faff' : '#fff', color: page === totalPages ? '#94a3b8' : '#1d4ed8', fontWeight: 600, cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 14 }}>下一页 →</button>
        </div>
      )}

      {/* 删除确认 */}
      {deleteId !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px', width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: 20, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f', marginBottom: 8 }}>确认删除？</div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>删除后无法恢复。</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteId(null)}
                style={{ padding: '10px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 14, cursor: 'pointer' }}>取消</button>
              <button onClick={() => handleDelete(deleteId)}
                style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}