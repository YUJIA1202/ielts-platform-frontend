'use client'
import { useEffect, useState } from 'react'
import { useLayoutStore } from '@/store/layoutStore'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

interface User {
  id: number
  phone: string
  username: string
  role: string
  subscription: 'FREE' | 'BASIC' | 'PRO'
  subExpiresAt?: string
  createdAt: string
  banned: boolean
}

const SUB_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  FREE:  { label: '免费',   color: '#64748b', bg: '#f1f5f9' },
  BASIC: { label: '基础版', color: '#d97706', bg: '#fef3c7' },
  PRO:   { label: '专业版', color: '#7c3aed', bg: '#f5f3ff' },
}

function SubBadge({ sub }: { sub: string }) {
  const s = SUB_LABELS[sub] || SUB_LABELS.FREE
  return (
    <span style={{
      fontSize: 13, padding: '4px 12px', borderRadius: 20,
      fontWeight: 600, background: s.bg, color: s.color, whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

export default function AdminUsersPage() {
  const { collapsed } = useLayoutStore()
  const router = useRouter()

  const [users, setUsers]       = useState<User[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [phone, setPhone]       = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [subFilter, setSubFilter]   = useState('ALL')
  const [order, setOrder]           = useState('desc')
  const [page, setPage]             = useState(1)
  const limit = 15

  const [editUser, setEditUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState<{
    subscription: 'FREE' | 'BASIC' | 'PRO'
    subExpiresAt: string
  }>({ subscription: 'FREE', subExpiresAt: '' })
  const [saving, setSaving] = useState(false)

  const fetchUsers = () => {
    setLoading(true)
    const params: Record<string, string> = {
      page: String(page), limit: String(limit), order,
    }
    if (phone) params.phone = phone
    if (subFilter !== 'ALL') params.subscription = subFilter
    api.get('/users/all', { params })
      .then(res => { setUsers(res.data.users || []); setTotal(res.data.total || 0) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, subFilter, order, phone])

  function openEdit(u: User) {
    setEditUser(u)
    setEditForm({
      subscription: u.subscription,
      subExpiresAt: u.subExpiresAt
        ? new Date(u.subExpiresAt).toISOString().slice(0, 10)
        : '',
    })
  }

  async function handleSave() {
    if (!editUser) return
    setSaving(true)
    try {
      await api.put(`/users/${editUser.id}/subscription`, {
        subscription: editForm.subscription,
        subExpiresAt: editForm.subExpiresAt || null,
      })
      setEditUser(null)
      fetchUsers()
    } catch { alert('保存失败') } finally { setSaving(false) }
  }

  async function handleToggleBan(u: User, e: React.MouseEvent) {
    e.stopPropagation()
    const msg = u.banned
      ? `确认解封用户 ${u.phone}？`
      : `确认封禁用户 ${u.phone}？`
    if (!confirm(msg)) return
    try {
      await api.patch(`/users/${u.id}/ban`, {})
      fetchUsers()
    } catch { alert('操作失败') }
  }

  const totalPages = Math.ceil(total / limit)

  const inp: React.CSSProperties = {
    padding: '10px 14px', fontSize: 14, borderRadius: 8,
    border: '1.5px solid #e8f0fe', background: '#f8faff',
    color: '#1e3a5f', outline: 'none',
  }

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
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e3a5f', marginBottom: 6 }}>
            用户管理
          </h1>
          <div style={{ fontSize: 15, color: '#64748b' }}>
            共 <strong style={{ color: '#1d4ed8' }}>{total}</strong> 位用户
          </div>
        </div>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
        }}>
          👥
        </div>
      </div>

      {/* 筛选栏 */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center',
        background: '#fff', border: '1.5px solid #e8f0fe',
        borderRadius: 12, padding: '12px 16px', flexWrap: 'wrap',
      }}>
        <input
          value={phoneInput}
          onChange={e => setPhoneInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { setPhone(phoneInput); setPage(1) } }}
          placeholder="搜索手机号..."
          style={{ ...inp, width: 200 }}
        />
        <button
          onClick={() => { setPhone(phoneInput); setPage(1) }}
          style={{
            padding: '10px 18px', borderRadius: 8, border: 'none',
            background: '#eff6ff', color: '#1d4ed8',
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}
        >
          搜索
        </button>
        <select
          value={subFilter}
          onChange={e => { setSubFilter(e.target.value); setPage(1) }}
          style={{ ...inp, cursor: 'pointer' }}
        >
          <option value="ALL">全部订阅</option>
          <option value="FREE">免费</option>
          <option value="BASIC">基础版</option>
          <option value="PRO">专业版</option>
        </select>
        <select
          value={order}
          onChange={e => { setOrder(e.target.value); setPage(1) }}
          style={{ ...inp, cursor: 'pointer' }}
        >
          <option value="desc">最新注册</option>
          <option value="asc">最早注册</option>
        </select>
        <div style={{
          marginLeft: 'auto', fontSize: 14, color: '#94a3b8',
          background: '#f8faff', padding: '8px 16px',
          borderRadius: 8, border: '1px solid #e8f0fe',
        }}>
          共 <strong style={{ color: '#1d4ed8' }}>{total}</strong> 条
        </div>
      </div>

      {/* 内容 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 16 }}>
          加载中...
        </div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 16 }}>
          暂无数据
        </div>
      ) : collapsed ? (
        // ── 折叠：卡片模式 ──
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {users.map(u => (
            <div
              key={u.id}
              onClick={() => router.push('/admin/users/' + u.id)}
              style={{
                background: '#fff', border: '1.5px solid #e8f0fe',
              
                borderRadius: 14, padding: '14px 18px',
                opacity: u.banned ? 0.7 : 1,
                cursor: 'pointer', transition: 'background .15s',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: 12,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8faff')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {u.username?.[0]?.toUpperCase() || u.phone[0]}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: 15 }}>
                      {u.username}
                    </div>
                    <SubBadge sub={u.subscription} />
                    {u.banned && (
                      <span style={{
                        fontSize: 12, padding: '3px 8px', borderRadius: 20,
                        background: '#fef2f2', color: '#dc2626', fontWeight: 600,
                      }}>
                        已封禁
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{u.phone}</div>
                </div>
              </div>
              <div
                style={{ display: 'flex', gap: 8, flexShrink: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={e => { e.stopPropagation(); openEdit(u) }}
                  style={{
                    fontSize: 13, padding: '7px 14px', borderRadius: 8,
                    border: '1.5px solid #bfdbfe', background: '#eff6ff',
                    color: '#1d4ed8', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  修改订阅
                </button>
                <button
                  onClick={e => handleToggleBan(u, e)}
                  style={{
                    fontSize: 13, padding: '7px 14px', borderRadius: 8,
                    border: `1.5px solid ${u.banned ? '#bbf7d0' : '#fecaca'}`,
                    background: u.banned ? '#f0fdf4' : '#fef2f2',
                    color: u.banned ? '#16a34a' : '#dc2626',
                    fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {u.banned ? '解封' : '封禁'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // ── 展开：表格模式 ──
        <div style={{
          background: '#fff', border: '1.5px solid #e8f0fe',
          borderRadius: 14, overflow: 'hidden', marginBottom: 16,
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #f8faff, #eff6ff)' }}>
                {['用户', '手机号', '订阅状态', '到期时间', '注册时间', '状态', '操作'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '14px 16px',
                    fontSize: 14, fontWeight: 600, color: '#64748b',
                    borderBottom: '1.5px solid #e8f0fe', whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={u.id}
                  onClick={() => router.push('/admin/users/' + u.id)}
                  style={{
                    borderBottom: i < users.length - 1 ? '1px solid #f1f5f9' : 'none',
                    opacity: u.banned ? 0.6 : 1, transition: 'background .15s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8faff')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {u.username?.[0]?.toUpperCase() || u.phone[0]}
                      </div>
                      <div style={{ fontWeight: 600, color: '#1e3a5f', fontSize: 15 }}>
                        {u.username}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#64748b', whiteSpace: 'nowrap' }}>
                    {u.phone}
                  </td>
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    <SubBadge sub={u.subscription} />
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {u.subExpiresAt ? new Date(u.subExpiresAt).toLocaleDateString('zh-CN') : '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {new Date(u.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    {u.banned ? (
                      <span style={{
                        fontSize: 13, padding: '4px 12px', borderRadius: 20,
                        background: '#fef2f2', color: '#dc2626', fontWeight: 600,
                      }}>已封禁</span>
                    ) : (
                      <span style={{
                        fontSize: 13, padding: '4px 12px', borderRadius: 20,
                        background: '#f0fdf4', color: '#16a34a', fontWeight: 600,
                      }}>正常</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={e => { e.stopPropagation(); openEdit(u) }}
                        style={{
                          fontSize: 13, padding: '7px 14px', borderRadius: 8,
                          border: '1.5px solid #bfdbfe', background: '#eff6ff',
                          color: '#1d4ed8', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                      >
                        修改订阅
                      </button>
                      <button
                        onClick={e => handleToggleBan(u, e)}
                        style={{
                          fontSize: 13, padding: '7px 14px', borderRadius: 8,
                          border: `1.5px solid ${u.banned ? '#bbf7d0' : '#fecaca'}`,
                          background: u.banned ? '#f0fdf4' : '#fef2f2',
                          color: u.banned ? '#16a34a' : '#dc2626',
                          fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                      >
                        {u.banned ? '解封' : '封禁'}
                      </button>
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
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e8f0fe',
              background: page === 1 ? '#f8faff' : '#fff',
              color: page === 1 ? '#94a3b8' : '#1d4ed8',
              fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 14,
            }}
          >
            {'← 上一页'}
          </button>
          <span style={{
            padding: '8px 16px', fontSize: 14, color: '#64748b',
            display: 'flex', alignItems: 'center',
          }}>
            {page + ' / ' + totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e8f0fe',
              background: page === totalPages ? '#f8faff' : '#fff',
              color: page === totalPages ? '#94a3b8' : '#1d4ed8',
              fontWeight: 600,
              cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 14,
            }}
          >
            {'下一页 →'}
          </button>
        </div>
      )}

      {/* 修改订阅弹窗 */}
      {editUser && (
        <div
          onClick={() => setEditUser(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 20, padding: '32px',
              width: '90%', maxWidth: 460,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e3a5f', marginBottom: 6 }}>
              修改订阅
            </div>
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>
              {editUser.username + '（' + editUser.phone + '）'}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>
                订阅等级
              </div>
              <select
                value={editForm.subscription}
                onChange={e => setEditForm(f => ({
                  ...f,
                  subscription: e.target.value as 'FREE' | 'BASIC' | 'PRO',
                }))}
                style={{ ...inp, width: '100%', cursor: 'pointer' }}
              >
                <option value="FREE">免费</option>
                <option value="BASIC">基础版</option>
                <option value="PRO">专业版</option>
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>
                到期时间（留空则无限期）
              </div>
              <input
                type="date"
                value={editForm.subExpiresAt}
                onChange={e => setEditForm(f => ({ ...f, subExpiresAt: e.target.value }))}
                style={{ ...inp, width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setEditUser(null)}
                style={{
                  padding: '10px 22px', borderRadius: 10,
                  border: '1.5px solid #e2e8f0', background: '#fff',
                  color: '#64748b', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 26px', borderRadius: 10, border: 'none',
                  background: saving ? '#93c5fd' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                  color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}