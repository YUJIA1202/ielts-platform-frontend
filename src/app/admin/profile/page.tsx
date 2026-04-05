'use client'

import { useState, useEffect, useRef } from 'react'
import { useLayoutStore } from '@/store/layoutStore'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'

interface ChartItem {
  minutes: number
  date?: string
  week?: string
}

export default function AdminProfilePage() {
  const { collapsed } = useLayoutStore()
  const { user, setAuth } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [chartType, setChartType] = useState<'daily' | 'weekly'>('daily')
  const [subExpiry, setSubExpiry] = useState<string | null>(null)
  const [, setDaysLeft] = useState<number | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [dailyData, setDailyData] = useState<ChartItem[]>([])
  const [weeklyData, setWeeklyData] = useState<ChartItem[]>([])
  const avatarRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ username: '' })

  useEffect(() => {
    if (!user) return
    setForm({ username: user.username || '' })
    if (user.avatar) setAvatarUrl(user.avatar)
  }, [user])

  useEffect(() => {
    if (!user?.subExpiresAt) return
    const expDate = new Date(user.subExpiresAt as string)
    const now = Date.now()
    setTimeout(() => {
      setSubExpiry(expDate.toLocaleDateString('zh-CN'))
      setDaysLeft(Math.max(0, Math.ceil((expDate.getTime() - now) / 86400000)))
    }, 0)
  }, [user?.subExpiresAt])

  useEffect(() => {
    const startTime = Date.now()
    const todayKey = new Date().toISOString().slice(0, 10)
    const save = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000 / 60)
      if (elapsed <= 0) return
      const raw = localStorage.getItem('study_time') || '{}'
      const data: Record<string, number> = JSON.parse(raw)
      data[todayKey] = (data[todayKey] || 0) + elapsed
      localStorage.setItem('study_time', JSON.stringify(data))
    }
    const interval = setInterval(save, 60 * 1000)
    window.addEventListener('beforeunload', save)
    return () => { clearInterval(interval); window.removeEventListener('beforeunload', save); save() }
  }, [])

  useEffect(() => {
    const raw = localStorage.getItem('study_time') || '{}'
    const data: Record<string, number> = JSON.parse(raw)
    const today = new Date()

    const daily = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (6 - i))
      const key = d.toISOString().slice(0, 10)
      const label = i === 6 ? '今天' : `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')}`
      return { date: label, minutes: data[key] || 0 }
    })

    const weekly = Array.from({ length: 5 }).map((_, i) => {
      let total = 0
      for (let d = 0; d < 7; d++) {
        const date = new Date(today)
        date.setDate(date.getDate() - (4 - i) * 7 - d)
        total += data[date.toISOString().slice(0, 10)] || 0
      }
      return { week: i === 4 ? '本周' : `第${i + 1}周`, minutes: total }
    })

    setDailyData(daily)
    setWeeklyData(weekly)
  }, [])

  async function handleSave() {
    if (!editing) { setEditing(true); return }
    setSaving(true)
    try {
      const res = await api.put('/users/profile', {
        username: form.username,
      })
      const token = localStorage.getItem('token') || ''
      setAuth(res.data, token)
      setEditing(false)
    } catch (err) {
      console.error(err)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUrl(URL.createObjectURL(file))
    const formData = new FormData()
    formData.append('avatar', file)
    try {
      const res = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setAvatarUrl(res.data.avatar)
      const token = localStorage.getItem('token') || ''
      setAuth({ ...user!, avatar: res.data.avatar }, token)
    } catch (err) {
      console.error(err)
      alert('头像上传失败')
    }
  }

  const chartData = chartType === 'daily' ? dailyData : weeklyData
  const maxMinutes = Math.max(...chartData.map(d => d.minutes), 1)
  const totalThisWeek = dailyData.reduce((sum, d) => sum + d.minutes, 0)
  const avgDaily = Math.round(totalThisWeek / 7)

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
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e3a5f', marginBottom: 6 }}>个人主页</h1>
          <div style={{ fontSize: 15, color: '#64748b' }}>管理你的账号信息</div>
        </div>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
        }}>
          👤
        </div>
      </div>

      <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: collapsed ? '220px 1fr' : '280px 1fr', gap: 20, alignItems: 'start' }}>

        {/* 左列 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 头像卡片 */}
          <div style={{
            background: '#fff', border: '1.5px solid #e8f0fe',
            borderRadius: 16, padding: '28px 24px', textAlign: 'center',
            boxShadow: '0 2px 12px rgba(59,130,246,0.06)',
          }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, color: '#fff', fontWeight: 700, overflow: 'hidden',
                border: '3px solid #bfdbfe', boxShadow: '0 4px 12px rgba(29,78,216,0.2)',
              }}>
                {avatarUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={avatarUrl} alt="头像" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (user?.username || 'A')[0].toUpperCase()}
              </div>
              <div
                onClick={() => avatarRef.current?.click()}
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(0,0,0,.4)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', opacity: 0, transition: 'opacity .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
              >
                <span style={{ fontSize: 18 }}>📷</span>
              </div>
              <input ref={avatarRef} type="file" accept="image/*"
                style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>

            <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 10 }}>鼠标悬停头像可更换</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e3a5f', marginBottom: 4 }}>
              {user?.username || '管理员'}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>📱 {user?.phone}</div>

            {/* 管理员标识 */}
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '5px 16px', borderRadius: 20,
              background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
              color: '#1d4ed8', border: '1.5px solid #bfdbfe',
            }}>
              👑 管理员
            </span>
          </div>

          {/* 账号详情 */}
          <div style={{
            background: '#fff', border: '1.5px solid #e8f0fe',
            borderRadius: 16, padding: '20px 24px',
            boxShadow: '0 2px 12px rgba(59,130,246,0.06)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 14 }}>账号详情</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {([
                { label: '用户 ID',  value: '#' + user?.id },
                { label: '账号角色', value: '👑 管理员' },
              // 第221行，改成：
{ label: '注册时间', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '—' },
                { label: '订阅状态', value: user?.subscription === 'PRO' ? '高级会员' : user?.subscription === 'BASIC' ? '基础会员' : '免费' },
                { label: '到期时间', value: subExpiry || '永久有效' },
              ] as { label: string; value: string }[]).map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', background: '#f8faff',
                  borderRadius: 8, border: '1px solid #e8f0fe',
                }}>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e3a5f' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 右列 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 基本信息编辑 */}
          <div style={{
            background: '#fff', border: '1.5px solid #e8f0fe',
            borderRadius: 16, padding: '24px',
            boxShadow: '0 2px 12px rgba(59,130,246,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1e3a5f' }}>✏️ 基本信息</div>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '7px 18px', borderRadius: 8,
                  border: editing ? 'none' : '1.5px solid #e8f0fe',
                  background: editing
                    ? 'linear-gradient(135deg, #1d4ed8, #3b82f6)'
                    : '#fff',
                  color: editing ? '#fff' : '#64748b',
                  fontSize: 13, fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                  boxShadow: editing ? '0 4px 12px rgba(29,78,216,0.2)' : 'none',
                }}
              >
                {saving ? '保存中...' : editing ? '保存' : '编辑'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>用户名</div>
                {editing ? (
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    placeholder="请输入用户名"
                    style={{
                      width: '100%', border: '1.5px solid #e8f0fe', borderRadius: 8,
                      padding: '8px 12px', fontSize: 14, color: '#1e3a5f',
                      outline: 'none', background: '#f8faff',
                      boxSizing: 'border-box', fontFamily: 'inherit',
                    }}
                  />
                ) : (
                  <div style={{
                    fontSize: 14, color: form.username ? '#1e3a5f' : '#cbd5e1',
                    fontWeight: form.username ? 500 : 400,
                    padding: '8px 0', borderBottom: '1px solid #f1f5f9',
                  }}>
                    {form.username || '未填写'}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>手机号</div>
                <div style={{
                  fontSize: 14, color: '#1e3a5f', fontWeight: 500,
                  padding: '8px 0', borderBottom: '1px solid #f1f5f9',
                }}>
                  {user?.phone}
                </div>
              </div>
            </div>
          </div>

          {/* 学习时长图表 */}
          <div style={{
            background: '#fff', border: '1.5px solid #e8f0fe',
            borderRadius: 16, padding: '24px',
            boxShadow: '0 2px 12px rgba(59,130,246,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1e3a5f' }}>📊 在线时长</div>
              <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
                {([{ key: 'daily' as const, label: '每日' }, { key: 'weekly' as const, label: '每周' }]).map(({ key, label }) => (
                  <button key={key} onClick={() => setChartType(key)} style={{
                    padding: '5px 14px', borderRadius: 6, border: 'none',
                    fontSize: 12, cursor: 'pointer', fontWeight: 600,
                    background: chartType === key ? '#fff' : 'transparent',
                    color: chartType === key ? '#1d4ed8' : '#64748b',
                    boxShadow: chartType === key ? '0 1px 3px rgba(0,0,0,.10)' : 'none',
                  }}>{label}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
              {([
                { label: '本周总时长', value: totalThisWeek > 0 ? `${Math.floor(totalThisWeek / 60)}h ${totalThisWeek % 60}m` : '—' },
                { label: '日均时长',   value: avgDaily > 0 ? `${Math.floor(avgDaily / 60)}h ${avgDaily % 60}m` : '—' },
                { label: '今日时长',   value: dailyData[6]?.minutes > 0 ? `${Math.floor(dailyData[6].minutes / 60)}h ${dailyData[6].minutes % 60}m` : '—' },
              ] as { label: string; value: string }[]).map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f' }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, padding: '0 4px' }}>
              {chartData.map((d, i) => {
                const pct = maxMinutes > 0 ? (d.minutes / maxMinutes) * 100 : 0
                const isLatest = i === chartData.length - 1
                const label = 'date' in d ? d.date : d.week
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                      {d.minutes > 0 && <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 2 }}>{d.minutes}m</div>}
                      <div style={{
                        width: '80%',
                        height: d.minutes > 0 ? `${Math.max(pct, 6)}%` : '3%',
                        background: d.minutes === 0
                          ? '#f1f5f9'
                          : isLatest
                            ? 'linear-gradient(180deg, #3b82f6, #2563eb)'
                            : 'linear-gradient(180deg, #93c5fd, #bfdbfe)',
                        borderRadius: '4px 4px 0 0',
                        minHeight: 3,
                        transition: 'height .4s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>{label}</div>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              {[
                { color: 'linear-gradient(180deg, #3b82f6, #2563eb)', label: '今天 / 本周' },
                { color: '#bfdbfe', label: '历史数据' },
                { color: '#f1f5f9', label: '无记录' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: '#cbd5e1' }}>
              📌 时长根据你在后台的实际在线时间自动记录
            </div>
          </div>

        </div>
      </div>

      <div style={{ height: 48 }} />

      <style>{`
        @media (max-width: 768px) {
          .profile-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}