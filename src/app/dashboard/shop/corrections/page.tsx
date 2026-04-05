'use client'

import { useState } from 'react'
import { useLayoutStore } from '@/store/layoutStore'
import { useCartStore } from '@/store/cartStore'

type CodeType = 'TASK2' | 'TASK1' | 'ANY'

interface CorrectionProduct {
  id: string
  title: string
  subtitle: string
  price: number
  originalPrice?: number
  codeType: CodeType
  codeCount: number
  task2Count: number
  task1Count: number
  anyCount: number
  badge?: string
  badgeColor?: string
  isFirstTime?: boolean
  highlight?: boolean
  description: string
  savings?: string
}

const PRODUCTS: CorrectionProduct[] = [
  { id: 'first-task2', title: '大作文首篇批改', subtitle: 'Task 2 · 首篇优惠', price: 45, originalPrice: 85, codeType: 'TASK2', codeCount: 1, task2Count: 1, task1Count: 0, anyCount: 0, badge: '首篇优惠', badgeColor: '#22c55e', isFirstTime: true, description: '每人限购一次，含详细批注、四项评分分析及提升建议。', savings: '省¥40' },
  { id: 'first-task1', title: '小作文首篇批改', subtitle: 'Task 1 · 首篇优惠', price: 35, originalPrice: 55, codeType: 'TASK1', codeCount: 1, task2Count: 0, task1Count: 1, anyCount: 0, badge: '首篇优惠', badgeColor: '#22c55e', isFirstTime: true, description: '每人限购一次，含详细批注、数据描述和结构分析及提升建议。', savings: '省¥20' },
  { id: 'single-task2', title: '大作文单篇批改', subtitle: 'Task 2 · 单篇', price: 85, codeType: 'TASK2', codeCount: 1, task2Count: 1, task1Count: 0, anyCount: 0, description: '购买后获得一个大作文批改码，可在提交批改页面使用，不限时间。' },
  { id: 'single-task1', title: '小作文单篇批改', subtitle: 'Task 1 · 单篇', price: 55, codeType: 'TASK1', codeCount: 1, task2Count: 0, task1Count: 1, anyCount: 0, description: '购买后获得一个小作文批改码，可在提交批改页面使用，不限时间。' },
  { id: 'bundle-1-1', title: '1大 + 1小', subtitle: '混合套餐', price: 130, originalPrice: 140, codeType: 'TASK2', codeCount: 2, task2Count: 1, task1Count: 1, anyCount: 0, badge: '套餐优惠', badgeColor: '#3b82f6', description: '获得1个大作文批改码 + 1个小作文批改码，分别在提交批改时使用。', savings: '省¥10' },
  { id: 'bundle-2-2', title: '2大 + 2小', subtitle: '混合套餐', price: 260, originalPrice: 280, codeType: 'TASK2', codeCount: 4, task2Count: 2, task1Count: 2, anyCount: 0, badge: '套餐优惠', badgeColor: '#3b82f6', description: '获得2个大作文批改码 + 2个小作文批改码，随时使用不过期。', savings: '省¥20', highlight: true },
  { id: 'bundle-5-5', title: '5大 + 5小', subtitle: '混合套餐', price: 620, originalPrice: 700, codeType: 'TASK2', codeCount: 10, task2Count: 5, task1Count: 5, anyCount: 0, badge: '超值套餐', badgeColor: '#f59e0b', description: '获得5个大作文批改码 + 5个小作文批改码，适合备考周期较长的考生。', savings: '省¥80' },
  { id: 'pack-task2-5', title: '5篇大作文批改包', subtitle: 'Task 2 · 5篇', price: 400, originalPrice: 425, codeType: 'TASK2', codeCount: 5, task2Count: 5, task1Count: 0, anyCount: 0, badge: '批量优惠', badgeColor: '#8b5cf6', description: '获得5个大作文批改码，适合专攻大作文提分的考生。', savings: '省¥25' },
  { id: 'pack-task1-5', title: '5篇小作文批改包', subtitle: 'Task 1 · 5篇', price: 250, originalPrice: 275, codeType: 'TASK1', codeCount: 5, task2Count: 0, task1Count: 5, anyCount: 0, badge: '批量优惠', badgeColor: '#8b5cf6', description: '获得5个小作文批改码，适合专攻小作文提分的考生。', savings: '省¥25' },
  { id: 'pack-any-10', title: '10篇不限题型批改包', subtitle: '大小作文均可 · 10篇', price: 768, originalPrice: 850, codeType: 'ANY', codeCount: 10, task2Count: 0, task1Count: 0, anyCount: 10, badge: '最划算', badgeColor: '#f59e0b', highlight: true, description: '获得10个通用批改码，大作文小作文均可使用，灵活搭配，按大作文定价享优惠。', savings: '省¥82' },
]

const SECTIONS = [
  { key: 'first', label: '首篇优惠', ids: ['first-task2', 'first-task1'] },
  { key: 'single', label: '单篇', ids: ['single-task2', 'single-task1'] },
  { key: 'bundle', label: '混合套餐', ids: ['bundle-1-1', 'bundle-2-2', 'bundle-5-5'] },
  { key: 'pack', label: '同题型包', ids: ['pack-task2-5', 'pack-task1-5'] },
  { key: 'any', label: '不限题型包', ids: ['pack-any-10'] },
]

