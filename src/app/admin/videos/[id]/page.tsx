'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useLayoutStore } from '@/store/layoutStore'

interface Video {
  id: number
  title: string
  description: string | null
  category: string
  series: string
  seriesOrder: number
  duration: number
  url: string
  coverUrl: string | null
  createdAt: string
}

const CATEGORIES = [
  { value: 'grammar', label: '语法系列' },
  { value: 'task2',   label: 'Task 2 大作文' },
  { value: 'task1',   label: 'Task 1 小作文' },
]

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function VideoEditContent() {
  const params  = useParams()
  const router  = useRouter()
  const id      = Number(params.id)
  const { collapsed } = useLayoutStore()

  const [video, setVideo]       = useState<Video | null>(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [form, setForm] = useState({
    title: '', description: '', category: 'grammar',
    series: '', seriesOrder: '0', duration: '',
  })
  const [coverFile, setCoverFile]       = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [saved, setSaved]               = useState(false)
  const [error, setError]               = useState('')

  const coverRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/videos')
        const all: Video[] = res.data.videos
        const found = all.find((v: Video) => v.id === id)
        if (!found) { setNotFound(true); return }
        setVideo(found)
        setForm({
          title:       found.title,
          description: found.description ?? '',
          category:    found.category,
          series:      found.series,
          seriesOrder: String(found.seriesOrder),
          duration:    String(found.duration),
        })
        setCoverPreview(found.coverUrl ?? null)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async () => {
    setError('')
    if (!form.title.trim())    return setError('请填写视频标题')
    if (!form.series.trim())   return setError('请填写系列名称')
    if (!form.duration.trim()) return setError('请填写时长（秒）')

    setSubmitting(true)
    try {
      await api.put(`/videos/${id}`, {
        title:       form.title,
        description: form.description,
        category:    form.category,
        series:      form.series,
        seriesOrder: form.seriesOrder,
        duration:    form.duration,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setError(err?.response?.data?.error ?? '保存失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8', fontSize: 15 }}>
        加载中...
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🎬</div>
        <div style={{ color: '#94a3b8', fontSize: 15, marginBottom: 24 }}>视频不存在</div>
        <button onClick={() => router.push('/admin/videos')} style={{
          padding: '10px 24px', borderRadius: 9, border: '1.5px solid #e2e8f0',
          background: '#fff', color: '#475569', fontSize: 15, cursor: 'pointer',
        }}>
          返回列表
        </button>
      </div>
    )
  }

  const outerStyle: React.CSSProperties = collapsed
    ? { maxWidth: 960, margin: '0 5% 60px 3%', transition: 'all .2s ease' }
    : { maxWidth: '100%', margin: '0 0 60px', transition: 'all .2s ease' }

  return (
    <div style={outerStyle}>

      <button
        onClick={() => router.push('/admin/videos')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 8, marginBottom: 20,
          border: '1.5px solid #e2e8f0', background: '#fff',
          color: '#64748b', fontSize: 14, cursor: 'pointer', fontWeight: 500,
        }}
      >
        {'← 返回列表'}
      </button>

      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        border: '1.5px solid #bfdbfe', borderLeft: '5px solid #1d4ed8',
        borderRadius: 16, padding: '24px 28px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e3a5f', margin: 0 }}>
            {'编辑视频 #' + id}
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '6px 0 0' }}>
            {'上传于 ' + (video ? new Date(video.createdAt).toLocaleDateString('zh-CN') : '—') + ' · 修改后点击保存生效'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {saved && (
            <div style={{
              padding: '8px 16px', borderRadius: 8,
              background: '#f0fdf4', border: '1.5px solid #bbf7d0',
              color: '#16a34a', fontSize: 14, fontWeight: 600,
            }}>
              ✓ 已保存
            </div>
          )}
          <button
            onClick={() => router.push('/admin/videos')}
            disabled={submitting}
            style={{
              padding: '9px 20px', borderRadius: 9,
              border: '1.5px solid #e2e8f0', background: '#fff',
              color: '#64748b', fontSize: 14,
              cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 500,
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={submitting}
            style={{
              padding: '9px 24px', borderRadius: 9, border: 'none',
              background: submitting ? '#93c5fd' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: submitting ? 'none' : '0 4px 12px rgba(29,78,216,0.25)',
            }}
          >
            {submitting ? '保存中...' : '保存修改'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 10, padding: '12px 16px',
          color: '#dc2626', fontSize: 14, marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: collapsed ? '1fr' : '1fr 300px',
        gap: 20, alignItems: 'start',
      }}>

        {/* 左：表单 */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 22px' }}>
            基本信息
          </h2>

          <div style={{ marginBottom: 20 }}>
            <Label>视频标题 *</Label>
            <input value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={IS} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <Label>简介</Label>
            <textarea value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} style={{ ...IS, resize: 'vertical', minHeight: 88 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <Label>分类 *</Label>
              <select value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={IS}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <Label>系列名称 *</Label>
              <input value={form.series}
                onChange={e => setForm(f => ({ ...f, series: e.target.value }))} style={IS} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <Label>系列内序号</Label>
              <input type="number" min={0} value={form.seriesOrder}
                onChange={e => setForm(f => ({ ...f, seriesOrder: e.target.value }))} style={IS} />
              <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 5 }}>从 0 开始，决定播放顺序</div>
            </div>
            <div>
              <Label>视频时长（秒）*</Label>
              <input type="number" min={1} value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} style={IS} />
              {form.duration && Number(form.duration) > 0 && (
                <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 5, fontWeight: 500 }}>
                  {'即 ' + fmtDuration(Number(form.duration))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右：视频文件 + 封面 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={cardStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 16px' }}>
              当前视频文件
            </h2>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#eff6ff', borderRadius: 10, padding: '12px 14px',
              marginBottom: 12, border: '1px solid #bfdbfe',
            }}>
              <span style={{ fontSize: 26, flexShrink: 0 }}>🎬</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, color: '#1e40af', fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {video?.url.split('/').pop()}
                </div>
                <div style={{ fontSize: 12, color: '#93c5fd', marginTop: 3 }}>
                  如需更换请删除后重新上传
                </div>
              </div>
            </div>
            <a href={video?.url} target="_blank" rel="noreferrer" style={previewLinkStyle}>
              预览 ↗
            </a>
          </div>

          <div style={cardStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 16px' }}>
              封面图 <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 400, marginLeft: 6 }}>可选</span>
            </h2>
            <div
              onClick={() => coverRef.current?.click()}
              style={{
                width: '100%', aspectRatio: '16/9', borderRadius: 10, overflow: 'hidden',
                border: coverPreview ? '2px solid #bfdbfe' : '2px dashed #cbd5e1',
                cursor: 'pointer', background: '#f0f7ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', marginBottom: 10,
              }}
            >
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPreview} alt="封面"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, opacity: 0.2, marginBottom: 6 }}>🖼️</div>
                  <div style={{ fontSize: 12, color: '#93c5fd' }}>点击上传封面</div>
                </div>
              )}
              <div
                style={{
                  position: 'absolute', inset: 0, background: 'rgba(29,78,216,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  opacity: 0, transition: 'opacity .15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0' }}
              >
                点击更换封面
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7 }}>
              {coverFile ? ('已选：' + coverFile.name) : '建议 1280×720，JPG / PNG'}
            </div>
            <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>⚠ 封面更换暂不支持在线保存</div>
            <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0]
                if (!f) return
                setCoverFile(f)
                setCoverPreview(URL.createObjectURL(f))
              }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminVideoEditPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8', fontSize: 15 }}>加载中...</div>
    }>
      <VideoEditContent />
    </Suspense>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 9 }}>
      {children}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 14,
  border: '1.5px solid #e2e8f0',
  boxShadow: '0 2px 8px rgba(59,130,246,0.06)',
  padding: '24px',
}

const IS: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 9,
  border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1e293b',
  outline: 'none', boxSizing: 'border-box', background: '#fafafa',
}

const previewLinkStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '6px 14px', borderRadius: 7, fontSize: 13,
  border: '1.5px solid #bfdbfe', color: '#2563eb',
  textDecoration: 'none', fontWeight: 600, background: '#eff6ff',
}