'use client'

import { useEffect, useState } from 'react'
import { useLayoutStore } from '@/store/layoutStore'
import api from '@/lib/api'

interface Message {
  id: number
  type: string
  title: string
  content: string
  isRead: boolean
  createdAt: string
  user: {
    id: number
    phone: string
    username: string
    subscription: string
  }
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string; group: string }> = {
  question:   { label: '使用问题', color: '#2563eb', bg: '#eff6ff', icon: '❓', group: '客服留言' },
  payment:    { label: '支付问题', color: '#d97706', bg: '#fef3c7', icon: '💳', group: '客服留言' },
  correction: { label: '批改问题', color: '#7c3aed', bg: '#f5f3ff', icon: '✏️', group: '客服留言' },
  suggestion: { label: '功能建议', color: '#0891b2', bg: '#ecfeff', icon: '💡', group: '意见反馈' },
  bug:        { label: '问题反馈', color: '#dc2626', bg: '#fef2f2', icon: '🐛', group: '意见反馈' },
  content:    { label: '内容建议', color: '#16a34a', bg: '#f0fdf4', icon: '📝', group: '意见反馈' },
  other:      { label: '其他',     color: '#64748b', bg: '#f1f5f9', icon: '💬', group: '意见反馈' },
}

const GROUPS = [
  { key: 'ALL',    label: '全部',   types: [] as string[] },
  { key: '客服留言', label: '客服留言', types: ['question', 'payment', 'correction'] },
  { key: '意见反馈', label: '意见反馈', types: ['suggestion', 'bug', 'content', 'other'] },
]

const SUB_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  FREE:  { label: '免费',   color: '#64748b', bg: '#f1f5f9' },
  BASIC: { label: '基础版', color: '#d97706', bg: '#fef3c7' },
  PRO:   { label: '专业版', color: '#7c3aed', bg: '#f5f3ff' },
}

