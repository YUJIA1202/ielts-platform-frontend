'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useState, useEffect, useRef } from 'react'
import { useLayoutStore } from '@/store/layoutStore'
import api from '@/lib/api'

type Subscription = 'FREE' | 'BASIC' | 'PRO'

interface Video {
  id: number
  category: 'grammar' | 'task2' | 'task1'
  series: string
  seriesOrder: number
  title: string
  duration: number  // 秒
  coverUrl: string | null
  description: string | null
  url: string
  isFree: boolean
}

interface SeriesVideo {
  id: number
  title: string
  duration: number
  seriesOrder: number
}

const CATEGORY_LABELS = {
  grammar: { label: '语法系列', color: '#8b5cf6', bg: '#f5f3ff' },
  task2: { label: 'Task 2 大作文', color: '#3b82f6', bg: '#eff6ff' },
  task1: { label: 'Task 1 小作文', color: '#0891b2', bg: '#ecfeff' },
}

const TRIAL_LIMIT_SECONDS = 5 * 60

function fmtDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function PlayerControls({ playing, onPlayPause, elapsed, total, onSeek, speed, onSpeedChange, onFullscreen }: {
  playing: boolean; onPlayPause: () => void; elapsed: number; total: number
  onSeek: (s: number) => void; speed: number; onSpeedChange: (s: number) => void; onFullscreen: () => void
}) {
  const pct = total > 0 ? (elapsed / total) * 100 : 0
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,.8) 0%, transparent 100%)', padding: '32px 16px 14px' }}>
      <div style={{ height: 4, background: 'rgba(255,255,255,.3)', borderRadius: 2, marginBottom: 12, cursor: 'pointer' }}
        onClick={e => { const r = e.currentTarget.getBoundingClientRect(); onSeek((e.clientX - r.left) / r.width * total) }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#3b82f6', borderRadius: 2, transition: 'width .3s' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onPlayPause} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 18, padding: 0 }}>
          {playing ? '⏸' : '▶'}
        </button>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,.85)', whiteSpace: 'nowrap' }}>{fmtDuration(elapsed)} / {fmtDuration(total)}</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 4 }}>
          {[0.75, 1, 1.25, 1.5, 2].map(s => (
            <button key={s} onClick={() => onSpeedChange(s)} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontWeight: speed === s ? 700 : 400, background: speed === s ? '#3b82f6' : 'rgba(255,255,255,.15)', color: '#fff', border: 'none' }}>{s}x</button>
          ))}
        </div>
        <button onClick={onFullscreen} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 16, padding: 0 }}>⛶</button>
      </div>
    </div>
  )
}

