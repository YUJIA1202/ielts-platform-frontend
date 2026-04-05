'use client'

import { Suspense, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useLayoutStore } from '@/store/layoutStore'

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

function VideoNewContent() {
  const router = useRouter()
  const { collapsed } = useLayoutStore()

  const [form, setForm] = useState({
    title: '', description: '', category: 'grammar',
    series: '', seriesOrder: '0', duration: '',
  })
  const [videoFile, setVideoFile]       = useState<File | null>(null)
  const [coverFile, setCoverFile]       = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [progress, setProgress]         = useState(0)
  const [error, setError]               = useState('')

  const videoRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    setError('')
    if (!form.title.trim())    return setError('请填写视频标题')
    if (!form.series.trim())   return setError('请填写系列名称')
    if (!form.duration.trim()) return setError('请填写视频时长')
    if (!videoFile)            return setError('请选择视频文件')

    setSubmitting(true)
    setProgress(0)
    try {
      const fd = new FormData()
      fd.append('title',       form.title)
      fd.append('description', form.description)
      fd.append('category',    form.category)
      fd.append('series',      form.series)
      fd.append('seriesOrder', form.seriesOrder)
      fd.append('duration',    form.duration)
      fd.append('video',       videoFile)
      if (coverFile) fd.append('cover', coverFile)

      await api.post('/videos', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100))
        },
      })
      router.push('/admin/videos')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setError(err?.response?.data?.error ?? '上传失败，请重试')
      setSubmitting(false)
    }
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
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e3a5f', margin: 0 }}>上传新视频</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '6px 0 0' }}>上传完成后自动返回视频列表</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {submitting && progress > 0 && (
            <div style={{ fontSize: 13, color: '#1d4ed8', fontWeight: 600 }}>
              {progress < 100 ? `上传中 ${progress}%` : '保存中...'}
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
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '9px 24px', borderRadius: 9, border: 'none',
              background: submitting ? '#93c5fd' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: submitting ? 'none' : '0 4px 12px rgba(29,78,216,0.25)',
            }}
          >
            {submitting ? (progress < 100 ? `上传中 ${progress}%` : '保存中...') : '确认上传'}
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

      {submitting && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ height: 8, background: '#dbeafe', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
              width: `${progress}%`, transition: 'width .3s',
            }} />
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: collapsed ? '1fr' : '1fr 300px',
        gap: 20, alignItems: 'start',
      }}>

        {/* 左：基本信息 */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 22px' }}>
            基本信息
          </h2>

          <div style={{ marginBottom: 20 }}>
            <Label>视频标题 *</Label>
            <input value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="例：Subject-Verb Agreement（主谓一致）" style={IS} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <Label>简介</Label>
            <textarea value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="简短描述视频内容（选填）" rows={3}
              style={{ ...IS, resize: 'vertical', minHeight: 88 }} />
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
                onChange={e => setForm(f => ({ ...f, series: e.target.value }))}
                placeholder="例：语法基础班" style={IS} />
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
                onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                placeholder="例：600" style={IS} />
              {form.duration && Number(form.duration) > 0 && (
                <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 5, fontWeight: 500 }}>
                  {'即 ' + fmtDuration(Number(form.duration))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右：文件上传 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={cardStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 16px' }}>
              视频文件 *
            </h2>
            <div
              onClick={() => !submitting && videoRef.current?.click()}
              style={{
                border: `2px dashed ${videoFile ? '#3b82f6' : '#cbd5e1'}`,
                borderRadius: 12, padding: '28px 16px',
                textAlign: 'center', cursor: submitting ? 'not-allowed' : 'pointer',
                background: videoFile ? '#eff6ff' : '#fafcff', transition: 'all .15s',
              }}
            >
              {videoFile ? (
                <div>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🎬</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#2563eb' }}>{videoFile.name}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 5 }}>
                    {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                  </div>
                  {!submitting && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>点击重新选择</div>}
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 40, marginBottom: 10, opacity: 0.3 }}>📁</div>
                  <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>点击选择视频文件</div>
                  <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 6 }}>支持 MP4 / MOV，最大 500MB</div>
                </div>
              )}
            </div>
            <input ref={videoRef} type="file" accept="video/*" style={{ display: 'none' }}
              onChange={e => setVideoFile(e.target.files?.[0] ?? null)} />
          </div>

          <div style={cardStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 16px' }}>
              封面图 <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 400, marginLeft: 6 }}>可选</span>
            </h2>
            <div
              onClick={() => !submitting && coverRef.current?.click()}
              style={{
                width: '100%', aspectRatio: '16/9', borderRadius: 10, overflow: 'hidden',
                border: coverPreview ? '2px solid #bfdbfe' : '2px dashed #cbd5e1',
                cursor: submitting ? 'not-allowed' : 'pointer', background: '#f0f7ff',
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
              {coverPreview && !submitting && (
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
                  点击重新选择
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7 }}>
              {coverFile ? ('已选：' + coverFile.name) : '建议 1280×720，JPG / PNG'}
            </div>
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

export default function AdminVideoNewPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8', fontSize: 15 }}>加载中...</div>
    }>
      <VideoNewContent />
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