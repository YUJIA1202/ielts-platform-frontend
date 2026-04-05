'use client'

import { useLayoutStore } from '@/store/layoutStore'
import { useRouter } from 'next/navigation'

type OrderStatus = 'paid' | 'pending'
type OrderType = 'resource' | 'correction'

interface ResourceOrder {
  id: string
  type: 'resource'
  title: string
  price: number
  purchasedAt: string
  status: OrderStatus
  downloadUrl?: string
}

interface CorrectionOrder {
  id: string
  type: 'correction'
  title: string
  price: number
  purchasedAt: string
  status: OrderStatus
  codes: {
    code: string
    codeType: 'TASK2' | 'TASK1' | 'ANY'
    used: boolean
    usedAt?: string
  }[]
}

type Order = ResourceOrder | CorrectionOrder

const MOCK_ORDERS: Order[] = [
  {
    id: 'order-001',
    type: 'correction',
    title: '2大 + 2小混合套餐',
    price: 260,
    purchasedAt: '2026-03-15 14:32',
    status: 'paid',
    codes: [
      { code: 'TASK2-A1B2C3', codeType: 'TASK2', used: true, usedAt: '2026-03-16 10:20' },
      { code: 'TASK2-D4E5F6', codeType: 'TASK2', used: false },
      { code: 'TASK1-G7H8I9', codeType: 'TASK1', used: true, usedAt: '2026-03-17 15:45' },
      { code: 'TASK1-J1K2L3', codeType: 'TASK1', used: false },
    ],
  },
  {
    id: 'order-002',
    type: 'resource',
    title: '剑桥雅思 Task 2 高分范文精选（7-9分）',
    price: 29,
    purchasedAt: '2026-03-10 09:15',
    status: 'paid',
    downloadUrl: '#',
  },
  {
    id: 'order-003',
    type: 'correction',
    title: '大作文首篇批改',
    price: 45,
    purchasedAt: '2026-03-08 16:00',
    status: 'paid',
    codes: [
      { code: 'TASK2-FIRST-M4N5', codeType: 'TASK2', used: true, usedAt: '2026-03-08 16:30' },
    ],
  },
  {
    id: 'order-004',
    type: 'resource',
    title: '雅思写作语法提升专项手册',
    price: 35,
    purchasedAt: '2026-03-05 11:20',
    status: 'paid',
    downloadUrl: '#',
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
        border: '1.5px solid #e2e8f0', background: copied ? '#f0fdf4' : '#fff',
        color: copied ? '#16a34a' : '#64748b', cursor: 'pointer',
        transition: 'all .15s', flexShrink: 0,
      }}
    >
      {copied ? '✓ 已复制' : '复制'}
    </button>
  )
}

import { useState } from 'react'

export default function OrdersPage() {
  const { collapsed } = useLayoutStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'all' | 'correction' | 'resource'>('all')

  const filtered = MOCK_ORDERS.filter(o => activeTab === 'all' || o.type === activeTab)
  const correctionOrders = MOCK_ORDERS.filter(o => o.type === 'correction') as CorrectionOrder[]
  const unusedCodes = correctionOrders.flatMap(o => o.codes.filter(c => !c.used))

  return (
    <div style={{
      maxWidth: collapsed ? '960px' : '100%',
      margin: collapsed ? '0 20% 0 5%' : '0',
      transition: 'all .2s ease',
    }}>
      {/* 页头 */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>购买记录</h1>
        <p style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>
          查看历史订单和批改码使用情况
        </p>
      </div>

      {/* 未使用批改码快速入口 */}
      {unusedCodes.length > 0 && (
        <div style={{
          background: '#eff6ff', border: '1.5px solid #bfdbfe',
          borderRadius: 14, padding: '18px 22px', marginBottom: 28,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e40af', marginBottom: 12 }}>
            🎫 未使用的批改码（{unusedCodes.length} 个）
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {unusedCodes.map(c => (
              <div key={c.code} style={{
                display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                  background: c.codeType === 'TASK2' ? '#eff6ff' : c.codeType === 'TASK1' ? '#ecfeff' : '#fffbeb',
                  color: c.codeType === 'TASK2' ? '#3b82f6' : c.codeType === 'TASK1' ? '#0891b2' : '#f59e0b',
                }}>
                  {c.codeType === 'TASK2' ? '大作文码' : c.codeType === 'TASK1' ? '小作文码' : '通用码'}
                </span>
                <code style={{
                  fontSize: 13, fontWeight: 700, color: '#1e293b',
                  background: '#fff', padding: '3px 10px', borderRadius: 6,
                  border: '1.5px solid #e2e8f0', letterSpacing: '0.05em',
                }}>{c.code}</code>
                <CopyButton text={c.code} />
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push('/dashboard/submit')}
            style={{
              marginTop: 14, padding: '9px 20px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >前往提交批改 →</button>
        </div>
      )}

      {/* Tab 筛选 */}
      <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 24 }}>
        {([
          { key: 'all' as const, label: '全部' },
          { key: 'correction' as const, label: '✏️ 批改服务' },
          { key: 'resource' as const, label: '📄 学习资料' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 13, transition: 'all .15s',
              background: activeTab === key ? '#fff' : 'transparent',
              color: activeTab === key ? '#3b82f6' : '#64748b',
              boxShadow: activeTab === key ? '0 1px 4px rgba(0,0,0,.10)' : 'none',
            }}
          >{label}</button>
        ))}
      </div>

      {/* 订单列表 */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 15 }}>暂无购买记录</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(order => (
            <div key={order.id} style={{
              background: '#fff', border: '1.5px solid #e2e8f0',
              borderRadius: 16, overflow: 'hidden',
            }}>
              {/* 订单头部 */}
              <div style={{
                padding: '14px 20px', borderBottom: '1px solid #f1f5f9',
                background: '#f8fafc', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{order.type === 'correction' ? '🎫' : '📄'}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{order.title}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      {order.purchasedAt} · 订单号 {order.id}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>¥{order.price}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                    background: '#f0fdf4', color: '#16a34a',
                  }}>已支付</span>
                </div>
              </div>

              {/* 订单内容 */}
              <div style={{ padding: '16px 20px' }}>
                {order.type === 'resource' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>一次购买，永久下载</span>
                    <button style={{
                      padding: '8px 20px', borderRadius: 8, border: 'none',
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    }}>⬇ 下载</button>
                  </div>
                )}

                {order.type === 'correction' && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                      批改码明细
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(order as CorrectionOrder).codes.map(c => (
                        <div key={c.code} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', borderRadius: 10,
                          background: c.used ? '#f8fafc' : '#f0fdf4',
                          border: `1.5px solid ${c.used ? '#e2e8f0' : '#bbf7d0'}`,
                          flexWrap: 'wrap',
                        }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                            background: c.codeType === 'TASK2' ? '#eff6ff' : c.codeType === 'TASK1' ? '#ecfeff' : '#fffbeb',
                            color: c.codeType === 'TASK2' ? '#3b82f6' : c.codeType === 'TASK1' ? '#0891b2' : '#f59e0b',
                            flexShrink: 0,
                          }}>
                            {c.codeType === 'TASK2' ? '大作文码' : c.codeType === 'TASK1' ? '小作文码' : '通用码'}
                          </span>
                          <code style={{
                            fontSize: 13, fontWeight: 700, color: c.used ? '#94a3b8' : '#1e293b',
                            letterSpacing: '0.05em', flex: 1,
                          }}>{c.code}</code>
                          {c.used ? (
                            <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
                              ✓ 已使用 {c.usedAt}
                            </span>
                          ) : (
                            <CopyButton text={c.code} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}