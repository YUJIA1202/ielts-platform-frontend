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

export default function ProfilePage() {
  const { collapsed } = useLayoutStore()
  const { user, setAuth } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [chartType, setChartType] = useState<'daily' | 'weekly'>('daily')
  const [subExpiry, setSubExpiry] = useState<string | null>(null)
  const [daysLeft, setDaysLeft] = useState<number | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [dailyData, setDailyData] = useState<ChartItem[]>([])
  const [weeklyData, setWeeklyData] = useState<ChartItem[]>([])
  const avatarRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<{
    username: string
    targetScore: string
    currentScore: string
    examDate: string
    studyFocus: string
  }>({
    username: '',
    targetScore: '',
    currentScore: '',
    examDate: '',
    studyFocus: '',
  })

  // 用户数据加载到 form
  useEffect(() => {
    if (!user) return
    setForm({
      username: user.username || '',
      targetScore: user.targetScore != null ? String(user.targetScore) : '',
      currentScore: user.currentScore != null ? String(user.currentScore) : '',
      examDate: user.examDate ? String(user.examDate).slice(0, 10) : '',
      studyFocus: user.studyFocus || '',
    })
    if (user.avatar) setAvatarUrl(user.avatar)
  }, [user])

  // 订阅到期计算
  useEffect(() => {
    if (!user?.subExpiresAt) return
    const expDate = new Date(user.subExpiresAt as string)
    const now = Date.now()
    setTimeout(() => {
      setSubExpiry(expDate.toLocaleDateString('zh-CN'))
      setDaysLeft(Math.max(0, Math.ceil((expDate.getTime() - now) / 86400000)))
    }, 0)
  }, [user?.subExpiresAt])

  // 学习时长追踪
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

  // 图表数据
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

  // 保存备考信息
  async function handleSave() {
    if (!editing) { setEditing(true); return }
    setSaving(true)
    try {
      const res = await api.put('/users/profile', {
        username: form.username,
        targetScore: form.targetScore ? parseFloat(form.targetScore) : null,
        currentScore: form.currentScore ? parseFloat(form.currentScore) : null,
        examDate: form.examDate || null,
        studyFocus: form.studyFocus || null,
      })
      // 更新全局 user 状态
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

  // 头像上传
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // 先显示本地预览
    setAvatarUrl(URL.createObjectURL(file))

    // 上传到后端
    const formData = new FormData()
    formData.append('avatar', file)
    try {
      const res = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      // 更新为服务器返回的真实 URL
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

  const FIELDS: { label: string; key: keyof typeof form; placeholder: string; type: string }[] = [
    { label: '用户名', key: 'username', placeholder: '请输入用户名', type: 'text' },
    { label: '目标分数', key: 'targetScore', placeholder: '如：7.0', type: 'text' },
    { label: '当前分数', key: 'currentScore', placeholder: '如：6.0', type: 'text' },
    { label: '考试日期', key: 'examDate', placeholder: '', type: 'date' },
  ]

  return (
    <div style={{ maxWidth: collapsed ? '960px' : '100%', margin: collapsed ? '0 20% 0 5%' : '0', transition: 'all .2s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>个人主页</h1>
        <p style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>管理你的学习信息和备考计划</p>
      </div>

      <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>

        {/* 左列 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#fff', fontWeight: 700, overflow: 'hidden' }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="头像" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (user?.username || 'U')[0].toUpperCase()}
              </div>
              <div onClick={() => avatarRef.current?.click()} style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0, transition: 'opacity .15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                <span style={{ fontSize: 18 }}>📷</span>
              </div>
              <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>
            <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 10 }}>鼠标悬停头像可更换</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{user?.username || '用户'}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>📱 {user?.phone}</div>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 20, background: user?.subscription === 'PRO' ? '#dbeafe' : user?.subscription === 'BASIC' ? '#dcfce7' : '#f1f5f9', color: user?.subscription === 'PRO' ? '#1d4ed8' : user?.subscription === 'BASIC' ? '#16a34a' : '#64748b' }}>
              {user?.subscription === 'PRO' ? '⭐ 高级会员' : user?.subscription === 'BASIC' ? '✦ 基础会员' : '免费用户'}
            </span>
            {subExpiry && (
              <div style={{ marginTop: 10, fontSize: 12, color: daysLeft !== null && daysLeft < 7 ? '#ef4444' : '#94a3b8' }}>
                {daysLeft !== null && daysLeft < 7 ? `⚠️ 还剩 ${daysLeft} 天到期` : `到期时间：${subExpiry}`}
              </div>
            )}
          </div>

          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '20px 24px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 14 }}>订阅详情</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {([
                { label: '当前方案', value: user?.subscription === 'PRO' ? '高级会员' : user?.subscription === 'BASIC' ? '基础会员' : '免费用户' },
                { label: '到期时间', value: subExpiry || '永久有效' },
                { label: '剩余天数', value: daysLeft !== null ? `${daysLeft} 天` : '—' },
              ] as { label: string; value: string }[]).map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{value}</span>
                </div>
              ))}
            </div>
            {user?.subscription !== 'PRO' && (
              <a href="/dashboard/pricing" style={{ display: 'block', marginTop: 14, padding: '9px', borderRadius: 8, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', textAlign: 'center', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>升级方案 →</a>
            )}
          </div>
        </div>

        {/* 右列 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>📋 备考信息</div>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '6px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: editing ? '#eff6ff' : '#fff', color: editing ? '#3b82f6' : '#64748b', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? '保存中...' : editing ? '保存' : '编辑'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
              {FIELDS.map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>{label}</div>
                  {editing ? (
                    <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                      style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, color: '#1e293b', outline: 'none', background: '#fafafa', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  ) : (
                    <div style={{ fontSize: 14, color: form[key] ? '#1e293b' : '#cbd5e1', fontWeight: form[key] ? 500 : 400, padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                      {form[key] || '未填写'}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>学习专注方向</div>
              {editing ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['Task 2 提分', 'Task 1 提分', '语法提升', '词汇扩展', '全面提升']).map(f => (
                    <button key={f} onClick={() => setForm(prev => ({ ...prev, studyFocus: f }))}
                      style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: form.studyFocus === f ? '1.5px solid #3b82f6' : '1.5px solid #e2e8f0', background: form.studyFocus === f ? '#eff6ff' : '#f8fafc', color: form.studyFocus === f ? '#2563eb' : '#64748b', fontWeight: form.studyFocus === f ? 600 : 400 }}>{f}</button>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 14, color: form.studyFocus ? '#1e293b' : '#cbd5e1', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>{form.studyFocus || '未设置'}</div>
              )}
            </div>
          </div>

          {/* 学习时长图表 */}
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>📊 学习时长</div>
              <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
                {([{ key: 'daily' as const, label: '每日' }, { key: 'weekly' as const, label: '每周' }]).map(({ key, label }) => (
                  <button key={key} onClick={() => setChartType(key)} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', fontSize: 12, cursor: 'pointer', fontWeight: 600, background: chartType === key ? '#fff' : 'transparent', color: chartType === key ? '#3b82f6' : '#64748b', boxShadow: chartType === key ? '0 1px 3px rgba(0,0,0,.10)' : 'none' }}>{label}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
              {([
                { label: '本周总时长', value: totalThisWeek > 0 ? `${Math.floor(totalThisWeek / 60)}h ${totalThisWeek % 60}m` : '—' },
                { label: '日均时长', value: avgDaily > 0 ? `${Math.floor(avgDaily / 60)}h ${avgDaily % 60}m` : '—' },
                { label: '今日时长', value: dailyData[6]?.minutes > 0 ? `${Math.floor(dailyData[6].minutes / 60)}h ${dailyData[6].minutes % 60}m` : '—' },
              ] as { label: string; value: string }[]).map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{value}</div>
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
                      <div style={{ width: '80%', height: d.minutes > 0 ? `${Math.max(pct, 6)}%` : '3%', background: d.minutes === 0 ? '#f1f5f9' : isLatest ? 'linear-gradient(180deg, #3b82f6, #2563eb)' : 'linear-gradient(180deg, #93c5fd, #bfdbfe)', borderRadius: '4px 4px 0 0', minHeight: 3, transition: 'height .4s ease' }} />
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
            <div style={{ marginTop: 10, fontSize: 12, color: '#cbd5e1' }}>📌 时长根据你在平台上的实际使用时间自动记录</div>
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