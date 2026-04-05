'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLayoutStore } from '@/store/layoutStore'
import api from '@/lib/api'

interface Stats {
  pendingSubmissions: number
  totalSubmissions: number
  totalUsers: number
  unreadMessages: number
  totalCodes: number
  usedCodes: number
}

function StatCard({ label, value, sub, icon, accent }: {
  label: string
  value: number | string
  sub?: string
  icon: string
  accent: string
}) {
  return (
    <div style={{
      background: '#fff',
      border: '1.5px solid #e8f0fe',
      borderTop: `3px solid ${accent}`,
      borderRadius: 14,
      padding: '28px 28px',
    }}>
       <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 16,
      }}>
        <div style={{ fontSize: 15, color: '#94a3b8', fontWeight: 500 }}>{label}</div>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${accent}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>{icon}</div>
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, color: '#1e3a5f' }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

const quickLinks = [
  { label: '批改工作台', icon: '✏️', path: '/admin/submissions', desc: '处理待批改作文',  accent: '#3b82f6' },
  { label: '真题管理',   icon: '📚', path: '/admin/questions',   desc: '增删改查题目',   accent: '#8b5cf6' },
  { label: '范文管理',   icon: '📝', path: '/admin/essays',      desc: '上传管理范文',   accent: '#10b981' },
  { label: '用户管理',   icon: '👥', path: '/admin/users',       desc: '查看用户订阅',   accent: '#f59e0b' },
  { label: '留言反馈',   icon: '💬', path: '/admin/messages',    desc: '处理用户留言',   accent: '#ef4444' },
  { label: '批改码管理', icon: '🔑', path: '/admin/codes',       desc: '库存与核销管理', accent: '#06b6d4' },
]

export default function AdminDashboard() {
  const { collapsed } = useLayoutStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

useEffect(() => {
  Promise.all([
    api.get('/submissions/all', { params: { page: '1', limit: '1' } }),
    api.get('/submissions/all', { params: { page: '1', limit: '1', status: 'PENDING' } }),
    api.get('/users/all', { params: { page: '1', limit: '1' } }),
    api.get('/messages', { params: { page: '1', limit: '100' } }),
    api.get('/correction-codes', { params: { page: '1', limit: '100' } }),
  ]).then(([subRes, pendingRes, userRes, msgRes, codeRes]) => {
    const allMessages: { isRead: boolean }[] = msgRes.data.messages || []
    const unreadMessages = allMessages.filter(m => !m.isRead).length

    const allCodes: { isUsed: boolean }[] = codeRes.data.codes || []
    const totalCodes = codeRes.data.total ?? allCodes.length
    const usedCodes = allCodes.filter(c => c.isUsed).length

    setStats({
      pendingSubmissions: pendingRes.data.total ?? 0,
      totalSubmissions:   subRes.data.total ?? 0,
      totalUsers:         userRes.data.total ?? 0,
      unreadMessages,
      totalCodes,
      usedCodes,
    })
  }).catch(() => {}).finally(() => setLoading(false))
}, [])

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>加载中...</div>
  }

  const statCards = [
    { label: '待批改',    value: stats?.pendingSubmissions ?? '—', sub: '需要处理',   icon: '✏️', accent: '#f59e0b' },
    { label: '总提交数',  value: stats?.totalSubmissions ?? '—',   sub: '累计',       icon: '📋', accent: '#3b82f6' },
    { label: '注册用户',  value: stats?.totalUsers ?? '—',         sub: '累计账号',   icon: '👥', accent: '#8b5cf6' },
    { label: '未读留言',  value: stats?.unreadMessages ?? '—',     sub: '待回复',     icon: '💬', accent: '#ef4444' },
    {
      label: '批改码库存',
      value: stats ? stats.totalCodes - stats.usedCodes : '—',
      sub: stats ? `已用 ${stats.usedCodes} / 共 ${stats.totalCodes}` : '',
      icon: '🔑', accent: '#10b981',
    },
  ]

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto' }}>

      {/* 页头 */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        border: '1.5px solid #bfdbfe',
        borderLeft: '5px solid #1d4ed8',
        borderRadius: 16,
        padding: '24px 28px',
        marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a5f', marginBottom: 4 }}>
            管理员控制台
          </div>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            欢迎回来，以下是平台实时数据
          </div>
        </div>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, flexShrink: 0,
        }}>🛡️</div>
      </div>

      {/* 数据卡片 */}
      {collapsed ? (
        <>
          {/* 折叠：第一行3个 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
            {statCards.slice(0, 3).map(s => (
              <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} icon={s.icon} accent={s.accent} />
            ))}
          </div>
          {/* 折叠：第二行2个居中 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
            <StatCard label={statCards[3].label} value={statCards[3].value} sub={statCards[3].sub} icon={statCards[3].icon} accent={statCards[3].accent} />
            <StatCard label={statCards[4].label} value={statCards[4].value} sub={statCards[4].sub} icon={statCards[4].icon} accent={statCards[4].accent} />
            <div />
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
          {statCards.map(s => (
            <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} icon={s.icon} accent={s.accent} />
          ))}
        </div>
      )}

      {/* 快捷入口标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 4, height: 18, borderRadius: 2, background: '#1d4ed8' }} />
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e3a5f' }}>快捷入口</h2>
      </div>

      {/* 快捷入口 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: collapsed ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: 12,
      }}>
        {quickLinks.map(item => (
  <Link
    key={item.path}
    href={item.path}
    style={{
      display: 'flex', alignItems: 'center', gap: 18,
      background: '#fff',
      border: '1.5px solid #e8f0fe',
      borderRadius: 12,
      padding: '22px 24px',
      textDecoration: 'none', color: '#1e3a5f',
    }}
  >
    <div style={{
      width: 52, height: 52, borderRadius: 12,
      background: `${item.accent}15`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 26, flexShrink: 0,
    }}>
      {item.icon}
    </div>
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f', marginBottom: 4 }}>
        {item.label}
      </div>
      <div style={{ fontSize: 13, color: '#94a3b8' }}>
        {item.desc}
      </div>
    </div>
  </Link>
))}
      </div>

    </div>
  )
}