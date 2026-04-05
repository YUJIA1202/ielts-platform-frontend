'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLayoutStore } from '@/store/layoutStore'
import api from '@/lib/api'

interface Submission {
  id: number
  status: 'PENDING' | 'REVIEWED'
  task: string
  createdAt: string
  imageUrl?: string
  wordFileUrl?: string
  content?: string
  customPrompt?: string
  user: { id: number; username?: string; phone: string }
  question?: { content: string }
  correctionCode?: { code: string; type: string }
}

function StatusBadge({ status }: { status: string }) {
  const isPending = status === 'PENDING'
  return (
    <span style={{
      fontSize: 13, padding: '4px 12px', borderRadius: 20, fontWeight: 600,
      background: isPending ? '#fef3c7' : '#dcfce7',
      color: isPending ? '#92400e' : '#166534',
    }}>
      {isPending ? '待批改' : '已完成'}
    </span>
  )
}

function TaskBadge({ task }: { task: string }) {
  const isT2 = task === 'TASK2'
  return (
    <span style={{
      fontSize: 13, padding: '4px 12px', borderRadius: 20, fontWeight: 600,
      background: isT2 ? '#eff6ff' : '#f0fdf4',
      color: isT2 ? '#1d4ed8' : '#166634',
    }}>
      {isT2 ? 'Task 2' : 'Task 1'}
    </span>
  )
}

