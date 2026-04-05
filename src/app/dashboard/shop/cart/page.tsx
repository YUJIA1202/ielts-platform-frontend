'use client'

import { useLayoutStore } from '@/store/layoutStore'
import { useCartStore } from '@/store/cartStore'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const { collapsed } = useLayoutStore()
  const { items, removeItem, clearCart, total } = useCartStore()
  const router = useRouter()

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: collapsed ? '960px' : '100%', margin: collapsed ? '0 20% 0 5%' : '0', transition: 'all .2s ease' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>购物车</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>购物车是空的</div>
          <div style={{ fontSize: 14, marginBottom: 28 }}>去添加一些资料或批改服务吧</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => router.push('/dashboard/shop')} style={{ padding: '10px 24px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#3b82f6', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>浏览资料</button>
            <button onClick={() => router.push('/dashboard/shop/corrections')} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>购买批改</button>
          </div>
        </div>
      </div>
    )
  }

  const resourceItems = items.filter(i => i.type === 'resource')
  const correctionItems = items.filter(i => i.type === 'correction')

  return (
    <div style={{ maxWidth: collapsed ? '960px' : '100%', margin: collapsed ? '0 20% 0 5%' : '0', transition: 'all .2s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>购物车</h1>
        <p style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>共 {items.length} 件商品</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

        {/* 左列 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {resourceItems.length > 0 && (
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', fontSize: 13, fontWeight: 700, color: '#475569' }}>
                📄 学习资料 ({resourceItems.length})
              </div>
              {resourceItems.map((item, i) => (
                <div key={item.id} style={{ padding: '16px 20px', borderBottom: i < resourceItems.length - 1 ? '1px solid #f8fafc' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📄</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>一次购买，永久下载</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', flexShrink: 0 }}>¥{item.price}</div>
                  <button onClick={() => removeItem(item.id)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', color: '#94a3b8', fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ))}
            </div>
          )}

          {correctionItems.length > 0 && (
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', fontSize: 13, fontWeight: 700, color: '#475569' }}>
                ✏️ 批改服务 ({correctionItems.length})
              </div>
              {correctionItems.map((item, i) => (
                <div key={item.id} style={{ padding: '16px 20px', borderBottom: i < correctionItems.length - 1 ? '1px solid #f8fafc' : 'none', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🎫</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>{item.title}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(item.task2Count ?? 0) > 0 && <span style={{ fontSize: 11, color: '#3b82f6', background: '#eff6ff', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>大作文码×{item.task2Count}</span>}
                      {(item.task1Count ?? 0) > 0 && <span style={{ fontSize: 11, color: '#0891b2', background: '#ecfeff', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>小作文码×{item.task1Count}</span>}
                      {(item.anyCount ?? 0) > 0 && <span style={{ fontSize: 11, color: '#f59e0b', background: '#fffbeb', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>通用码×{item.anyCount}</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', flexShrink: 0 }}>¥{item.price}</div>
                  <button onClick={() => removeItem(item.id)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', color: '#94a3b8', fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ))}
            </div>
          )}

          <button onClick={clearCart} style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: 8, border: '1.5px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            🗑 清空购物车
          </button>
        </div>

        {/* 右列：结算 */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '24px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 20 }}>订单摘要</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 13, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.title}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', flexShrink: 0 }}>¥{item.price}</span>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: '#f1f5f9', marginBottom: 16 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>合计</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>¥{total()}</span>
            </div>
            <button disabled style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', cursor: 'not-allowed', opacity: 0.7, boxShadow: '0 4px 14px rgba(59,130,246,.25)' }}>
              去结算（即将开放）
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', margin: '10px 0 0' }}>如需立即购买请联系客服</p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .cart-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}