export default function VideoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const { collapsed } = useLayoutStore()
  const id = Number(params.id)

  const subscription: Subscription = (user?.subscription as Subscription) ?? 'FREE'

  const [video, setVideo] = useState<Video | null>(null)
  const [seriesVideos, setSeriesVideos] = useState<SeriesVideo[]>([])
  const [watchStatus, setWatchStatus] = useState<{ allowed: boolean; isTrial: boolean; alreadyCounted?: boolean; reason?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [frozen, setFrozen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [trialRecorded, setTrialRecorded] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 拉取视频详情 + 试看权限
  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/videos/${id}`),
      api.get(`/videos/${id}/trial-check`),
    ]).then(([detailRes, trialRes]) => {
      setVideo(detailRes.data.video)
      setSeriesVideos(detailRes.data.seriesVideos)
      setWatchStatus(trialRes.data)
    }).catch(err => {
      console.error(err)
    }).finally(() => setLoading(false))
  }, [id])

  // 开始播放时记录试看（只记录一次）
  useEffect(() => {
    if (playing && watchStatus?.isTrial && !trialRecorded) {
      setTrialRecorded(true)
      api.post(`/videos/${id}/trial-record`).catch(err => console.error(err))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])

  // 计时 + 到期冻结
  useEffect(() => {
    if (playing && !frozen) {
      intervalRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + speed
          const limit = watchStatus?.isTrial ? TRIAL_LIMIT_SECONDS : (video?.duration ?? 99999)
          if (next >= limit) {
            setPlaying(false)
            if (watchStatus?.isTrial) setFrozen(true)
            if (intervalRef.current) clearInterval(intervalRef.current)
            return limit
          }
          return next
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, frozen, speed])

  function handleMouseMove() {
    setShowControls(true)
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = setTimeout(() => { if (playing) setShowControls(false) }, 3000)
  }

  function handleFullscreen() {
    if (playerRef.current) {
      if (document.fullscreenElement) document.exitFullscreen()
      else playerRef.current.requestFullscreen()
    }
  }

  const watermarkText = user ? `${user.phone ?? ''}  ${user.username ?? ''}` : ''

  const outerStyle = {
    maxWidth: '100%',
    margin: collapsed ? '0 3% 0 5%' : '0',
    transition: 'all .2s ease',
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>加载中...</div>
  }

  if (!video || !watchStatus) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
        <div style={{ fontSize: 15 }}>找不到该视频</div>
        <button onClick={() => router.push('/dashboard/videos')} style={{ marginTop: 16, background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 14 }}>← 返回视频课</button>
      </div>
    )
  }

  // 没有权限观看
  if (!watchStatus.allowed) {
    return (
      <div style={outerStyle}>
        <button onClick={() => router.push('/dashboard/videos')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 14, padding: 0, marginBottom: 24 }}>← 返回视频课</button>
        <div style={{ background: '#0f172a', borderRadius: 16, aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#fff', padding: '0 32px' }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🔒</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
              {subscription === 'FREE' ? '免费试看名额已用完' : '今日试看名额已用完'}
            </div>
            <div style={{ fontSize: 15, color: '#94a3b8', marginBottom: 32 }}>
              {watchStatus.reason ?? '升级 PRO 解锁全部课程，无限制完整观看'}
            </div>
            <a href="/dashboard/pricing" style={{ padding: '13px 36px', borderRadius: 12, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontWeight: 700, fontSize: 16, textDecoration: 'none', display: 'inline-block' }}>升级 PRO →</a>
          </div>
        </div>
      </div>
    )
  }

  const cat = CATEGORY_LABELS[video.category]
  const nextVideo = seriesVideos.find(v => v.seriesOrder === video.seriesOrder + 1)
  const totalForPlayer = watchStatus.isTrial ? TRIAL_LIMIT_SECONDS : video.duration

  return (
    <div style={outerStyle}>
      <style>{`
        .video-layout {
          display: grid;
          grid-template-columns: 1fr 240px;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .video-layout { grid-template-columns: 1fr 200px; gap: 14px; }
        }
        @media (max-width: 768px) {
          .video-layout { grid-template-columns: 1fr; gap: 16px; }
          .video-sidebar { position: static !important; }
        }
      `}</style>

      <button onClick={() => router.push('/dashboard/videos')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 14, padding: 0, marginBottom: 24 }}>← 返回视频课</button>

      <div className="video-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 播放器 */}
          <div ref={playerRef} onMouseMove={handleMouseMove} style={{ background: '#0f172a', borderRadius: 16, overflow: 'hidden', aspectRatio: '16/9', position: 'relative' }}>
            
            {/* 实际视频元素（开发阶段显示占位，有真实文件时换 video 标签）*/}
            <div onClick={() => { if (!frozen) setPlaying(p => !p) }} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: frozen ? 'default' : 'pointer' }}>
              {!playing && !frozen && (
                <>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 12 }}>▶</div>
                  <div style={{ fontSize: 14, color: '#94a3b8' }}>点击播放</div>
                  {watchStatus.isTrial && <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>试看前 5 分钟</div>}
                </>
              )}
              {playing && <div style={{ fontSize: 13, color: 'rgba(255,255,255,.3)' }}>播放中...</div>}
            </div>

            {/* 冻结遮罩 */}
            {frozen && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>⏱️</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>5 分钟试看已结束</div>
                <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 28, lineHeight: 1.7 }}>
                  {subscription === 'FREE' ? 'FREE 用户可试看 2 个视频，每个限 5 分钟' : 'BASIC 用户每天可试看 2 个视频，每个限 5 分钟'}
                  <br />升级 PRO 无限制观看
                </div>
                <a href="/dashboard/pricing" style={{ padding: '12px 32px', borderRadius: 12, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'inline-block' }}>升级 PRO 完整观看 →</a>
              </div>
            )}

            {/* 水印 */}
            {user && watermarkText && !frozen && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} style={{ position: 'absolute', left: `${(i % 4) * 28 - 5}%`, top: `${Math.floor(i / 4) * 22 + 5}%`, transform: 'rotate(-20deg)', fontSize: 12, color: 'rgba(255,255,255,0.10)', whiteSpace: 'nowrap', userSelect: 'none' }}>{watermarkText}</div>
                ))}
              </div>
            )}

            {/* 控制栏 */}
            {!frozen && (
              <div style={{ opacity: showControls ? 1 : 0, transition: 'opacity .3s' }}>
                <PlayerControls
                  playing={playing}
                  onPlayPause={() => setPlaying(p => !p)}
                  elapsed={elapsed}
                  total={totalForPlayer}
                  onSeek={s => { if (watchStatus.isTrial && s > TRIAL_LIMIT_SECONDS) return; setElapsed(s) }}
                  speed={speed}
                  onSpeedChange={setSpeed}
                  onFullscreen={handleFullscreen}
                />
              </div>
            )}

            {/* 试看倒计时 */}
            {watchStatus.isTrial && !frozen && playing && (
              <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,.6)', color: '#fbbf24', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}>
                ⏱ 试看 {fmtDuration(TRIAL_LIMIT_SECONDS - elapsed)} 后结束
              </div>
            )}
          </div>

          {/* 视频信息 */}
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: cat.color, background: cat.bg, padding: '3px 10px', borderRadius: 4 }}>{cat.label}</span>
              <span style={{ fontSize: 12, color: '#64748b', background: '#f1f5f9', padding: '3px 10px', borderRadius: 4 }}>{video.series}</span>
              {watchStatus.isTrial && <span style={{ fontSize: 12, fontWeight: 600, color: '#d97706', background: '#fef3c7', padding: '3px 10px', borderRadius: 4 }}>试看 5 分钟</span>}
              {video.isFree && <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', background: '#dcfce7', padding: '3px 10px', borderRadius: 4 }}>免费</span>}
              <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>🕐 {fmtDuration(video.duration)}</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: '0 0 14px', lineHeight: 1.5 }}>{video.title}</h1>
            <p style={{ margin: 0, fontSize: 15, color: '#64748b', lineHeight: 1.8 }}>{video.description}</p>
          </div>

          {/* 下一节 */}
          {nextVideo && !frozen && (
            <div onClick={() => router.push(`/dashboard/videos/${nextVideo.id}`)}
              style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color .15s, box-shadow .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,.10)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, color: '#3b82f6' }}>▶</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>下一节</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nextVideo.title}</div>
              </div>
              <div style={{ color: '#cbd5e1', fontSize: 20, flexShrink: 0 }}>›</div>
            </div>
          )}
        </div>

        {/* 右侧目录 */}
        <div className="video-sidebar" style={{ position: 'sticky', top: 24 }}>
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{video.series}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>共 {seriesVideos.length} 节</div>
            </div>
            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
              {seriesVideos.sort((a, b) => a.seriesOrder - b.seriesOrder).map((v, i) => {
                const isActive = v.id === video.id
                return (
                  <div key={v.id} onClick={() => router.push(`/dashboard/videos/${v.id}`)}
                    style={{ padding: '14px 20px', cursor: 'pointer', background: isActive ? '#eff6ff' : '#fff', borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'flex-start', gap: 12 }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = '#fff' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: isActive ? '#3b82f6' : '#f1f5f9', color: isActive ? '#fff' : '#94a3b8', fontSize: 12, fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? '#1e40af' : '#1e293b', lineHeight: 1.5, marginBottom: 3 }}>{v.title}</div>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDuration(v.duration)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 48 }} />
    </div>
  )
}