export default function AdminSubmissionsPage() {
  const router = useRouter()
  const { collapsed } = useLayoutStore()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [taskFilter, setTaskFilter] = useState('ALL')

  useEffect(() => {
    api.get('/submissions/all')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.submissions ?? []
        setSubmissions(data)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = submissions.filter(s => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false
    if (taskFilter !== 'ALL' && s.task !== taskFilter) return false
    return true
  })

  const pendingCount = submissions.filter(s => s.status === 'PENDING').length
  const reviewedCount = submissions.filter(s => s.status === 'REVIEWED').length

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return '刚刚'
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}天前`
    return d.toLocaleDateString('zh-CN')
  }

  const selectStyle: React.CSSProperties = {
    fontSize: 14, padding: '8px 14px',
    borderRadius: 8, border: '1.5px solid #e8f0fe',
    background: '#fff', color: '#374151', cursor: 'pointer', outline: 'none',
  }

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto' }}>

      {/* 页头 */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        border: '1.5px solid #bfdbfe',
        borderLeft: '5px solid #1d4ed8',
        borderRadius: 16, padding: '24px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e3a5f', marginBottom: 6 }}>
            批改工作台
          </h1>
          <div style={{ fontSize: 15, color: '#64748b' }}>
            当前待批改 <strong style={{ color: '#d97706' }}>{pendingCount}</strong> 篇
          </div>
        </div>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, flexShrink: 0,
        }}>✏️</div>
      </div>

      {/* 统计卡片 */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 14, marginBottom: 24,
      }}>
        {[
          { label: '全部提交', value: submissions.length, color: '#1e3a5f', accent: '#3b82f6', icon: '📋' },
          { label: '待批改',   value: pendingCount,        color: '#d97706', accent: '#f59e0b', icon: '⏳' },
          { label: '已完成',   value: reviewedCount,       color: '#16a34a', accent: '#10b981', icon: '✅' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: '#fff', border: '1.5px solid #e8f0fe',
            borderTop: `3px solid ${stat.accent}`,
            borderRadius: 14, padding: '20px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>{stat.label}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${stat.accent}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* 筛选栏 */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center',
        background: '#fff', border: '1.5px solid #e8f0fe',
        borderRadius: 12, padding: '12px 16px',
      }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="ALL">全部状态</option>
          <option value="PENDING">待批改</option>
          <option value="REVIEWED">已完成</option>
        </select>
        <select value={taskFilter} onChange={e => setTaskFilter(e.target.value)} style={selectStyle}>
          <option value="ALL">全部类型</option>
          <option value="TASK1">Task 1</option>
          <option value="TASK2">Task 2</option>
        </select>
        <div style={{
          marginLeft: 'auto', fontSize: 14, color: '#94a3b8',
          background: '#f8faff', padding: '6px 14px', borderRadius: 8,
          border: '1px solid #e8f0fe',
        }}>
          共 <strong style={{ color: '#1d4ed8' }}>{filtered.length}</strong> 条
        </div>
      </div>

      {/* 内容区 — 折叠时用卡片，展开时用表格 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 16 }}>加载中...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 16 }}>暂无数据</div>
      ) : collapsed ? (
        // 折叠模式：卡片列表
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(sub => {
            const preview = sub.question?.content || sub.customPrompt || sub.content || '—'
            const isPending = sub.status === 'PENDING'
            return (
              <div key={sub.id} style={{
                background: '#fff', border: '1.5px solid #e8f0fe',
                borderRadius: 14, padding: '18px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {(sub.user.username || sub.user.phone)?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: 15 }}>
                        {sub.user.username || sub.user.phone}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{sub.user.phone}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <TaskBadge task={sub.task} />
                    <StatusBadge status={sub.status} />
                  </div>
                </div>
                <div style={{
                  fontSize: 14, color: '#374151', marginBottom: 14,
                  background: '#f8faff', borderRadius: 8, padding: '10px 14px',
                  lineHeight: 1.6,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {preview.slice(0, 80)}{preview.length > 80 ? '...' : ''}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>{formatTime(sub.createdAt)}</span>
                  <button
                    onClick={() => router.push(`/admin/submissions/${sub.id}`)}
                    style={{
                      fontSize: 14, padding: '9px 20px',
                      borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: isPending
                        ? 'linear-gradient(135deg, #1d4ed8, #3b82f6)'
                        : '#f1f5f9',
                      color: isPending ? '#fff' : '#64748b',
                      fontWeight: 600,
                    }}
                  >
                    {isPending ? '开始批改 →' : '查看详情'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // 展开模式：表格
        <div style={{
          background: '#fff', border: '1.5px solid #e8f0fe',
          borderRadius: 14, overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #f8faff, #eff6ff)' }}>
                {['用户', '类型', '提交时间', '题目/内容预览', '附件', '状态', '操作'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '14px 18px',
                    fontSize: 14, fontWeight: 600, color: '#64748b',
                    borderBottom: '1.5px solid #e8f0fe',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub, i) => {
                const preview = sub.question?.content || sub.customPrompt || sub.content || '—'
                return (
                  <tr key={sub.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8faff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>
                          {(sub.user.username || sub.user.phone)?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e3a5f', fontSize: 15 }}>
                            {sub.user.username || sub.user.phone}
                          </div>
                          {sub.user.username && (
                            <div style={{ fontSize: 13, color: '#94a3b8' }}>{sub.user.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 18px' }}><TaskBadge task={sub.task} /></td>
                    <td style={{ padding: '16px 18px', color: '#94a3b8', fontSize: 14, whiteSpace: 'nowrap' }}>
                      {formatTime(sub.createdAt)}
                    </td>
                    <td style={{ padding: '16px 18px', maxWidth: 240 }}>
                      <div style={{
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        color: '#374151', fontSize: 15,
                      }}>
                        {preview.slice(0, 60)}{preview.length > 60 ? '...' : ''}
                      </div>
                    </td>
                    <td style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {sub.imageUrl && (
                          <span style={{ fontSize: 13, background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: 6, fontWeight: 500 }}>🖼️ 图片</span>
                        )}
                        {sub.wordFileUrl && (
                          <span style={{ fontSize: 13, background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: 6, fontWeight: 500 }}>📄 Word</span>
                        )}
                        {sub.content && (
                          <span style={{ fontSize: 13, background: '#faf5ff', color: '#7c3aed', padding: '4px 10px', borderRadius: 6, fontWeight: 500 }}>📝 文本</span>
                        )}
                        {!sub.imageUrl && !sub.wordFileUrl && !sub.content && (
                          <span style={{ color: '#94a3b8', fontSize: 14 }}>—</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 18px' }}><StatusBadge status={sub.status} /></td>
                    <td style={{ padding: '16px 18px' }}>
                      <button
                        onClick={() => router.push(`/admin/submissions/${sub.id}`)}
                        style={{
                          fontSize: 14, padding: '10px 22px',
                          borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: sub.status === 'PENDING'
                            ? 'linear-gradient(135deg, #1d4ed8, #3b82f6)'
                            : '#f1f5f9',
                          color: sub.status === 'PENDING' ? '#fff' : '#64748b',
                          fontWeight: 600, whiteSpace: 'nowrap',
                        }}
                      >
                        {sub.status === 'PENDING' ? '开始批改 →' : '查看详情'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}