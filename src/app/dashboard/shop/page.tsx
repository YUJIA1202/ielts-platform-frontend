'use client'

import { useState } from 'react'
import { useLayoutStore } from '@/store/layoutStore'
import { useCartStore } from '@/store/cartStore'

type ResourceType = 'pdf' | 'video'
type Category = 'all' | 'essay' | 'vocabulary' | 'grammar' | 'template' | 'video'

interface Resource {
  id: number
  type: ResourceType
  category: Category
  title: string
  description: string
  price: number
  pages?: number
  duration?: string
  previewAvailable: boolean
  tag?: string
}

const MOCK_RESOURCES: Resource[] = [
  { id: 1, type: 'pdf', category: 'essay', title: '剑桥雅思 Task 2 高分范文精选（7-9分）', description: '精选50篇剑桥官方真题高分范文，涵盖 Opinion、Discussion、Problem-Solution 等所有题型，每篇附详细点评和词汇注释。', price: 29, pages: 120, previewAvailable: true, tag: '热销' },
  { id: 2, type: 'pdf', category: 'essay', title: 'Task 1 小作文范文全题型合集', description: '柱状图、折线图、饼图、地图题、流程图全覆盖，共40篇范文，每篇标注评分要点。', price: 25, pages: 96, previewAvailable: true },
  { id: 3, type: 'pdf', category: 'essay', title: '2024-2025 年雅思写作真题范文汇编', description: '收录近两年官方真题及对应范文，持续更新，购买后可享受免费更新服务。', price: 39, pages: 150, previewAvailable: false, tag: '新上架' },
  { id: 4, type: 'pdf', category: 'vocabulary', title: '雅思写作高频词汇替换手册', description: '按话题分类整理300+高频词汇替换方案，告别重复用词，提升 LR 评分。涵盖教育、科技、环境等10大核心话题。', price: 19, pages: 60, previewAvailable: true },
  { id: 5, type: 'pdf', category: 'vocabulary', title: '雅思写作连接词与转折词大全', description: '系统整理150+连接词、转折词、递进词的使用场景和搭配，附真题例句，专为提升 CC 评分设计。', price: 15, pages: 45, previewAvailable: true },
  { id: 6, type: 'pdf', category: 'grammar', title: '雅思写作语法提升专项手册', description: '针对中国考生常见语法错误系统讲解，从句、被动语态、分词结构、虚拟语气全覆盖，每个知识点附3-5道练习题。', price: 35, pages: 88, previewAvailable: true, tag: '独家' },
  { id: 7, type: 'pdf', category: 'grammar', title: '高分句型100例精讲', description: '精选雅思高分作文中出现频率最高的100个句型，逐一讲解用法和变形，直接套用即可提升GRA评分。', price: 22, pages: 70, previewAvailable: false },
  { id: 8, type: 'pdf', category: 'template', title: 'Task 2 万能写作框架模板集', description: '5大题型写作框架，含开头、主体段、结尾的完整模板，以及50+可直接使用的高分表达，经过真实考场验证。', price: 18, pages: 35, previewAvailable: true },
  { id: 9, type: 'pdf', category: 'template', title: 'Task 1 数据类题型写作模板', description: '柱状图、折线图、饼图、表格四种数据类题型专用模板，含overview写法和数据比较句型20+。', price: 15, pages: 28, previewAvailable: true },
  { id: 10, type: 'video', category: 'video', title: '虚拟语气在议论文中的运用（单课）', description: '深度讲解 were to / should / had done 三种虚拟语气在雅思写作中的应用场景，含5道练习题详解。', price: 12, duration: '20:10', previewAvailable: false },
  { id: 11, type: 'video', category: 'video', title: '地图题写作完全攻略（单课）', description: '地图题是 Task 1 最难题型，本课系统讲解方位词、变化描述、段落组织三大核心技巧，附2篇范文精讲。', price: 15, duration: '23:10', previewAvailable: false, tag: '热销' },
  { id: 12, type: 'video', category: 'video', title: 'Opinion 题高分结构解析（单课）', description: '一边倒 vs 部分同意两种策略深度对比，含完整7.5分范文逐句拆解，助你彻底掌握Opinion题写法。', price: 12, duration: '24:15', previewAvailable: false },
]

