'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useLayoutStore } from '@/store/layoutStore'

type Plan = 'FREE' | 'BASIC' | 'PRO'
type ProCycle = 'monthly' | 'bimonthly' | 'quarterly' | 'lifetime'
type BasicCycle = 'monthly' | 'bimonthly' | 'quarterly'

const BASIC_OPTIONS = [
  { cycle: 'monthly' as BasicCycle, label: '1 个月', price: 69, badge: '' },
  { cycle: 'bimonthly' as BasicCycle, label: '2 个月', price: 128, badge: '省10元' },
  { cycle: 'quarterly' as BasicCycle, label: '3 个月', price: 150, badge: '省57元' },
]

const PRO_OPTIONS = [
  { cycle: 'monthly' as ProCycle, label: '1 个月', price: 1499, badge: '', corrections: '每月赠4篇批改，不限题型' },
  { cycle: 'bimonthly' as ProCycle, label: '2 个月', price: 1800, badge: '省198元', corrections: '每月赠4篇批改，不限题型' },
  { cycle: 'quarterly' as ProCycle, label: '3 个月', price: 2400, badge: '省97元', corrections: '每月赠4篇批改，不限题型' },
  { cycle: 'lifetime' as ProCycle, label: '永久', price: 3000, badge: '最划算', corrections: '共赠18篇批改，不限题型' },
]

const FEATURES: {
  label: string
  free: boolean
  basic: boolean
  pro: boolean
  hideWhenLifetime?: boolean
  onlyLifetime?: boolean
}[] = [
  { label: '真题库浏览', free: true, basic: true, pro: true },
  { label: '每题写作思路（每日4次）', free: true, basic: true, pro: true },
  { label: '模拟机考（无限次）', free: true, basic: true, pro: true },
  { label: '范文阅读', free: false, basic: true, pro: true },
  { label: '范文 PDF 下载', free: false, basic: true, pro: true },
  { label: '提交批改（需单独购买次数）', free: true, basic: true, pro: false },
  { label: '提交批改（每月赠4篇，不限题型）', free: false, basic: false, pro: true, hideWhenLifetime: true },
  { label: '提交批改（共赠18篇，不限题型）', free: false, basic: false, pro: true, onlyLifetime: true },
  { label: '视频课试看（每天2个限5分钟）', free: true, basic: true, pro: false },
  { label: '视频课完整观看（无限制）', free: false, basic: false, pro: true },
  { label: '专属客服支持', free: false, basic: false, pro: true },
]

