'use client'

import { useState, useEffect } from 'react'
import { useLayoutStore } from '@/store/layoutStore'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'

const BASE_URL = 'http://localhost:4000'

interface ContactConfig { wechat_service: { desc1: string; desc2: string; desc3: string }; wechat_public: { name: string; desc1: string; desc2: string }; email: string; email_note: string }

export default function ContactPage() {
  const { collapsed } = useLayoutStore()
  const { user } = useAuthStore()

  const [contactConfig, setContactConfig] = useState<ContactConfig | null>(null)
  const [qrWechat,      setQrWechat]      = useState('')
  const [qrPublic,      setQrPublic]      = useState('')
  const [loading,       setLoading]       = useState(true)

  const [formType,    setFormType]    = useState('question')
  const [formTitle,   setFormTitle]   = useState('')
  const [formContent, setFormContent] = useState('')
  const [formDone,    setFormDone]    = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [copied,      setCopied]      = useState(false)

  useEffect(() => {
    api.get('/site-config')
      .then(r => {
        const cfg = r.data
        if (cfg.contact_config) setContactConfig(cfg.contact_config)
        if (cfg.qr_wechat)      setQrWechat(cfg.qr_wechat)
        if (cfg.qr_public)      setQrPublic(cfg.qr_public)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit() {
    if (!formTitle.trim() || !formContent.trim()) return
    setSubmitting(true)
    try {
      await api.post('/messages', {
        type:    formType,
        title:   formTitle.trim(),
        content: formContent.trim(),
      })
      setFormDone(true)
    } catch (err) {
      console.error(err)
      alert('提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(contactConfig?.email ?? 'support@ieltspro.cn')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const wechatCards = [
    {
      title:   '微信客服',
      icon:    '💬',
      qrUrl:   qrWechat,
      qrLabel: '微信二维码',
      desc1:   contactConfig?.wechat_service?.desc1 ?? '扫码添加客服微信',
      desc2:   contactConfig?.wechat_service?.desc2 ?? '添加时备注「学员」',
      desc3:   contactConfig?.wechat_service?.desc3 ?? '工作日 9:00 - 22:00 在线',
      name:    '',
    },
    {
      title:   '微信公众号',
      icon:    '📣',
      qrUrl:   qrPublic,
      qrLabel: '公众号二维码',
      desc1:   contactConfig?.wechat_public?.desc1 ?? '关注公众号',
      desc2:   contactConfig?.wechat_public?.desc2 ?? '获取最新题目更新和学习资讯',
      desc3:   '',
      name:    contactConfig?.wechat_public?.name  ?? 'IELTSWritingPro',
    },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8', fontSize: 14 }}>
        加载中...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: collapsed ? '960px' : '100%', margin: collapsed ? '0 20% 0 5%' : '0', transition: 'all .2s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>联系客服</h1>
        <p style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>有任何问题或建议，欢迎随时联系我们</p>
      </div>

      {/* 微信扫码 + 公众号 */}
      <div className="contact-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
        {wechatCards.map(item => (
          <div key={item.title} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{item.icon} {item.title}</div>

            {/* 二维码区域 */}
            <div style={{ width: 140, height: 140, borderRadius: 12, overflow: 'hidden', border: '2px dashed #cbd5e1', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
              {item.qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`${BASE_URL}${item.qrUrl}`} alt={item.qrLabel} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <span style={{ fontSize: 36, color: '#cbd5e1' }}>📷</span>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>{item.qrLabel}</span>
                </>
              )}
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{item.desc1}</div>
              {item.name && <div style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600, marginTop: 4 }}>{item.name}</div>}
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{item.desc2}</div>
              {item.desc3 && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.desc3}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* 邮箱 */}
      <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '18px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📧</div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>电子邮箱</div>
          <div style={{ fontSize: 15, color: '#3b82f6', fontWeight: 600, marginTop: 2 }}>{contactConfig?.email ?? 'support@ieltspro.cn'}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{contactConfig?.email_note ?? '工作日 24 小时内回复，节假日 48 小时内回复'}</div>
        </div>
        <button onClick={handleCopy} style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: copied ? '#f0fdf4' : '#f8fafc', color: copied ? '#16a34a' : '#64748b', fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}>
          {copied ? '✓ 已复制' : '复制'}
        </button>
      </div>

      {/* 在线留言 */}
      <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '24px', marginBottom: 48 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>📝 在线留言</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>提交后客服将在工作日 24 小时内通过邮箱或微信回复</div>

        {formDone ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>留言已提交！</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>我们将在工作日 24 小时内回复你</div>
            <button onClick={() => { setFormDone(false); setFormTitle(''); setFormContent('') }} style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: 13 }}>
              再提交一条
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {([
                { val: 'question',   label: '❓ 使用问题' },
                { val: 'payment',    label: '💳 支付问题' },
                { val: 'correction', label: '✏️ 批改问题' },
                { val: 'suggestion', label: '💡 建议' },
                { val: 'other',      label: '💬 其他' },
              ]).map(({ val, label }) => (
                <button key={val} onClick={() => setFormType(val)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer', border: formType === val ? '1.5px solid #3b82f6' : '1.5px solid #e2e8f0', background: formType === val ? '#eff6ff' : '#f8fafc', color: formType === val ? '#2563eb' : '#64748b', fontWeight: formType === val ? 600 : 400, transition: 'all .15s' }}>{label}</button>
              ))}
            </div>

            {user && (
              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>👤 {user.username || '用户'}</span>
                <span style={{ fontSize: 13, color: '#64748b' }}>📱 {user.phone}</span>
                <span style={{ fontSize: 13, color: '#64748b' }}>💎 {user.subscription === 'PRO' ? '高级会员' : user.subscription === 'BASIC' ? '基础会员' : '免费用户'}</span>
              </div>
            )}

            <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="请简要描述问题标题..."
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#1e293b', outline: 'none', background: '#fafafa', boxSizing: 'border-box', marginBottom: 12, fontFamily: 'inherit' }} />
            <textarea value={formContent} onChange={e => setFormContent(e.target.value)} rows={5}
              placeholder="请详细描述你遇到的问题或建议，越详细越好..."
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#1e293b', resize: 'vertical', outline: 'none', background: '#fafafa', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.7, marginBottom: 14 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleSubmit} disabled={!formTitle.trim() || !formContent.trim() || submitting}
                style={{ padding: '11px 32px', borderRadius: 10, border: 'none', background: formTitle.trim() && formContent.trim() ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#cbd5e1', color: '#fff', fontWeight: 700, fontSize: 14, cursor: formTitle.trim() && formContent.trim() ? 'pointer' : 'not-allowed' }}>
                {submitting ? '提交中...' : '提交留言'}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .contact-cards { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}