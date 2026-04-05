'use client'

import { useState, useEffect } from 'react'
import { useLayoutStore } from '@/store/layoutStore'
import api from '@/lib/api'

// ─── 类型定义 ───────────────────────────────────────────
interface Stat         { icon: string; value: string; label: string }
interface Teacher      { id: number; name: string; title: string; avatar: string; score: string; experience: string; background: string; specialty: string[] }
interface SuccessCase  { id: number; nickname: string; from: number; to: number; duration: string; comment: string; tag: string }
interface Notice       { id: number; type: string; title: string; content: string; date: string }
interface ContactMethod{ icon: string; label: string; value: string; note: string }
interface AboutIntro   { title: string; description: string }

const NOTICE_TYPE_CONFIG = {
  update: { label: '更新', color: '#3b82f6', bg: '#eff6ff' },
  notice: { label: '公告', color: '#f59e0b', bg: '#fffbeb' },
  tip:    { label: '建议', color: '#22c55e', bg: '#f0fdf4' },
}

export default function AboutPage() {
  const { collapsed } = useLayoutStore()

  const [intro,          setIntro]          = useState<AboutIntro | null>(null)
  const [stats,          setStats]          = useState<Stat[]>([])
  const [teachers,       setTeachers]       = useState<Teacher[]>([])
  const [successCases,   setSuccessCases]   = useState<SuccessCase[]>([])
  const [notices,        setNotices]        = useState<Notice[]>([])
  const [contactMethods, setContactMethods] = useState<ContactMethod[]>([])
  const [activeCase,     setActiveCase]     = useState<number | null>(null)
  const [loading,        setLoading]        = useState(true)

  const [feedbackType, setFeedbackType] = useState('suggestion')
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackDone, setFeedbackDone] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [configRes, noticeRes] = await Promise.all([
          api.get('/site-config'),
          api.get('/notices'),
        ])
        const cfg = configRes.data
        if (cfg.about_intro)      setIntro(cfg.about_intro)
        if (cfg.stats)            setStats(cfg.stats)
        if (cfg.teachers)         setTeachers(cfg.teachers)
        if (cfg.success_cases)    setSuccessCases(cfg.success_cases)
        if (cfg.contact_methods)  setContactMethods(cfg.contact_methods)
        setNotices(noticeRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  async function handleFeedbackSubmit() {
    if (!feedbackText.trim()) return
    try {
      await api.post('/messages', {
        type:    feedbackType,
        title:   feedbackType === 'suggestion' ? '功能建议' :
                 feedbackType === 'bug'        ? '问题反馈' :
                 feedbackType === 'content'    ? '内容建议' : '其他反馈',
        content: feedbackText.trim(),
      })
      setFeedbackDone(true)
      setFeedbackText('')
    } catch (err) {
      console.error(err)
      alert('提交失败，请稍后重试')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8', fontSize: 14 }}>
        加载中...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: collapsed ? '960px' : '100%', margin: collapsed ? '0 20% 0 5%' : '0', transition: 'all .2s ease' }}>

      {/* 页头 */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>关于我们</h1>
        <p style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>专注雅思写作提分，陪你冲刺目标分数</p>
      </div>

      {/* 平台介绍 + 数据统计 */}
      <div style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', borderRadius: 20, padding: '32px', marginBottom: 24, color: '#fff' }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>
          🎯 {intro?.title ?? '雅思写作 PRO'}
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,.85)', margin: '0 0 28px', maxWidth: 600 }}>
          {intro?.description ?? ''}
        </p>
        {stats.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
            {stats.map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,.15)', borderRadius: 12, padding: '16px 20px', backdropFilter: 'blur(4px)' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 师资介绍 */}
      {teachers.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 4, height: 20, borderRadius: 2, background: '#3b82f6' }} />
            <span style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>师资介绍</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {teachers.map(t => (
              <div key={t.id} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '24px' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600, marginTop: 2 }}>{t.title}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{t.score}</span>
                      <span style={{ fontSize: 11, background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: 4 }}>{t.experience}</span>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, margin: '0 0 14px' }}>{t.background}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {t.specialty.map(s => (
                    <span key={s} style={{ fontSize: 11, background: '#eff6ff', color: '#3b82f6', padding: '3px 10px', borderRadius: 20, fontWeight: 500 }}>{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 学员成功案例 */}
      {successCases.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 4, height: 20, borderRadius: 2, background: '#22c55e' }} />
            <span style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>学员成功案例</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {successCases.map(c => (
              <div
                key={c.id}
                onClick={() => setActiveCase(activeCase === c.id ? null : c.id)}
                style={{ background: '#fff', border: `1.5px solid ${activeCase === c.id ? '#22c55e' : '#e2e8f0'}`, borderRadius: 14, padding: '18px 20px', cursor: 'pointer', transition: 'all .15s', boxShadow: activeCase === c.id ? '0 4px 16px rgba(34,197,94,.12)' : 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎓</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{c.nickname}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.duration}达成</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8' }}>{c.from}</span>
                    <span style={{ fontSize: 14, color: '#94a3b8' }}>→</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>{c.to}</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '2px 10px', borderRadius: 20, display: 'inline-block', marginBottom: 10 }}>{c.tag}</div>
                {activeCase === c.id ? (
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, margin: 0, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                    &ldquo;{c.comment}&rdquo;
                  </p>
                ) : (
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    &ldquo;{c.comment}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 告示板 */}
      {notices.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 4, height: 20, borderRadius: 2, background: '#f59e0b' }} />
            <span style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>告示板</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notices.map(n => {
              const config = NOTICE_TYPE_CONFIG[n.type as keyof typeof NOTICE_TYPE_CONFIG] ?? NOTICE_TYPE_CONFIG.notice
              return (
                <div key={n.id} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', borderLeft: `4px solid ${config.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: config.color, background: config.bg, padding: '2px 8px', borderRadius: 4 }}>{config.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', flex: 1 }}>{n.title}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>{n.date}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, margin: 0 }}>{n.content}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 联系方式 */}
      {contactMethods.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 4, height: 20, borderRadius: 2, background: '#8b5cf6' }} />
            <span style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>联系我们</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {contactMethods.map(m => (
              <div key={m.label} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{m.icon}</span>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{m.value}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{m.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 意见反馈 */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 4, height: 20, borderRadius: 2, background: '#ec4899' }} />
          <span style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>意见反馈</span>
        </div>
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '24px' }}>
          {feedbackDone ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>感谢你的反馈！</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>我们会认真阅读每一条建议，持续改进平台体验。</div>
              <button onClick={() => setFeedbackDone(false)} style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>再提交一条</button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {([
                  { val: 'suggestion', label: '💡 功能建议' },
                  { val: 'bug',        label: '🐛 问题反馈' },
                  { val: 'content',    label: '📝 内容建议' },
                  { val: 'other',      label: '💬 其他' },
                ]).map(({ val, label }) => (
                  <button key={val} onClick={() => setFeedbackType(val)} style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer', border: feedbackType === val ? '1.5px solid #ec4899' : '1.5px solid #e2e8f0', background: feedbackType === val ? '#fdf2f8' : '#f8fafc', color: feedbackType === val ? '#ec4899' : '#64748b', fontWeight: feedbackType === val ? 600 : 400, transition: 'all .15s' }}>{label}</button>
                ))}
              </div>
              <textarea
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="请写下你的想法或遇到的问题..."
                rows={5}
                style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#1e293b', resize: 'vertical', outline: 'none', background: '#fafafa', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.7, marginBottom: 14 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{feedbackText.length} 字</span>
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={!feedbackText.trim()}
                  style={{ padding: '10px 28px', borderRadius: 10, border: 'none', background: feedbackText.trim() ? 'linear-gradient(135deg, #ec4899, #db2777)' : '#cbd5e1', color: '#fff', fontWeight: 700, fontSize: 14, cursor: feedbackText.trim() ? 'pointer' : 'not-allowed', transition: 'all .15s' }}
                >提交反馈</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}