const PDF_CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'essay', label: '范文集' },
  { key: 'vocabulary', label: '词汇手册' },
  { key: 'grammar', label: '语法讲解' },
  { key: 'template', label: '写作模板' },
]

function ResourceModal({
  resource,
  onClose,
  onAddToCart,
  inCart,
}: {
  resource: Resource
  onClose: () => void
  onAddToCart: (resource: Resource) => void
  inCart: boolean
}) {
  const isPdf = resource.type === 'pdf'
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)',
        zIndex: 1000, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, width: '100%',
          maxWidth: 680, maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(15,23,42,.25)',
        }}
      >
        <div style={{
          padding: '28px 32px 24px', borderBottom: '1px solid #f1f5f9',
          position: 'sticky', top: 0, background: '#fff',
          borderRadius: '20px 20px 0 0', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                  background: isPdf ? '#eff6ff' : '#f5f3ff',
                  color: isPdf ? '#3b82f6' : '#8b5cf6',
                }}>
                  {isPdf ? '📄 PDF资料' : '🎬 视频单课'}
                </span>
                {resource.tag && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: '#fef3c7', color: '#d97706' }}>
                    {resource.tag}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: '0 0 8px', lineHeight: 1.4 }}>
                {resource.title}
              </h2>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {resource.pages && <span style={{ fontSize: 13, color: '#64748b' }}>📄 共 {resource.pages} 页</span>}
                {resource.duration && <span style={{ fontSize: 13, color: '#64748b' }}>🕐 {resource.duration}</span>}
                {resource.previewAvailable && <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 500 }}>✓ 支持试看</span>}
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '1.5px solid #e2e8f0', background: '#f8fafc',
              cursor: 'pointer', fontSize: 18, color: '#64748b', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          </div>
        </div>

        <div style={{ padding: '24px 32px 32px' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>资料介绍</div>
            <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.85, margin: 0 }}>{resource.description}</p>
          </div>

          <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 10 }}>📌 适合人群</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['备考雅思写作，目标 6.5 分及以上', '想系统提升写作技巧的考生', '需要大量范文参考的备考者'].map(t => (
                <div key={t} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: '#3b82f6', flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, color: '#64748b' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 12, padding: '16px 20px', marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>💡 购买须知</div>
            <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.7 }}>
              {isPdf
                ? '购买后可在「购买记录」页面下载，支持无限次下载。PDF 文件含版权水印，请勿传播。'
                : '购买后可在「购买记录」页面观看，不受订阅等级限制，永久有效。'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>¥{resource.price}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{isPdf ? '一次购买，永久下载' : '一次购买，永久观看'}</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {resource.previewAvailable && (
                <button style={{
                  padding: '12px 20px', borderRadius: 10,
                  border: '1.5px solid #e2e8f0', background: '#fff',
                  color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                }}>👁 试看预览</button>
              )}
              <button
                onClick={() => { onAddToCart(resource); onClose() }}
                style={{
                  padding: '12px 28px', borderRadius: 10, border: 'none',
                  background: inCart ? '#f1f5f9' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: inCart ? '#94a3b8' : '#fff',
                  fontWeight: 700, fontSize: 15, cursor: inCart ? 'default' : 'pointer',
                  boxShadow: inCart ? 'none' : '0 4px 14px rgba(59,130,246,.30)',
                  minWidth: 140,
                }}
              >
                {inCart ? '✓ 已加入购物车' : '🛒 加入购物车'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResourceCard({ resource, onClick, inCart }: {
  resource: Resource
  onClick: () => void
  inCart: boolean
}) {
  const isPdf = resource.type === 'pdf'
  const color = isPdf ? '#3b82f6' : '#8b5cf6'
  const bg = isPdf ? '#eff6ff' : '#f5f3ff'

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 14, overflow: 'hidden',
        border: '1.5px solid #e2e8f0', cursor: 'pointer',
        transition: 'transform .15s, box-shadow .15s', position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.10)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{
        height: 120, background: `linear-gradient(135deg, ${color}18, ${color}30)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
      }}>
        <span style={{ fontSize: 40 }}>{isPdf ? '📄' : '🎬'}</span>
        {resource.tag && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{resource.tag}</div>
        )}
        {inCart && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: '#22c55e', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>已加入</div>
        )}
        {resource.duration && (
          <div style={{ position: 'absolute', bottom: 8, right: 10, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4 }}>{resource.duration}</div>
        )}
        {resource.pages && (
          <div style={{ position: 'absolute', bottom: 8, right: 10, background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4 }}>{resource.pages}页</div>
        )}
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color, background: bg, padding: '2px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 8 }}>
          {isPdf ? 'PDF资料' : '视频单课'}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {resource.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>¥{resource.price}</span>
          {resource.previewAvailable && <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 500 }}>支持试看</span>}
        </div>
      </div>
    </div>
  )
}

export default function ShopPage() {
  const { collapsed } = useLayoutStore()
  const { items: cartItems, addItem } = useCartStore()
  const [activeTab, setActiveTab] = useState<'pdf' | 'video'>('pdf')
  const [pdfCategory, setPdfCategory] = useState<string>('all')
  const [selected, setSelected] = useState<Resource | null>(null)

  const pdfResources = MOCK_RESOURCES.filter(r => r.type === 'pdf' && (pdfCategory === 'all' || r.category === pdfCategory))
  const videoResources = MOCK_RESOURCES.filter(r => r.type === 'video')

  function addToCart(resource: Resource) {
    addItem({
      id: `resource-${resource.id}`,
      type: 'resource',
      title: resource.title,
      price: resource.price,
      task2Count: 0,
      task1Count: 0,
      anyCount: 0,
    })
  }

  return (
    <div style={{ maxWidth: collapsed ? '960px' : '100%', margin: collapsed ? '0 20% 0 5%' : '0', transition: 'all .2s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>资料购买</h1>
            <p style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>购买后永久有效，不受订阅等级限制</p>
          </div>
          {cartItems.length > 0 && (
            <a href="/dashboard/shop/cart" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff', fontWeight: 600, fontSize: 14,
              textDecoration: 'none', boxShadow: '0 3px 10px rgba(59,130,246,.30)',
            }}>🛒 购物车 ({cartItems.length})</a>
          )}
        </div>
      </div>

      <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 24 }}>
        {([{ key: 'pdf' as const, label: '📄 PDF资料' }, { key: 'video' as const, label: '🎬 视频单课' }]).map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            padding: '8px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 14, transition: 'all .15s',
            background: activeTab === key ? '#fff' : 'transparent',
            color: activeTab === key ? '#3b82f6' : '#64748b',
            boxShadow: activeTab === key ? '0 1px 4px rgba(0,0,0,.10)' : 'none',
          }}>{label}</button>
        ))}
      </div>

      {activeTab === 'pdf' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {PDF_CATEGORIES.map(({ key, label }) => (
            <button key={key} onClick={() => setPdfCategory(key)} style={{
              padding: '6px 18px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              border: pdfCategory === key ? '1.5px solid #3b82f6' : '1.5px solid #e2e8f0',
              background: pdfCategory === key ? '#eff6ff' : '#f8fafc',
              color: pdfCategory === key ? '#2563eb' : '#64748b',
              fontWeight: pdfCategory === key ? 600 : 400, transition: 'all .15s',
            }}>{label}</button>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {(activeTab === 'pdf' ? pdfResources : videoResources).map(r => (
          <ResourceCard
            key={r.id}
            resource={r}
            onClick={() => setSelected(r)}
            inCart={cartItems.some(i => i.id === `resource-${r.id}`)}
          />
        ))}
      </div>

      {selected && (
        <ResourceModal
          resource={selected}
          onClose={() => setSelected(null)}
          onAddToCart={addToCart}
          inCart={cartItems.some(i => i.id === `resource-${selected.id}`)}
        />
      )}
    </div>
  )
}