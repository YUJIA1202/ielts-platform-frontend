'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useLayoutStore } from '@/store/layoutStore'

type SubType = 'FREE' | 'BASIC' | 'PRO'

interface User {
  id: number
  phone: string
  username: string
  role: string
  subscription: SubType
  subExpiresAt?: string
  createdAt: string
  banned: boolean
}

interface LoginSession {
  id: number
  deviceId: string
  createdAt: string
}

interface TrialLog {
  id: number
  createdAt: string
  video: {
    id: number
    title: string
    series: string
    category: string
    duration: number
  }
}

interface Submission {
  id: number
  status: string
  createdAt: string
  overallScore: number | null
  adminComment: string | null
  customPrompt: string | null
  question: {
    task: string
    subtype: string
    content: string
  } | null
}

interface EssayViewLog {
  id: number
  createdAt: string
  essay: {
    id: number
    score: number | null
    question: {
      task: string
      subtype: string | null
      content: string
    }
  }
}

interface QuestionViewLog {
  id: number
  createdAt: string
  question: {
    id: number
    task: string
    subtype: string | null
    topic: string | null
    content: string
    year: number | null
  }
}

const SUB_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  FREE:  { label: '免费',   color: '#64748b', bg: '#f1f5f9' },
  BASIC: { label: '基础版', color: '#d97706', bg: '#fef3c7' },
  PRO:   { label: '专业版', color: '#7c3aed', bg: '#f5f3ff' },
}

const CAT_LABELS: Record<string, string> = {
  grammar: '语法系列',
  task2:   'Task 2',
  task1:   'Task 1',
}

const CAT_COLOR: Record<string, string> = {
  grammar: '#3b82f6',
  task2:   '#16a34a',
  task1:   '#9333ea',
}

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
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