const PLAN_CONFIG = {
  FREE: { name: '免费版', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', highlights: ['真题库免费浏览', '写作思路每日4次', '视频课每天试看2个'], priceText: '¥0', priceNote: '永久免费', recommended: false },
  BASIC: { name: '基础版', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', highlights: ['范文阅读 + PDF下载', '模拟机考无限次', '批改可单独购买'], priceText: '¥69起', priceNote: '1个月 · 可选2/3个月', recommended: false },
  PRO: { name: '高级版', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', highlights: ['视频课完整观看', '月付每月赠4篇批改', '永久套餐共赠18篇'], priceText: '¥1499起', priceNote: '1个月 · 可选2/3个月/永久', recommended: true },
}

function PlanModal({ plan, currentPlan, onClose }: { plan: Plan; currentPlan: Plan; onClose: () => void }) {
  const config = PLAN_CONFIG[plan]
  const isCurrent = currentPlan === plan
  const [basicCycle, setBasicCycle] = useState<BasicCycle>('monthly')
  const [proCycle, setProCycle] = useState<ProCycle>('monthly')
  const selectedBasic = BASIC_OPTIONS.find(o => o.cycle === basicCycle)!
  const selectedPro = PRO_OPTIONS.find(o => o.cycle === proCycle)!

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(15,23,42,.25)' }}>

        {/* 弹窗头部 */}
        <div style={{ padding: '24px 24px 20px', background: config.bg, borderBottom: `1px solid ${config.border}`, borderRadius: '20px 20px 0 0', position: 'sticky', top: 0, zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: config.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                {config.name}
                {isCurrent && <span style={{ marginLeft: 8, fontSize: 11, background: config.color, color: '#fff', padding: '2px 8px', borderRadius: 10 }}>当前方案</span>}
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>
                {plan === 'FREE' ? '¥0' : plan === 'BASIC' ? `¥${selectedBasic.price}` : `¥${selectedPro.price}`}
              </div>
              {plan !== 'FREE' && (
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  {plan === 'BASIC' ? selectedBasic.label : `${selectedPro.label}${selectedPro.corrections ? ' · ' + selectedPro.corrections : ''}`}
                </div>
              )}
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 16, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
          </div>
        </div>

        <div style={{ padding: '20px 24px 28px' }}>

          {/* 价格选择 BASIC */}
          {plan === 'BASIC' && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>选择时长</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {BASIC_OPTIONS.map(opt => (
                  <div key={opt.cycle} onClick={() => setBasicCycle(opt.cycle)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', border: basicCycle === opt.cycle ? `1.5px solid ${config.color}` : '1.5px solid #e2e8f0', background: basicCycle === opt.cycle ? config.bg : '#fff', transition: 'all .12s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${basicCycle === opt.cycle ? config.color : '#cbd5e1'}`, background: basicCycle === opt.cycle ? config.color : '#fff', flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: '#1e293b', fontWeight: basicCycle === opt.cycle ? 600 : 400 }}>{opt.label}</span>
                      {opt.badge && <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '1px 6px', borderRadius: 4 }}>{opt.badge}</span>}
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: config.color }}>¥{opt.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 价格选择 PRO */}
          {plan === 'PRO' && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>选择时长</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PRO_OPTIONS.map(opt => (
                  <div key={opt.cycle} onClick={() => setProCycle(opt.cycle)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', border: proCycle === opt.cycle ? `1.5px solid ${config.color}` : '1.5px solid #e2e8f0', background: proCycle === opt.cycle ? config.bg : '#fff', transition: 'all .12s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${proCycle === opt.cycle ? config.color : '#cbd5e1'}`, background: proCycle === opt.cycle ? config.color : '#fff', flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: 14, color: '#1e293b', fontWeight: proCycle === opt.cycle ? 600 : 400 }}>{opt.label}</span>
                        {opt.corrections && <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>{opt.corrections}</span>}
                      </div>
                      {opt.badge && <span style={{ fontSize: 10, fontWeight: 700, color: opt.badge === '最划算' ? '#d97706' : '#16a34a', background: opt.badge === '最划算' ? '#fef3c7' : '#dcfce7', padding: '1px 6px', borderRadius: 4 }}>{opt.badge}</span>}
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: config.color }}>¥{opt.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 功能列表 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>包含功能</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FEATURES.map(f => {
                const ok = plan === 'FREE' ? f.free : plan === 'BASIC' ? f.basic : f.pro
                if (plan === 'PRO' && f.hideWhenLifetime && proCycle === 'lifetime') return null
                if (plan === 'PRO' && f.onlyLifetime && proCycle !== 'lifetime') return null
                return (
                  <div key={f.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, opacity: ok ? 1 : 0.35 }}>
                    <span style={{ fontSize: 15, color: ok ? config.color : '#e2e8f0', flexShrink: 0 }}>{ok ? '✓' : '✕'}</span>
                    <span style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{f.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 购买按钮 */}
          <button disabled style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'not-allowed', background: isCurrent || plan === 'FREE' ? '#f1f5f9' : plan === 'PRO' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #3b82f6, #2563eb)', color: isCurrent || plan === 'FREE' ? '#94a3b8' : '#fff', opacity: isCurrent || plan === 'FREE' ? 1 : 0.75 }}>
            {isCurrent ? '已是当前方案' : plan === 'FREE' ? '当前免费使用中' : '支付功能即将开放'}
          </button>
          {!isCurrent && plan !== 'FREE' && (
            <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', margin: '10px 0 0' }}>支付功能即将开放，如需提前购买请联系客服</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  const { user } = useAuthStore()
  const { collapsed } = useLayoutStore()
  const currentPlan: Plan = (user?.subscription as Plan) ?? 'FREE'
  const [openPlan, setOpenPlan] = useState<Plan | null>(null)

  return (
    <div style={{ maxWidth: collapsed ? '960px' : '100%', margin: collapsed ? '0 20% 0 5%' : '0', transition: 'all .2s ease' }}>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>订阅方案</h1>
        <p style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>选择适合你的方案，点击卡片查看详情</p>
      </div>

      <div className="pricing-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
        {(['FREE', 'BASIC', 'PRO'] as Plan[]).map(plan => {
          const config = PLAN_CONFIG[plan]
          const isCurrent = currentPlan === plan
          return (
            <div key={plan} onClick={() => setOpenPlan(plan)}
              style={{ background: '#fff', border: `2px solid ${isCurrent ? config.color : config.border}`, borderRadius: 18, padding: '28px 24px', cursor: 'pointer', position: 'relative', boxShadow: isCurrent ? `0 0 0 3px ${config.color}22` : config.recommended ? '0 8px 24px rgba(245,158,11,.12)' : 'none', transition: 'transform .15s, box-shadow .15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.10)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isCurrent ? `0 0 0 3px ${config.color}22` : config.recommended ? '0 8px 24px rgba(245,158,11,.12)' : 'none' }}
            >
              {(config.recommended || isCurrent) && (
                <div style={{ position: 'absolute', top: -1, right: 20, background: isCurrent ? config.color : 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: '0 0 8px 8px' }}>
                  {isCurrent ? '当前方案' : '推荐'}
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 700, color: config.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{config.name}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#1e293b', lineHeight: 1, marginBottom: 4 }}>{config.priceText}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>{config.priceNote}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {config.highlights.map(h => (
                  <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: config.color, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, color: '#475569' }}>{h}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: config.color, padding: '10px', border: `1.5px solid ${config.border}`, borderRadius: 8, background: config.bg }}>
                查看详情 ›
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>💬</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1e40af', marginBottom: 4 }}>有疑问？联系我们</div>
          <div style={{ fontSize: 13, color: '#3b82f6', lineHeight: 1.7 }}>如需了解方案详情、团队购买或提前购买，请通过「联系客服」页面联系我们，我们将在 24 小时内回复。</div>
        </div>
      </div>

      {openPlan && <PlanModal plan={openPlan} currentPlan={currentPlan} onClose={() => setOpenPlan(null)} />}

      <style>{`
        @media (max-width: 640px) {
          .pricing-cards { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}