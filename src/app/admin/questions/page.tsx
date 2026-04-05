'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLayoutStore } from '@/store/layoutStore'
import api from '@/lib/api'

interface Question {
  id: number
  task: string
  subtype?: string
  topic?: string
  content: string
  source?: string
  year?: number
  month?: number
  createdAt: string
}

export default function AdminQuestionsPage() {
  const router = useRouter()
  const { collapsed } = useLayoutStore()
  const [questions, setQuestions] = useState<Question[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [taskFilter, setTaskFilter] = useState('ALL')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const limit = 15

  const fetchQuestions = () => {
    setLoading(true)
    const params: Record<string, string> = { page: String(page), limit: String(limit) }
    if (taskFilter !== 'ALL') params.task = taskFilter
    if (keyword) params.keyword = keyword
    api.get('/questions', { params })
      .then(res => { setQuestions(res.data.questions || []); setTotal(res.data.total || 0) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchQuestions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, taskFilter])

  async function handleDelete(id: number) {
    try { await api.delete(`/questions/${id}`); setDeleteId(null); fetchQuestions() }
    catch { alert('删除失败') }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: 14,
    borderRadius: 8, border: '1.5px solid #e8f0fe',
    background: '#f8faff', color: '#1e3a5f', outline: 'none',
  }

  const totalPages = Math.ceil(total / limit)

  const TaskBadge = ({ task }: { task: string }) => (
    <span style={{
      fontSize: 13, padding: '4px 12px', borderRadius: 20, fontWeight: 600,
      whiteSpace: 'nowrap',
      background: task === 'TASK2' ? '#eff6ff' : '#f0fdf4',
      color: task === 'TASK2' ? '#1d4ed8' : '#166534',
    }}>
      {task === 'TASK2' ? 'Task 2' : 'Task 1'}
    </span>
  )

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
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e3a5f', marginBottom: 6 }}>真题管理</h1>
          <div style={{ fontSize: 15, color: '#64748b' }}>
            共 <strong style={{ color: '#1d4ed8' }}>{total}</strong> 道题目
          </div>
        </div>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
        }}>📚</div>
      </div>

      {/* 筛选栏 */}
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
          onKeyDown={e => e.key === 'Enter' && fetchQuestions()}
          placeholder="搜索题目内容..."
          style={{ ...inp, width: 220 }}
        />
        <button onClick={fetchQuestions} style={{
          padding: '10px 18px', borderRadius: 8, border: 'none',
          background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}>搜索</button>
        <button
          onClick={() => router.push('/admin/questions/new')}
          style={{
            marginLeft: 'auto', padding: '10px 20px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}
        >+ 新增题目</button>
      </div>

      {/* 内容 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 16 }}>加载中...</div>
      ) : questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 16 }}>暂无数据</div>
      ) : collapsed ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {questions.map(q => (
            <div key={q.id}
              onClick={() => router.push(`/admin/questions/${q.id}`)}
              style={{
                background: '#fff', border: '1.5px solid #e8f0fe',
                borderRadius: 14, padding: '18px 20px', cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8faff')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <TaskBadge task={q.task} />
                  {q.subtype && <span style={{ fontSize: 13, padding: '4px 10px', borderRadius: 20, background: '#f5f3ff', color: '#7c3aed', fontWeight: 500 }}>{q.subtype}</span>}
                  {q.topic && <span style={{ fontSize: 13, padding: '4px 10px', borderRadius: 20, background: '#fef9c3', color: '#854d0e', fontWeight: 500 }}>{q.topic}</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => router.push(`/admin/questions/${q.id}`)}
                    style={{ fontSize: 13, padding: '6px 14px', borderRadius: 8, border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, cursor: 'pointer' }}>编辑</button>
                  <button onClick={() => setDeleteId(q.id)}
                    style={{ fontSize: 13, padding: '6px 14px', borderRadius: 8, border: '1.5px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontWeight: 600, cursor: 'pointer' }}>删除</button>
                </div>
              </div>
              <div style={{ fontSize: 15, color: '#1e3a5f', lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.content}</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>
                {q.source && `${q.source} · `}{q.year && `${q.year}/${q.month}`}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1.5px solid #e8f0fe', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #f8faff, #eff6ff)' }}>
                {['ID', '类型', '子类型', '话题/特征', '题目内容', '来源', '年份', '操作'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#64748b', borderBottom: '1.5px solid #e8f0fe', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={q.id}
                  onClick={() => router.push(`/admin/questions/${q.id}`)}
                  style={{ borderBottom: i < questions.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background .15s', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8faff')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '16px', color: '#94a3b8', fontSize: 14, whiteSpace: 'nowrap' }}>#{q.id}</td>
                  <td style={{ padding: '16px', whiteSpace: 'nowrap' }}><TaskBadge task={q.task} /></td>
                  <td style={{ padding: '16px', fontSize: 14, color: '#374151', whiteSpace: 'nowrap' }}>{q.subtype || '—'}</td>
                  <td style={{ padding: '16px', fontSize: 14, color: '#374151', whiteSpace: 'nowrap' }}>{q.topic || '—'}</td>
                  <td style={{ padding: '16px', maxWidth: 280 }}>
                    <div style={{ fontSize: 15, color: '#1e3a5f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.content}</div>
                  </td>
                  <td style={{ padding: '16px', fontSize: 14, color: '#94a3b8', whiteSpace: 'nowrap' }}>{q.source || '—'}</td>
                  <td style={{ padding: '16px', fontSize: 14, color: '#94a3b8', whiteSpace: 'nowrap' }}>{q.year ? `${q.year}/${q.month || '?'}` : '—'}</td>
                  <td style={{ padding: '16px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => router.push(`/admin/questions/${q.id}`)}
                        style={{ fontSize: 14, padding: '8px 16px', borderRadius: 8, border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>编辑</button>
                      <button onClick={() => setDeleteId(q.id)}
                        style={{ fontSize: 14, padding: '8px 16px', borderRadius: 8, border: '1.5px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>删除后无法恢复，该题目关联的范文也会受影响。</div>
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