function ProductModal({ product, onClose, onAddToCart, inCart, firstTimePurchased }: {
  product: CorrectionProduct
  onClose: () => void
  onAddToCart: (product: CorrectionProduct) => void
  inCart: boolean
  firstTimePurchased: boolean
}) {
  const isLocked = product.isFirstTime && firstTimePurchased
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(15,23,42,.25)' }}>
        <div style={{ padding: '28px 32px 22px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: '#fff', borderRadius: '20px 20px 0 0', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: product.codeType === 'TASK2' ? '#3b82f6' : product.codeType === 'TASK1' ? '#0891b2' : '#f59e0b', background: product.codeType === 'TASK2' ? '#eff6ff' : product.codeType === 'TASK1' ? '#ecfeff' : '#fffbeb', padding: '2px 8px', borderRadius: 4 }}>
                  {product.codeType === 'TASK2' ? '大作文码' : product.codeType === 'TASK1' ? '小作文码' : '通用码'}
                </span>
                {product.badge && <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: product.badgeColor, padding: '2px 8px', borderRadius: 4 }}>{product.badge}</span>}
                {product.isFirstTime && <span style={{ fontSize: 11, color: '#64748b' }}>每人限购1次</span>}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: '0 0 4px', lineHeight: 1.4 }}>{product.title}</h2>
              <div style={{ fontSize: 13, color: '#64748b' }}>{product.subtitle}</div>
            </div>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 18, color: '#64748b', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        </div>

        <div style={{ padding: '24px 32px 32px' }}>
          <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>🎫 购买后获得的批改码</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {product.task2Count > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>✍️</span>
                  <span style={{ fontSize: 14, color: '#475569' }}>大作文批改码 × <strong>{product.task2Count}</strong><span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 6 }}>仅可用于 Task 2</span></span>
                </div>
              )}
              {product.task1Count > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>📊</span>
                  <span style={{ fontSize: 14, color: '#475569' }}>小作文批改码 × <strong>{product.task1Count}</strong><span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 6 }}>仅可用于 Task 1</span></span>
                </div>
              )}
              {product.anyCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🔑</span>
                  <span style={{ fontSize: 14, color: '#475569' }}>通用批改码 × <strong>{product.anyCount}</strong><span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 6 }}>大小作文均可使用</span></span>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>📋 使用方式</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                '购买成功后，批改码将显示在「购买记录」页面',
                '在「提交批改」页面输入批改码即可提交作文',
                '模考结束后也可直接使用批改码提交',
                '批改码不限使用时间，购买后永久有效',
                product.codeType === 'ANY' ? '通用码大小作文均可使用，每个码只能用一次' : `批改码有题型限制，${product.codeType === 'TASK2' ? '大作文码只能提交 Task 2' : '小作文码只能提交 Task 1'}`,
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: '#3b82f6', flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {product.isFirstTime && (
            <div style={{ background: isLocked ? '#fef2f2' : '#f0fdf4', border: `1.5px solid ${isLocked ? '#fecaca' : '#bbf7d0'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: isLocked ? '#dc2626' : '#16a34a' }}>
              {isLocked ? '⚠️ 你已购买过此首篇优惠，每人限购1次。' : '✓ 首篇优惠每人限购1次，购买后不可退款。'}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 34, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>¥{product.price}</span>
                {product.originalPrice && <span style={{ fontSize: 15, color: '#cbd5e1', textDecoration: 'line-through' }}>¥{product.originalPrice}</span>}
              </div>
              {product.savings && <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, marginTop: 4 }}>{product.savings}</div>}
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>支付功能即将开放</div>
            </div>
            <button
              disabled={isLocked || inCart}
              onClick={() => { if (!isLocked && !inCart) { onAddToCart(product); onClose() } }}
              style={{
                padding: '13px 32px', borderRadius: 12, border: 'none',
                background: isLocked || inCart ? '#f1f5f9' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: isLocked || inCart ? '#94a3b8' : '#fff',
                fontWeight: 700, fontSize: 15,
                cursor: isLocked || inCart ? 'not-allowed' : 'pointer',
                boxShadow: !isLocked && !inCart ? '0 4px 14px rgba(59,130,246,.30)' : 'none',
                minWidth: 160,
              }}
            >
              {isLocked ? '已达限购上限' : inCart ? '✓ 已加入购物车' : '🛒 加入购物车'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product, onClick, inCart, firstTimePurchased }: {
  product: CorrectionProduct
  onClick: () => void
  inCart: boolean
  firstTimePurchased: boolean
}) {
  const isLocked = product.isFirstTime && firstTimePurchased
  return (
    <div onClick={onClick} style={{ background: '#fff', border: `2px solid ${product.highlight ? '#3b82f6' : '#e2e8f0'}`, borderRadius: 14, padding: '20px', cursor: 'pointer', position: 'relative', transition: 'transform .15s, box-shadow .15s', boxShadow: product.highlight ? '0 4px 16px rgba(59,130,246,.12)' : 'none', opacity: isLocked ? 0.6 : 1 }}
      onMouseEnter={e => { if (!isLocked) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.10)' } }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = product.highlight ? '0 4px 16px rgba(59,130,246,.12)' : 'none' }}
    >
      {product.badge && <div style={{ position: 'absolute', top: -1, right: 16, background: product.badgeColor, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: '0 0 6px 6px' }}>{product.badge}</div>}
      {inCart && <div style={{ position: 'absolute', top: 12, left: 12, background: '#22c55e', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>已加入</div>}
      {isLocked && <div style={{ position: 'absolute', top: 12, left: 12, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>已购买</div>}

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{product.title}</div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>{product.subtitle}</div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {product.task2Count > 0 && <span style={{ fontSize: 11, color: '#3b82f6', background: '#eff6ff', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>大作文码×{product.task2Count}</span>}
        {product.task1Count > 0 && <span style={{ fontSize: 11, color: '#0891b2', background: '#ecfeff', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>小作文码×{product.task1Count}</span>}
        {product.anyCount > 0 && <span style={{ fontSize: 11, color: '#f59e0b', background: '#fffbeb', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>通用码×{product.anyCount}</span>}
        {product.isFirstTime && <span style={{ fontSize: 11, color: '#94a3b8', background: '#f8fafc', padding: '2px 8px', borderRadius: 4 }}>限购1次</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>¥{product.price}</span>
        {product.originalPrice && <span style={{ fontSize: 13, color: '#cbd5e1', textDecoration: 'line-through' }}>¥{product.originalPrice}</span>}
        {product.savings && <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>{product.savings}</span>}
      </div>
    </div>
  )
}

export default function CorrectionsPage() {
  const { collapsed } = useLayoutStore()
  const { items: cartItems, addItem } = useCartStore()
  const [selected, setSelected] = useState<CorrectionProduct | null>(null)

  const firstTimePurchasedTask2 = false
  const firstTimePurchasedTask1 = false

  function isFirstTimePurchased(product: CorrectionProduct) {
    if (!product.isFirstTime) return false
    if (product.id === 'first-task2') return firstTimePurchasedTask2
    if (product.id === 'first-task1') return firstTimePurchasedTask1
    return false
  }

  function addToCart(product: CorrectionProduct) {
    addItem({
      id: product.id,
      type: 'correction',
      title: product.title,
      price: product.price,
      task2Count: product.task2Count,
      task1Count: product.task1Count,
      anyCount: product.anyCount,
    })
  }

  return (
    <div style={{ maxWidth: collapsed ? '960px' : '100%', margin: collapsed ? '0 20% 0 5%' : '0', transition: 'all .2s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>购买批改</h1>
            <p style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>购买批改码后，在提交批改页面输入即可提交。码永久有效，不受订阅等级限制。</p>
          </div>
          {cartItems.length > 0 && (
            <a href="/dashboard/shop/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none', boxShadow: '0 3px 10px rgba(59,130,246,.30)' }}>
              🛒 购物车 ({cartItems.length})
            </a>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        {[
          { icon: '✍️', title: '大作文码', desc: '仅可提交 Task 2 大作文', color: '#3b82f6', bg: '#eff6ff' },
          { icon: '📊', title: '小作文码', desc: '仅可提交 Task 1 小作文', color: '#0891b2', bg: '#ecfeff' },
          { icon: '🔑', title: '通用码', desc: '大小作文均可提交', color: '#f59e0b', bg: '#fffbeb' },
        ].map(({ icon, title, desc, color, bg }) => (
          <div key={title} style={{ flex: 1, minWidth: 160, background: bg, border: `1.5px solid ${color}33`, borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color }}>{title}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {SECTIONS.map(section => (
        <div key={section.key} style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 4, height: 20, borderRadius: 2, background: '#3b82f6' }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{section.label}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: section.ids.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {section.ids.map(id => {
              const product = PRODUCTS.find(p => p.id === id)!
              return (
                <ProductCard
                  key={id}
                  product={product}
                  onClick={() => setSelected(product)}
                  inCart={cartItems.some(i => i.id === id)}
                  firstTimePurchased={isFirstTimePurchased(product)}
                />
              )
            })}
          </div>
        </div>
      ))}

      <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 14, padding: '18px 22px', marginBottom: 40, display: 'flex', gap: 12 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>💬</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1e40af', marginBottom: 4 }}>支付功能即将开放</div>
          <div style={{ fontSize: 13, color: '#3b82f6', lineHeight: 1.7 }}>如需提前购买批改服务，请通过「联系客服」页面联系我们，我们将手动为你开通批改码。</div>
        </div>
      </div>

      {selected && (
        <ProductModal
          product={selected}
          onClose={() => setSelected(null)}
          onAddToCart={addToCart}
          inCart={cartItems.some(i => i.id === selected.id)}
          firstTimePurchased={isFirstTimePurchased(selected)}
        />
      )}
    </div>
  )
}