// ── 修改订阅弹窗 ──────────────────────────────────────────────────────
function EditModal({
  user, onClose, onSaved,
}: {
  user: User; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState<{ subscription: SubType; subExpiresAt: string }>({
    subscription: user.subscription,
    subExpiresAt: user.subExpiresAt
      ? new Date(user.subExpiresAt).toISOString().slice(0, 10) : '',
  })
  const [saving, setSaving] = useState(false)

  const inp: React.CSSProperties = {
    padding: '10px 14px', fontSize: 14, borderRadius: 8,
    border: '1.5px solid #e8f0fe', background: '#f8faff',
    color: '#1e3a5f', outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/users/${user.id}/subscription`, {
        subscription: form.subscription,
        subExpiresAt: form.subExpiresAt || null,
      })
      onSaved()
      onClose()
    } catch { alert('保存失败') } finally { setSaving(false) }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20, padding: '32px',
        width: '100%', maxWidth: 440,
        boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1e3a5f', marginBottom: 6 }}>
          修改订阅
        </div>
        <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>
          {user.username + '（' + user.phone + '）'}
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>
            订阅等级
          </div>
          <select
            value={form.subscription}
            onChange={e => setForm(f => ({ ...f, subscription: e.target.value as SubType }))}
            style={{ ...inp, cursor: 'pointer' }}
          >
            <option value="FREE">免费</option>
            <option value="BASIC">基础版</option>
            <option value="PRO">专业版</option>
          </select>
        </div>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>
            到期时间（留空则无限期）
          </div>
          <input
            type="date" value={form.subExpiresAt}
            onChange={e => setForm(f => ({ ...f, subExpiresAt: e.target.value }))}
            style={inp}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{
            padding: '10px 22px', borderRadius: 10,
            border: '1.5px solid #e2e8f0', background: '#fff',
            color: '#64748b', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>取消</button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '10px 26px', borderRadius: 10, border: 'none',
            background: saving ? '#93c5fd' : 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
            color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}>{saving ? '保存中...' : '保存'}</button>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════
type TabKey = 'info' | 'login' | 'trial' | 'essay' | 'question' | 'submission'

function UserDetailContent() {
  const params  = useParams()
  const router  = useRouter()
  const id      = Number(params.id)
  const { collapsed } = useLayoutStore()

  const [user, setUser]         = useState<User | null>(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab]           = useState<TabKey>('info')
  const [showEdit, setShowEdit] = useState(false)

  // 各 Tab 数据
  const [loginSessions, setLoginSessions]   = useState<LoginSession[]>([])
  const [trialLogs, setTrialLogs]           = useState<TrialLog[]>([])
  const [submissions, setSubmissions]       = useState<Submission[]>([])
  const [essayViews, setEssayViews]         = useState<EssayViewLog[]>([])
  const [questionViews, setQuestionViews]   = useState<QuestionViewLog[]>([])

  // 加载状态
  const [loadingLogin, setLoadingLogin]         = useState(false)
  const [loadingTrial, setLoadingTrial]         = useState(false)
  const [loadingSubmission, setLoadingSubmission] = useState(false)
  const [loadingEssay, setLoadingEssay]         = useState(false)
  const [loadingQuestion, setLoadingQuestion]   = useState(false)

  // 是否已加载过
  const [loginLoaded, setLoginLoaded]           = useState(false)
  const [trialLoaded, setTrialLoaded]           = useState(false)
  const [submissionLoaded, setSubmissionLoaded] = useState(false)
  const [essayLoaded, setEssayLoaded]           = useState(false)
  const [questionLoaded, setQuestionLoaded]     = useState(false)

  const loadUser = async () => {
    try {
      const res = await api.get(`/users/${id}`)
      setUser(res.data)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUser() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab === 'login' && !loginLoaded) {
      setLoadingLogin(true)
      api.get(`/users/${id}/login-sessions`)
        .then(res => { setLoginSessions(res.data); setLoginLoaded(true) })
        .finally(() => setLoadingLogin(false))
    }
    if (tab === 'trial' && !trialLoaded) {
      setLoadingTrial(true)
      api.get(`/users/${id}/trial-logs`)
        .then(res => { setTrialLogs(res.data); setTrialLoaded(true) })
        .finally(() => setLoadingTrial(false))
    }
    if (tab === 'submission' && !submissionLoaded) {
      setLoadingSubmission(true)
      api.get(`/users/${id}/submissions`)
        .then(res => { setSubmissions(res.data); setSubmissionLoaded(true) })
        .finally(() => setLoadingSubmission(false))
    }
    if (tab === 'essay' && !essayLoaded) {
      setLoadingEssay(true)
      api.get(`/users/${id}/essay-views`)
        .then(res => { setEssayViews(res.data); setEssayLoaded(true) })
        .finally(() => setLoadingEssay(false))
    }
    if (tab === 'question' && !questionLoaded) {
      setLoadingQuestion(true)
      api.get(`/users/${id}/question-views`)
        .then(res => { setQuestionViews(res.data); setQuestionLoaded(true) })
        .finally(() => setLoadingQuestion(false))
    }
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleBan = async () => {
    if (!user) return
    const msg = user.banned
      ? `确认解封用户 ${user.phone}？`
      : `确认封禁用户 ${user.phone}？`
    if (!confirm(msg)) return
    try {
      await api.patch(`/users/${user.id}/ban`, {})
      loadUser()
    } catch { alert('操作失败') }
  }

  const outerStyle: React.CSSProperties = collapsed
    ? { maxWidth: 960, margin: '0 5% 60px 3%', transition: 'all .2s ease' }
    : { maxWidth: '100%', margin: '0 0 60px', transition: 'all .2s ease' }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8', fontSize: 15 }}>
      加载中...
    </div>
  )

  if (notFound || !user) return (
    <div style={{ textAlign: 'center', padding: '100px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
      <div style={{ color: '#94a3b8', fontSize: 15, marginBottom: 24 }}>用户不存在</div>
      <button onClick={() => router.push('/admin/users')} style={{
        padding: '10px 24px', borderRadius: 9,
        border: '1.5px solid #e2e8f0', background: '#fff',
        color: '#475569', fontSize: 14, cursor: 'pointer',
      }}>返回列表</button>
    </div>
  )

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'info',       label: '基本信息' },
    { key: 'login',      label: '登录记录' },
    { key: 'trial',      label: '视频浏览' },
    { key: 'essay',      label: '范文浏览' },
    { key: 'question',   label: '真题浏览' },
    { key: 'submission', label: '批改记录' },
  ]

  // ── 空状态组件 ──────────────────────────────────────────────────────
  const Empty = ({ emoji, text }: { emoji: string; text: string }) => (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{emoji}</div>
      <div style={{ fontSize: 14 }}>{text}</div>
    </div>
  )

  const Loading = () => (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>
      加载中...
    </div>
  )

  // ── 通用行容器 ──────────────────────────────────────────────────────
  const rowStyle = (idx: number): React.CSSProperties => ({
    display: 'flex', alignItems: 'flex-start', gap: 14,
    padding: '14px 18px', borderRadius: 12,
    background: idx === 0 ? '#fafafe' : '#f8fafc',
    border: '1.5px solid #f1f5f9',
  })

  const iconBox = (color: string): React.CSSProperties => ({
    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
    background: color, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 20,
  })

  const timeCol = (dt: Date) => {
    const isToday = new Date().toDateString() === dt.toDateString()
    return (
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e3a5f' }}>
          {isToday ? '今天' : dt.toLocaleDateString('zh-CN')}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
          {dt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    )
  }

  return (
    <div style={outerStyle}>

      {/* 返回 */}
      <button onClick={() => router.push('/admin/users')} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', borderRadius: 8, marginBottom: 20,
        border: '1.5px solid #e2e8f0', background: '#fff',
        color: '#64748b', fontSize: 14, cursor: 'pointer', fontWeight: 500,
      }}>
        {'← 返回列表'}
      </button>

      {/* 淡蓝头部 */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        border: '1.5px solid #bfdbfe', borderLeft: '5px solid #1d4ed8',
        borderRadius: 16, padding: '28px 32px', marginBottom: 20,
      }}>
        {/* 用户信息 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 700, color: '#fff', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(29,78,216,0.25)',
          }}>
            {user.username?.[0]?.toUpperCase() || user.phone[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1e3a5f', marginBottom: 4 }}>
              {user.username || '未设置昵称'}
            </div>
            <div style={{ fontSize: 15, color: '#64748b' }}>{user.phone}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
            <SubBadge sub={user.subscription} />
            {user.banned && (
              <span style={{
                fontSize: 12, padding: '4px 10px', borderRadius: 20,
                background: '#fef2f2', color: '#dc2626', fontWeight: 600,
              }}>已封禁</span>
            )}
          </div>
        </div>

        {/* Tab + 操作 */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: tab === t.key ? '#1d4ed8' : 'rgba(29,78,216,0.08)',
                color: tab === t.key ? '#fff' : '#1d4ed8',
                fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
                cursor: 'pointer', transition: 'all .15s',
              }}>{t.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowEdit(true)} style={{
              padding: '9px 20px', borderRadius: 9,
              border: '1.5px solid #bfdbfe', background: '#fff',
              color: '#1d4ed8', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>修改订阅</button>
            <button onClick={handleToggleBan} style={{
              padding: '9px 20px', borderRadius: 9, border: 'none',
              background: user.banned ? '#f0fdf4' : '#fef2f2',
              color: user.banned ? '#16a34a' : '#dc2626',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>{user.banned ? '解封账号' : '封禁账号'}</button>
          </div>
        </div>
      </div>

      {/* 内容卡片 */}
      <div style={{
        background: '#fff', borderRadius: 16,
        border: '1.5px solid #e8f0fe',
        boxShadow: '0 2px 12px rgba(59,130,246,0.06)',
      }}>
        <div style={{ padding: '28px 32px' }}>

          {/* ── 基本信息 ── */}
          {tab === 'info' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: collapsed ? '1fr' : '1fr 1fr',
              gap: 12,
            }}>
              {[
                { label: '用户 ID',  value: '#' + user.id },
                { label: '手机号',   value: user.phone },
                { label: '昵称',     value: user.username || '未设置' },
                { label: '角色',     value: user.role === 'ADMIN' ? '👑 管理员' : '普通用户' },
                { label: '订阅等级', value: SUB_LABELS[user.subscription]?.label || '免费' },
                {
                  label: '订阅到期',
                  value: user.subExpiresAt
                    ? new Date(user.subExpiresAt).toLocaleDateString('zh-CN')
                    : '无限期 / 未订阅',
                },
                { label: '注册时间', value: new Date(user.createdAt).toLocaleDateString('zh-CN') },
                { label: '账号状态', value: user.banned ? '🔴 已封禁' : '🟢 正常' },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '13px 16px',
                  background: '#f8faff', borderRadius: 10, border: '1px solid #e8f0fe',
                }}>
                  <span style={{ fontSize: 14, color: '#94a3b8' }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1e3a5f' }}>{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── 登录记录 ── */}
          {tab === 'login' && (
            <div>
              <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>最近 20 条登录记录</div>
              {loadingLogin ? <Loading /> : loginSessions.length === 0
                ? <Empty emoji="📋" text="暂无登录记录" />
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {loginSessions.map((s, idx) => {
                      const dt = new Date(s.createdAt)
                      const ip = s.deviceId.split('-')[0] || '未知'
                      return (
                        <div key={s.id} style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '14px 18px', borderRadius: 12,
                          background: idx === 0 ? '#eff6ff' : '#f8fafc',
                          border: `1.5px solid ${idx === 0 ? '#bfdbfe' : '#f1f5f9'}`,
                        }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                            background: idx === 0
                              ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : '#e2e8f0',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 18,
                          }}>
                            {idx === 0 ? '🟢' : '💻'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: 14, fontWeight: 600,
                              color: idx === 0 ? '#1d4ed8' : '#475569',
                              display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                              {'IP: ' + ip}
                              {idx === 0 && (
                                <span style={{
                                  fontSize: 11, background: '#dbeafe', color: '#1d4ed8',
                                  padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                                }}>最近一次</span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                              {'设备标识: ' + s.deviceId}
                            </div>
                          </div>
                          {timeCol(dt)}
                        </div>
                      )
                    })}
                  </div>
                )}
            </div>
          )}

          {/* ── 视频浏览 ── */}
          {tab === 'trial' && (
            <div>
              <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
                {'视频试看记录，共 ' + trialLogs.length + ' 个'}
              </div>
              {loadingTrial ? <Loading /> : trialLogs.length === 0
                ? <Empty emoji="🎬" text="暂无视频浏览记录" />
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {trialLogs.map((log, idx) => {
                      const color = CAT_COLOR[log.video.category] ?? '#64748b'
                      return (
                        <div key={log.id} style={rowStyle(idx)}>
                          <div style={iconBox(color + '18')}>🎬</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 14, fontWeight: 600, color: '#1e3a5f',
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap', marginBottom: 5,
                            }}>{log.video.title}</div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span style={{
                                fontSize: 11, padding: '2px 8px', borderRadius: 20,
                                background: color + '18', color, fontWeight: 600,
                              }}>{CAT_LABELS[log.video.category] ?? log.video.category}</span>
                              <span style={{ fontSize: 12, color: '#94a3b8' }}>{log.video.series}</span>
                              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                                {'⏱ ' + fmtDuration(log.video.duration)}
                              </span>
                            </div>
                          </div>
                          {timeCol(new Date(log.createdAt))}
                        </div>
                      )
                    })}
                  </div>
                )}
            </div>
          )}

          {/* ── 范文浏览 ── */}
          {tab === 'essay' && (
            <div>
              <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
                {'范文浏览记录，共 ' + essayViews.length + ' 篇'}
              </div>
              {loadingEssay ? <Loading /> : essayViews.length === 0
                ? <Empty emoji="📄" text="暂无范文浏览记录" />
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {essayViews.map((log, idx) => {
                      const task  = log.essay.question.task
                      const color = task === 'TASK2' ? '#3b82f6' : '#9333ea'
                      return (
                        <div key={log.id} style={rowStyle(idx)}>
                          <div style={iconBox(color + '15')}>📄</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 14, fontWeight: 600, color: '#1e3a5f',
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap', marginBottom: 6,
                            }}>
                              {log.essay.question.content}
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span style={{
                                fontSize: 11, padding: '2px 8px', borderRadius: 20,
                                background: color + '15', color, fontWeight: 600,
                              }}>{task === 'TASK2' ? 'Task 2' : 'Task 1'}</span>
                              {log.essay.question.subtype && (
                                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                                  {log.essay.question.subtype}
                                </span>
                              )}
                              {log.essay.score && (
                                <span style={{
                                  fontSize: 11, padding: '2px 8px', borderRadius: 20,
                                  background: '#eff6ff', color: '#1d4ed8', fontWeight: 700,
                                }}>{'Band ' + log.essay.score}</span>
                              )}
                            </div>
                          </div>
                          {timeCol(new Date(log.createdAt))}
                        </div>
                      )
                    })}
                  </div>
                )}
            </div>
          )}

          {/* ── 真题浏览 ── */}
          {tab === 'question' && (
            <div>
              <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
                {'真题浏览记录，共 ' + questionViews.length + ' 道'}
              </div>
              {loadingQuestion ? <Loading /> : questionViews.length === 0
                ? <Empty emoji="📚" text="暂无真题浏览记录" />
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {questionViews.map((log, idx) => {
                      const task  = log.question.task
                      const color = task === 'TASK2' ? '#3b82f6' : '#9333ea'
                      return (
                        <div key={log.id} style={rowStyle(idx)}>
                          <div style={iconBox(color + '15')}>📚</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 14, fontWeight: 600, color: '#1e3a5f',
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap', marginBottom: 6,
                            }}>
                              {log.question.content}
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{
                                fontSize: 11, padding: '2px 8px', borderRadius: 20,
                                background: color + '15', color, fontWeight: 600,
                              }}>{task === 'TASK2' ? 'Task 2' : 'Task 1'}</span>
                              {log.question.subtype && (
                                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                                  {log.question.subtype}
                                </span>
                              )}
                              {log.question.topic && (
                                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                                  {log.question.topic}
                                </span>
                              )}
                              {log.question.year && (
                                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                                  {log.question.year + '年'}
                                </span>
                              )}
                            </div>
                          </div>
                          {timeCol(new Date(log.createdAt))}
                        </div>
                      )
                    })}
                  </div>
                )}
            </div>
          )}

          {/* ── 批改记录 ── */}
          {tab === 'submission' && (
            <div>
              <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
                {'提交批改记录，共 ' + submissions.length + ' 条'}
              </div>
              {loadingSubmission ? <Loading /> : submissions.length === 0
                ? <Empty emoji="📝" text="暂无批改记录" />
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {submissions.map((s, idx) => {
                      const isDone    = s.status === 'REVIEWED'
                      const task      = s.question?.task || ''
                      const taskColor = task === 'TASK2' ? '#3b82f6' : '#9333ea'
                      const qText     = s.question?.content || s.customPrompt || '无题目信息'
                      return (
                        <div key={s.id} style={rowStyle(idx)}>
                          <div style={iconBox(isDone ? '#f0fdf4' : '#fef9c3')}>
                            {isDone ? '✅' : '⏳'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 14, fontWeight: 600, color: '#1e3a5f',
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap', marginBottom: 6,
                            }}>{qText}</div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                              {task && (
                                <span style={{
                                  fontSize: 11, padding: '2px 8px', borderRadius: 20,
                                  background: taskColor + '15', color: taskColor, fontWeight: 600,
                                }}>{task === 'TASK2' ? 'Task 2' : 'Task 1'}</span>
                              )}
                              <span style={{
                                fontSize: 11, padding: '2px 8px', borderRadius: 20,
                                background: isDone ? '#f0fdf4' : '#fef9c3',
                                color: isDone ? '#16a34a' : '#ca8a04', fontWeight: 600,
                              }}>{isDone ? '已批改' : '批改中'}</span>
                              {isDone && s.overallScore !== null && (
                                <span style={{
                                  fontSize: 11, padding: '2px 8px', borderRadius: 20,
                                  background: '#eff6ff', color: '#1d4ed8', fontWeight: 700,
                                }}>{'总分 ' + s.overallScore}</span>
                              )}
                            </div>
                            {isDone && s.adminComment && (
                              <div style={{
                                fontSize: 12, color: '#64748b', marginTop: 8,
                                padding: '8px 12px', background: '#f8faff',
                                borderRadius: 8, border: '1px solid #e8f0fe',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {'💬 ' + s.adminComment}
                              </div>
                            )}
                          </div>
                          {timeCol(new Date(s.createdAt))}
                        </div>
                      )
                    })}
                  </div>
                )}
            </div>
          )}

        </div>
      </div>

      {showEdit && (
        <EditModal user={user} onClose={() => setShowEdit(false)} onSaved={loadUser} />
      )}
    </div>
  )
}

export default function AdminUserDetailPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8', fontSize: 15 }}>
        加载中...
      </div>
    }>
      <UserDetailContent />
    </Suspense>
  )
}