function SubBadge({ sub }: { sub: string }) {
  const s = SUB_LABELS[sub] || SUB_LABELS.FREE
  return (
    <span style={{
      fontSize: 11, padding: '3px 9px', borderRadius: 20,
      fontWeight: 600, background: s.bg, color: s.color, whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

function DetailModal({ msg, onClose, onMarkRead }: {
  msg: Message
  onClose: () => void
  onMarkRead: (id: number) => void
}) {
  const cfg = TYPE_CONFIG[msg.type] || TYPE_CONFIG.other
  const dt  = new Date(msg.createdAt)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, padding: '32px',
          width: '100%', maxWidth: 1000,
          boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
          maxHeight: '85vh', overflowY: 'auto',
        }}
      >
        {/* 头部 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg,
                padding: '3px 9px', borderRadius: 6,
              }}>
                {cfg.icon} {cfg.label}
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>#{msg.id}</span>
              {msg.isRead ? (
                <span style={{ fontSize: 11, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>✓ 已读</span>
              ) : (
                <span style={{ fontSize: 11, color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>未读</span>
              )}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1e3a5f', lineHeight: 1.4 }}>
              {msg.title}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e2e8f0',
              background: '#f8faff', color: '#64748b', fontSize: 16,
              cursor: 'pointer', flexShrink: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {/* 用户信息 */}
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          border: '1.5px solid #bfdbfe', borderRadius: 12,
          padding: '14px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: '#fff',
          }}>
            {msg.user.username?.[0]?.toUpperCase() || msg.user.phone[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e3a5f' }}>
              {msg.user.username || '未设置昵称'}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{msg.user.phone}</div>
          </div>
          <SubBadge sub={msg.user.subscription} />
        </div>

        {/* 内容 */}
        <div style={{
          background: '#f8faff', border: '1.5px solid #e8f0fe',
          borderRadius: 12, padding: '16px 18px', marginBottom: 20,
        }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8, fontWeight: 500 }}>留言内容</div>
          <div style={{ fontSize: 14, color: '#1e3a5f', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {msg.content}
          </div>
        </div>

        {/* 底部 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            {dt.toLocaleDateString('zh-CN')} {dt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </div>
          {!msg.isRead && (
            <button
              onClick={() => { onMarkRead(msg.id); onClose() }}
              style={{
                padding: '8px 18px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              标记为已读
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminMessagesPage() {
  const { collapsed } = useLayoutStore()

  const [messages, setMessages]       = useState<Message[]>([])
  const [total, setTotal]             = useState(0)
  const [loading, setLoading]         = useState(true)
  const [groupFilter, setGroupFilter] = useState('ALL')
  const [typeFilter, setTypeFilter]   = useState('ALL')
  const [readFilter, setReadFilter]   = useState<'ALL' | 'unread' | 'read'>('ALL')
  const [page, setPage]               = useState(1)
  const [selected, setSelected]       = useState<Message | null>(null)
  const limit = 20

  useEffect(() => {
    const params: Record<string, string> = { page: String(page), limit: String(limit) }
    if (typeFilter !== 'ALL') params.type = typeFilter
    if (readFilter === 'unread') params.isRead = 'false'
    if (readFilter === 'read')   params.isRead = 'true'
    api.get('/messages', { params })
      .then(res => {
        setMessages(res.data.messages || [])
        setTotal(res.data.total || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page, typeFilter, readFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMarkRead = async (id: number) => {
    try {
      await api.patch(`/messages/${id}/read`, {})
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m))
    } catch {
      alert('操作失败')
    }
  }

  const handleMarkAllRead = async () => {
    const unread = messages.filter(m => !m.isRead)
    await Promise.all(unread.map(m => api.patch(`/messages/${m.id}/read`, {})))
    setMessages(prev => prev.map(m => ({ ...m, isRead: true })))
  }

  const unreadCount = messages.filter(m => !m.isRead).length
  const totalPages  = Math.ceil(total / limit) || 1
  const currentGroupTypes = GROUPS.find(g => g.key === groupFilter)?.types || []

  return (
  <div style={collapsed
  ? { maxWidth: 960, margin: '0 5% 0 3%', transition: 'all .2s ease' }
  : { maxWidth: '100%', margin: '0', transition: 'all .2s ease' }
}>

      {/* 页头 */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        border: '1.5px solid #bfdbfe', borderLeft: '5px solid #1d4ed8',
        borderRadius: 16, padding: '24px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e3a5f', marginBottom: 6 }}>用户留言</h1>
          <div style={{ fontSize: 15, color: '#64748b' }}>
            共 <strong style={{ color: '#1d4ed8' }}>{total}</strong> 条
            {unreadCount > 0 && (
              <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '2px 10px', borderRadius: 20 }}>
                {unreadCount} 条未读
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                padding: '9px 18px', borderRadius: 9,
                border: '1.5px solid #bfdbfe', background: '#fff',
                color: '#1d4ed8', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              全部标为已读
            </button>
          )}
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>💬</div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div style={{
        background: '#fff', border: '1.5px solid #e8f0fe',
        borderRadius: 12, padding: '14px 16px', marginBottom: 16,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {/* 大类 + 已读筛选 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, marginRight: 4 }}>分类：</span>
          {GROUPS.map(g => (
            <button
              key={g.key}
              onClick={() => { setGroupFilter(g.key); setTypeFilter('ALL'); setPage(1) }}
              style={{
                padding: '6px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer', border: 'none',
                background: groupFilter === g.key ? '#1d4ed8' : 'rgba(29,78,216,0.08)',
                color: groupFilter === g.key ? '#fff' : '#1d4ed8',
                fontWeight: groupFilter === g.key ? 700 : 500, transition: 'all .15s',
              }}
            >
              {g.label}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {(['ALL', 'unread', 'read'] as const).map(r => (
              <button
                key={r}
                onClick={() => { setReadFilter(r); setPage(1) }}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                  border: readFilter === r ? '1.5px solid #1d4ed8' : '1.5px solid #e8f0fe',
                  background: readFilter === r ? '#eff6ff' : '#f8faff',
                  color: readFilter === r ? '#1d4ed8' : '#94a3b8',
                  fontWeight: readFilter === r ? 700 : 400,
                }}
              >
                {r === 'ALL' ? '全部' : r === 'unread' ? '未读' : '已读'}
              </button>
            ))}
          </div>
        </div>

        {/* 细分类型 */}
        {groupFilter !== 'ALL' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, marginRight: 4 }}>细分：</span>
            <button
              onClick={() => { setTypeFilter('ALL'); setPage(1) }}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: 'none',
                background: typeFilter === 'ALL' ? '#1d4ed8' : 'rgba(29,78,216,0.08)',
                color: typeFilter === 'ALL' ? '#fff' : '#1d4ed8',
                fontWeight: typeFilter === 'ALL' ? 700 : 500,
              }}
            >
              全部
            </button>
            {currentGroupTypes.map(key => {
              const cfg = TYPE_CONFIG[key]
              return (
                <button
                  key={key}
                  onClick={() => { setTypeFilter(key); setPage(1) }}
                  style={{
                    padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: 'none',
                    background: typeFilter === key ? cfg.color : cfg.bg,
                    color: typeFilter === key ? '#fff' : cfg.color,
                    fontWeight: typeFilter === key ? 700 : 500,
                  }}
                >
                  {cfg.icon} {cfg.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 内容 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 16 }}>加载中...</div>
      ) : messages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <div style={{ color: '#94a3b8', fontSize: 15 }}>暂无留言</div>
        </div>
      ) : collapsed ? (

        // 折叠：卡片模式
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {messages.map(msg => {
            const cfg = TYPE_CONFIG[msg.type] || TYPE_CONFIG.other
            const dt  = new Date(msg.createdAt)
            return (
              <div
                key={msg.id}
                onClick={() => { setSelected(msg); if (!msg.isRead) handleMarkRead(msg.id) }}
                style={{
                  background: msg.isRead ? '#fff' : '#fefbff',
                  borderRadius: 14, border: '1.5px solid #e8f0fe',
                  borderLeft: `4px solid ${msg.isRead ? '#e8f0fe' : cfg.color}`,
                  padding: '14px 18px', cursor: 'pointer', transition: 'background .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8faff')}
                onMouseLeave={e => (e.currentTarget.style.background = msg.isRead ? '#fff' : '#fefbff')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 700, color: '#fff',
                  }}>
                    {msg.user.username?.[0]?.toUpperCase() || msg.user.phone[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1e3a5f' }}>
                        {msg.user.username || msg.user.phone}
                      </span>
                      <SubBadge sub={msg.user.subscription} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: 6 }}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {!msg.isRead && (
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
                      )}
                      <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto', flexShrink: 0 }}>
                        {dt.toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: msg.isRead ? 400 : 600, color: '#1e3a5f', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {msg.title}
                    </div>
                    <div style={{ fontSize: 13, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      ) : (

        // 展开：表格模式
        <div style={{
          background: '#fff', border: '1.5px solid #e8f0fe',
          borderRadius: 14, overflow: 'hidden', marginBottom: 16,
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #f8faff, #eff6ff)' }}>
                {['', '用户', '类型', '标题', '内容预览', '提交时间', '操作'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '14px 16px',
                    fontSize: 14, fontWeight: 600, color: '#64748b',
                    borderBottom: '1.5px solid #e8f0fe', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {messages.map((msg, i) => {
                const cfg     = TYPE_CONFIG[msg.type] || TYPE_CONFIG.other
                const dt      = new Date(msg.createdAt)
                const isToday = new Date().toDateString() === dt.toDateString()
                return (
                  <tr
                    key={msg.id}
                    onClick={() => { setSelected(msg); if (!msg.isRead) handleMarkRead(msg.id) }}
                    style={{
                      borderBottom: i < messages.length - 1 ? '1px solid #f1f5f9' : 'none',
                      cursor: 'pointer', transition: 'background .15s',
                      background: msg.isRead ? 'transparent' : '#fefbff',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8faff')}
                    onMouseLeave={e => (e.currentTarget.style.background = msg.isRead ? 'transparent' : '#fefbff')}
                  >
                    <td style={{ padding: '14px 8px 14px 16px', width: 16 }}>
                      {!msg.isRead && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} />
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>
                          {msg.user.username?.[0]?.toUpperCase() || msg.user.phone[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e3a5f' }}>
                            {msg.user.username || '未设置昵称'}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{msg.user.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '3px 10px', borderRadius: 6 }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', maxWidth: 180 }}>
                      <div style={{ fontSize: 14, fontWeight: msg.isRead ? 400 : 700, color: '#1e3a5f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {msg.title}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', maxWidth: 240 }}>
                      <div style={{ fontSize: 13, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {msg.content}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e3a5f' }}>
                        {isToday ? '今天' : dt.toLocaleDateString('zh-CN')}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        {dt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                      {!msg.isRead && (
                        <button
                          onClick={() => handleMarkRead(msg.id)}
                          style={{
                            fontSize: 12, padding: '6px 12px', borderRadius: 8,
                            border: '1.5px solid #bfdbfe', background: '#eff6ff',
                            color: '#1d4ed8', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                          }}
                        >
                          标为已读
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e8f0fe', background: page === 1 ? '#f8faff' : '#fff', color: page === 1 ? '#94a3b8' : '#1d4ed8', fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 14 }}
          >← 上一页</button>
          <span style={{ padding: '8px 16px', fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e8f0fe', background: page === totalPages ? '#f8faff' : '#fff', color: page === totalPages ? '#94a3b8' : '#1d4ed8', fontWeight: 600, cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 14 }}
          >下一页 →</button>
        </div>
      )}

      {selected && (
        <DetailModal
          msg={selected}
          onClose={() => setSelected(null)}
          onMarkRead={handleMarkRead}
        />
      )}
    </div>
  )
}