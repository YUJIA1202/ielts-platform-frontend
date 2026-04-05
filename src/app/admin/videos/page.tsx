'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

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

const CATEGORY_COLOR: Record<string, { bg: string; color: string }> = {
  grammar: { bg: '#eff6ff', color: '#3b82f6' },
  task2:   { bg: '#f0fdf4', color: '#16a34a' },
  task1:   { bg: '#fdf4ff', color: '#9333ea' },
}

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const emptyForm = {
  title: '', description: '', category: 'grammar',
  series: '', seriesOrder: '0', duration: '',
}

export default function AdminVideosPage() {
  const router = useRouter()
  const [videos, setVideos]       = useState<Video[]>([])
  const [grouped, setGrouped]     = useState<Record<string, Video[]>>({})
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading]     = useState(true)

  const [showModal, setShowModal]         = useState(false)
  const [form, setForm]                   = useState({ ...emptyForm })
  const [videoFile, setVideoFile]         = useState<File | null>(null)
  const [coverFile, setCoverFile]         = useState<File | null>(null)
  const [coverPreview, setCoverPreview]   = useState<string | null>(null)
  const [submitting, setSubmitting]       = useState(false)
  const [progress, setProgress]           = useState(0)
  const [formError, setFormError]         = useState('')
  const [deleteId, setDeleteId]           = useState<number | null>(null)
  const [deleteTitle, setDeleteTitle]     = useState('')

  const videoRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    try {
      const q = activeTab !== 'all' ? `?category=${activeTab}` : ''
      const res = await api.get(`/videos${q}`)
      setVideos(res.data.videos)
      setGrouped(res.data.grouped)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { fetchVideos() }, [fetchVideos])

  const handleSubmit = async () => {
    setFormError('')
    if (!form.title.trim())    return setFormError('请填写视频标题')
    if (!form.series.trim())   return setFormError('请填写系列名称')
    if (!form.duration.trim()) return setFormError('请填写时长（秒）')
    if (!videoFile)            return setFormError('请选择视频文件')

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
      setShowModal(false)
      fetchVideos()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setFormError(err?.response?.data?.error ?? '上传失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/videos/${deleteId}`)
      setDeleteId(null)
      fetchVideos()
    } catch { /* ignore */ }
  }

  return (
    <div>

      {/* 页头 */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        border: '1.5px solid #bfdbfe', borderLeft: '5px solid #1d4ed8',
        borderRadius: 16, padding: '24px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e3a5f', marginBottom: 6 }}>视频管理</h1>
          <div style={{ fontSize: 15, color: '#64748b' }}>
            共 <strong style={{ color: '#1d4ed8' }}>{videos.length}</strong> 个视频
            {' · '}
            <strong style={{ color: '#1d4ed8' }}>{Object.keys(grouped).length}</strong> 个系列
          </div>
        </div>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
        }}>🎬</div>
      </div>

      {/* 分类 Tab + 上传按钮 */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 28,
        borderBottom: '2px solid #f1f5f9',
        alignItems: 'center',
      }}>
        {[{ value: 'all', label: '全部' }, ...CATEGORIES].map(c => (
          <button key={c.value} onClick={() => setActiveTab(c.value)} style={{
            padding: '9px 20px', border: 'none', background: 'none',
            fontSize: 15,
            fontWeight: activeTab === c.value ? 700 : 500,
            color: activeTab === c.value ? '#3b82f6' : '#94a3b8',
            cursor: 'pointer',
            borderBottom: activeTab === c.value
              ? '2px solid #3b82f6'
              : '2px solid transparent',
            marginBottom: -2, transition: 'all .15s',
          }}>
            {c.label}
          </button>
        ))}
        <button
          onClick={() => router.push('/admin/videos/new')}
          style={{
            marginLeft: 'auto', marginBottom: 8,
            padding: '9px 20px', borderRadius: 9, border: 'none',
            background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(29,78,216,0.25)',
          }}
        >
          + 上传视频
        </button>
      </div>

      {/* 加载 */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#cbd5e1', fontSize: 15 }}>
          加载中...
        </div>
      )}

      {/* 空状态 */}
      {!loading && Object.keys(grouped).length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎬</div>
          <div style={{ fontSize: 15 }}>还没有视频，点击右上角上传第一个</div>
        </div>
      )}

      {/* 按系列分组 */}
      {!loading && Object.entries(grouped).map(([series, list]) => {
        const cat = list[0]?.category ?? 'grammar'
        const catColor = CATEGORY_COLOR[cat] ?? CATEGORY_COLOR.grammar
        return (
          <div key={series} style={{ marginBottom: 36 }}>
            {/* 系列标题 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{
                width: 4, height: 20, borderRadius: 99,
                background: catColor.color, flexShrink: 0,
                display: 'inline-block',
              }} />
              <span style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>
                {series}
              </span>
              <span style={{
                fontSize: 12, padding: '3px 10px', borderRadius: 20,
                background: catColor.bg, color: catColor.color, fontWeight: 600,
              }}>
                {CATEGORIES.find(c => c.value === cat)?.label}
              </span>
              <span style={{
                fontSize: 12, padding: '3px 10px', borderRadius: 20,
                background: '#f8fafc', color: '#94a3b8',
              }}>
                {list.length} 个视频
              </span>
            </div>

            {/* 视频列表 */}
            <div style={{
              background: '#fff', borderRadius: 14,
              border: '1.5px solid #f1f5f9', overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              {list.map((v, idx) => (
                <div key={v.id} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 18px',
                  borderBottom: idx < list.length - 1 ? '1px solid #f8fafc' : 'none',
                }}>
                  {/* 序号 */}
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: '#f1f5f9', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: '#94a3b8',
                  }}>
                    {idx + 1}
                  </div>

                  {/* 封面 */}
                  <div style={{
                    width: 100, height: 58, borderRadius: 8,
                    overflow: 'hidden', flexShrink: 0, background: '#1e293b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {v.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.coverUrl} alt={v.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: 24, opacity: 0.4 }}>🎬</span>
                    )}
                  </div>

                  {/* 主内容 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 15, fontWeight: 600, color: '#1e293b',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap', marginBottom: 5,
                    }}>
                      {v.title}
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#94a3b8' }}>
                      <span>{'⏱ ' + fmtDuration(v.duration)}</span>
                      {v.description && (
                        <span style={{
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', maxWidth: 400,
                        }}>
                          {v.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 操作 */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => router.push(`/admin/videos/${v.id}`)}
                      style={{
                        padding: '6px 16px', borderRadius: 8,
                        fontSize: 13, fontWeight: 600,
                        border: '1.5px solid #e2e8f0', background: '#fff',
                        color: '#475569', cursor: 'pointer',
                      }}
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => { setDeleteId(v.id); setDeleteTitle(v.title) }}
                      style={{
                        padding: '6px 16px', borderRadius: 8,
                        fontSize: 13, fontWeight: 600,
                        border: '1.5px solid #fecaca', background: '#fff',
                        color: '#ef4444', cursor: 'pointer',
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* 新增弹窗 */}
      {showModal && (
        <div
          onClick={() => { if (!submitting) setShowModal(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15,23,42,0.5)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 18,
              width: '100%', maxWidth: 580,
              maxHeight: '92vh', overflowY: 'auto',
              padding: '32px 36px',
              boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
            }}
          >
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                上传新视频
              </h2>
              <p style={{ color: '#94a3b8', fontSize: 14, margin: '8px 0 0' }}>
                上传视频文件并填写相关信息
              </p>
            </div>

            {formError && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 10, padding: '11px 14px',
                color: '#dc2626', fontSize: 14, marginBottom: 20,
              }}>
                {formError}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <Label>视频文件 *</Label>
              <div
                onClick={() => videoRef.current?.click()}
                style={{
                  border: `2px dashed ${videoFile ? '#3b82f6' : '#cbd5e1'}`,
                  borderRadius: 12, padding: '28px 16px',
                  textAlign: 'center', cursor: 'pointer',
                  background: videoFile ? '#eff6ff' : '#fafafa',
                  transition: 'all .15s',
                }}
              >
                {videoFile ? (
                  <div>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🎬</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#2563eb' }}>{videoFile.name}</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 5 }}>
                      {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 40, marginBottom: 10, opacity: 0.4 }}>📁</div>
                    <div style={{ fontSize: 15, color: '#94a3b8' }}>点击选择视频文件</div>
                    <div style={{ fontSize: 13, color: '#cbd5e1', marginTop: 5 }}>支持 MP4 / MOV，最大 500MB</div>
                  </div>
                )}
              </div>
              <input ref={videoRef} type="file" accept="video/*" style={{ display: 'none' }}
                onChange={e => setVideoFile(e.target.files?.[0] ?? null)} />
              {submitting && progress > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>
                    <span>上传中...</span><span>{progress}%</span>
                  </div>
                  <div style={{ height: 7, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#3b82f6,#2563eb)', width: `${progress}%`, transition: 'width .3s' }} />
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <Label>封面图（可选，建议 16:9）</Label>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div onClick={() => coverRef.current?.click()} style={{
                  width: 120, height: 68, borderRadius: 8, flexShrink: 0,
                  border: '2px dashed #cbd5e1', cursor: 'pointer',
                  overflow: 'hidden', background: '#f8fafc',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {coverPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverPreview} alt="封面" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 26, opacity: 0.4 }}>🖼️</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', paddingTop: 4, lineHeight: 1.8 }}>
                  点击左侧区域选择封面图<br />支持 JPG / PNG，建议尺寸 1280×720
                </div>
              </div>
              <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  setCoverFile(f)
                  setCoverPreview(URL.createObjectURL(f))
                }} />
            </div>

            <div style={{ marginBottom: 18 }}>
              <Label>视频标题 *</Label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="例：Subject-Verb Agreement（主谓一致）" style={IS} />
            </div>

            <div style={{ marginBottom: 18 }}>
              <Label>简介</Label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="简短描述视频内容（选填）" rows={2}
                style={{ ...IS, resize: 'vertical', minHeight: 68 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <div>
                <Label>分类 *</Label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={IS}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <Label>系列名称 *</Label>
                <input value={form.series} onChange={e => setForm(f => ({ ...f, series: e.target.value }))}
                  placeholder="例：语法基础班" style={IS} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 30 }}>
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
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>
                    {'即 ' + fmtDuration(Number(form.duration))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} disabled={submitting} style={{
                padding: '11px 24px', borderRadius: 9, border: '1.5px solid #e2e8f0',
                background: '#fff', color: '#64748b', fontSize: 15, cursor: 'pointer', fontWeight: 500,
              }}>取消</button>
              <button onClick={handleSubmit} disabled={submitting} style={{
                padding: '11px 30px', borderRadius: 9, border: 'none',
                background: submitting ? '#94a3b8' : 'linear-gradient(135deg,#3b82f6,#2563eb)',
                color: '#fff', fontSize: 15, fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer', minWidth: 110,
              }}>
                {submitting ? `上传中 ${progress}%` : '确认上传'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteId !== null && (
        <div onClick={() => setDeleteId(null)} style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15,23,42,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 16,
            padding: '36px 40px', maxWidth: 400, width: '90%',
            textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 10px' }}>确认删除？</h3>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 8px' }}>即将删除视频：</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: '0 0 16px', wordBreak: 'break-all' }}>
              {`「${deleteTitle}」`}
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 28px' }}>
              视频文件和封面图将从服务器一并删除，且无法恢复。
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteId(null)} style={{
                padding: '10px 24px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                background: '#fff', color: '#64748b', fontSize: 15, cursor: 'pointer',
              }}>取消</button>
              <button onClick={handleDelete} style={{
                padding: '10px 24px', borderRadius: 8, border: 'none',
                background: '#ef4444', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              }}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
      {children}
    </div>
  )
}

const IS: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 9,
  border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1e293b',
  outline: 'none', boxSizing: 'border-box', background: '#fafafa',
}