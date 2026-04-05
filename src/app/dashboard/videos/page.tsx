'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLayoutStore } from '@/store/layoutStore'
import api from '@/lib/api'

type Category = 'grammar' | 'task2' | 'task1'

interface Video {
  id: number
  category: Category
  series: string
  seriesOrder: number
  title: string
  duration: number
  coverUrl: string | null
  description: string | null
  isFree: boolean
}

const CATEGORIES = [
  { key: 'grammar' as Category, label: '语法系列', icon: '📝', color: '#8b5cf6', bg: '#f5f3ff' },
  { key: 'task2' as Category, label: 'Task 2 大作文', icon: '✍️', color: '#3b82f6', bg: '#eff6ff' },
  { key: 'task1' as Category, label: 'Task 1 小作文', icon: '📊', color: '#0891b2', bg: '#ecfeff' },
]

function fmtDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function VideoCard({ video, onClick }: { video: Video; onClick: () => void }) {
  const cat = CATEGORIES.find(c => c.key === video.category)!
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 14, overflow: 'hidden',
        border: '1.5px solid #e2e8f0', cursor: 'pointer',
        transition: 'transform .15s, box-shadow .15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.10)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{
        height: 160,
        background: video.coverUrl
          ? `url(${video.coverUrl}) center/cover`
          : `linear-gradient(135deg, ${cat.color}22, ${cat.color}44)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(255,255,255,.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, boxShadow: '0 4px 12px rgba(0,0,0,.15)',
          color: cat.color,
        }}>▶</div>
        <div style={{
          position: 'absolute', bottom: 10, right: 10,
          background: 'rgba(0,0,0,.65)', color: '#fff',
          fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
        }}>{fmtDuration(video.duration)}</div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: cat.color,
          background: cat.bg, padding: '2px 8px', borderRadius: 4,
          display: 'inline-block', marginBottom: 8,
        }}>{video.series}</div>
        <div style={{
          fontSize: 14, fontWeight: 600, color: '#1e293b',
          lineHeight: 1.5, marginBottom: 8,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{video.title}</div>
        <div style={{
          fontSize: 12, color: '#94a3b8', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{video.description}</div>
      </div>
    </div>
  )
}

export default function VideosPage() {
  const router = useRouter()
  const { collapsed } = useLayoutStore()
  const [activeCategory, setActiveCategory] = useState<Category>('grammar')
  const [grouped, setGrouped] = useState<Record<string, Video[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api.get(`/videos?category=${activeCategory}`)
      .then(res => {
        if (cancelled) return
        setGrouped(res.data.grouped)
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        console.error(err)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [activeCategory])

  const currentCat = CATEGORIES.find(c => c.key === activeCategory)!

  return (
    <div style={{
      maxWidth: collapsed ? 960 : '100%',
      margin: collapsed ? '0 20% 0 5%' : '0',
      transition: 'all .2s ease',
    }}>
      {/* 页头 */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>视频课</h1>
        <p style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>
          系统学习雅思写作技巧，从语法基础到各题型实战
        </p>
      </div>

      {/* 分类 Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => {
              setActiveCategory(cat.key)
              setLoading(true)
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 12, cursor: 'pointer',
              border: activeCategory === cat.key ? `2px solid ${cat.color}` : '2px solid #e2e8f0',
              background: activeCategory === cat.key ? cat.bg : '#fff',
              color: activeCategory === cat.key ? cat.color : '#64748b',
              fontWeight: activeCategory === cat.key ? 700 : 500,
              fontSize: 14, transition: 'all .15s',
            }}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>加载中...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎬</div>
          <div>暂无视频，管理员还在上传中</div>
        </div>
      ) : (
        Object.entries(grouped).map(([series, seriesVideos]) => (
          <div key={series} style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 4, height: 20, borderRadius: 2, background: currentCat.color }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{series}</span>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>{seriesVideos.length} 节</span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
            }}>
              {seriesVideos.map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => router.push(`/dashboard/videos/${video.id}`)}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}