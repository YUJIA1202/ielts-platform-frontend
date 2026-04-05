'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'

interface Submission {
  id: number
  status: 'PENDING' | 'REVIEWED'
  createdAt: string
  content?: string
  customPrompt?: string
  imageUrl?: string
  wordFileUrl?: string
  reviewFileUrl?: string
  taScore?: number
  ccScore?: number
  lrScore?: number
  graScore?: number
  overallScore?: number
  adminComment?: string
  reviewTask?: string
  reviewSubtype?: string
  user: { id: number; username?: string; phone: string }
  question?: { id: number; content: string; task?: string; subtype?: string }
  correctionCode?: { code: string; type: string }
}

const TASK2_SUBTYPES = ['程度同意', '报告', '优缺点', '双边']
const TASK1_SUBTYPES = ['线图', '表格', '柱状图', '混合图', '饼图', '流程图', '地图']

export default function AdminSubmissionDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [sub, setSub] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [ta, setTa]   = useState('')
  const [cc, setCc]   = useState('')
  const [lr, setLr]   = useState('')
  const [gra, setGra] = useState('')
  const [comment, setComment]         = useState('')
  const [reviewFile, setReviewFile]   = useState<File | null>(null)
  const [reviewTask, setReviewTask]   = useState('TASK2')
  const [reviewSubtype, setReviewSubtype] = useState('')

  const overall = [ta, cc, lr, gra].every(v => v !== '')
    ? (Math.round((parseFloat(ta) + parseFloat(cc) + parseFloat(lr) + parseFloat(gra)) / 4 * 2) / 2).toFixed(1)
    : '—'

  useEffect(() => {
    api.get(`/submissions/${id}`)
      .then(res => {
        const data = res.data
        setSub(data)
        if (data.taScore      != null) setTa(String(data.taScore))
        if (data.ccScore      != null) setCc(String(data.ccScore))
        if (data.lrScore      != null) setLr(String(data.lrScore))
        if (data.graScore     != null) setGra(String(data.graScore))
        if (data.adminComment)         setComment(data.adminComment)
        if (data.reviewTask)           setReviewTask(data.reviewTask)
        if (data.reviewSubtype)        setReviewSubtype(data.reviewSubtype)
        // 如果关联了题目，自动填入题型
        if (!data.reviewTask && data.question?.task) setReviewTask(data.question.task)
        if (!data.reviewSubtype && data.question?.subtype) setReviewSubtype(data.question.subtype)
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmitReview() {
    if (!sub) return
    if (!ta || !cc || !lr || !gra) { alert('请填写全部四项评分'); return }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('taScore',       ta)
      formData.append('ccScore',       cc)
      formData.append('lrScore',       lr)
      formData.append('graScore',      gra)
      formData.append('overallScore',  overall)
      formData.append('adminComment',  comment)
      formData.append('reviewTask',    reviewTask)
      formData.append('reviewSubtype', reviewSubtype)
      if (reviewFile) formData.append('reviewFile', reviewFile)

      await api.put(`/submissions/${sub.id}/review`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      alert('批改提交成功！')
      router.push('/admin/submissions')
    } catch {
      alert('提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>加载中...</div>
  if (!sub)    return <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>找不到该记录</div>

  const questionText = sub.question?.content || sub.customPrompt
  const essayContent = sub.content
  const subtypes     = reviewTask === 'TASK2' ? TASK2_SUBTYPES : TASK1_SUBTYPES

  return (
    <div style={{ maxWidth: '100%' }}>

      {/* 返回 + 页头 */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => router.back()} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          marginBottom: 16, padding: '8px 16px', borderRadius: 8,
          border: '1.5px solid #e2e8f0', background: '#fff',
          color: '#64748b', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>← 返回列表</button>

        <div style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          border: '1.5px solid #bfdbfe', borderLeft: '5px solid #1d4ed8',
          borderRadius: 16, padding: '20px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e3a5f', marginBottom: 4 }}>
              批改详情 #{sub.id}
            </h1>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              {sub.user.username || sub.user.phone}
            </div>
          </div>
          <span style={{
            fontSize: 12, padding: '6px 16px', borderRadius: 20, fontWeight: 600,
            background: sub.status === 'PENDING' ? '#fef3c7' : '#dcfce7',
            color: sub.status === 'PENDING' ? '#92400e' : '#166634',
          }}>
            {sub.status === 'PENDING' ? '⏳ 待批改' : '✅ 已完成'}
          </span>
        </div>
      </div>

      {/* 用户信息 + 附件 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: '#fff', border: '1.5px solid #e8f0fe', borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', marginBottom: 14 }}>👤 用户信息</div>
          {[
            { label: '用户名',   value: sub.user.username || '未设置' },
            { label: '手机号',   value: sub.user.phone },
            { label: '提交时间', value: new Date(sub.createdAt).toLocaleString('zh-CN') },
            { label: '批改码',   value: sub.correctionCode?.code || '—' },
          ].map(row => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13,
            }}>
              <span style={{ color: '#94a3b8', fontWeight: 500 }}>{row.label}</span>
              <span style={{ color: '#1e3a5f', fontWeight: 600 }}>{row.value}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', border: '1.5px solid #e8f0fe', borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', marginBottom: 14 }}>📎 用户附件</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sub.imageUrl ? (
              <a href={sub.imageUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, border: '1.5px solid #bfdbfe', color: '#1d4ed8', textDecoration: 'none', fontSize: 13, fontWeight: 600, background: '#eff6ff' }}>
                🖼️ 查看题目图片 →
              </a>
            ) : (
              <div style={{ padding: '12px 14px', borderRadius: 10, border: '1.5px dashed #e8f0fe', color: '#94a3b8', fontSize: 13 }}>无图片附件</div>
            )}
            {sub.wordFileUrl ? (
              <a href={sub.wordFileUrl} download style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, border: '1.5px solid #bbf7d0', color: '#16a34a', textDecoration: 'none', fontSize: 13, fontWeight: 600, background: '#f0fdf4' }}>
                📄 下载 Word 原文 →
              </a>
            ) : (
              <div style={{ padding: '12px 14px', borderRadius: 10, border: '1.5px dashed #e8f0fe', color: '#94a3b8', fontSize: 13 }}>无 Word 附件</div>
            )}
            {sub.reviewFileUrl && (
              <a href={sub.reviewFileUrl} download style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, border: '1.5px solid #bbf7d0', color: '#16a34a', textDecoration: 'none', fontSize: 13, fontWeight: 600, background: '#f0fdf4' }}>
                ✅ 已上传批改文件 →
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 题目 */}
      {questionText && (
        <div style={{ background: '#fff', border: '1.5px solid #e8f0fe', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', marginBottom: 12 }}>📋 题目</div>
          <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.85, fontFamily: 'Georgia, serif', background: '#f8faff', borderRadius: 10, padding: '16px 20px' }}>
            {questionText}
          </div>
        </div>
      )}

      {/* 用户作文 */}
      {essayContent && (
        <div style={{ background: '#fff', border: '1.5px solid #e8f0fe', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8' }}>📝 用户作文</div>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>共 {essayContent.trim().split(/\s+/).length} 词</span>
          </div>
          <div style={{ fontSize: 15, color: '#1e293b', lineHeight: 1.95, fontFamily: 'Georgia, serif', background: '#f8faff', borderRadius: 10, padding: '16px 20px' }}>
            {essayContent.split('\n').filter(p => p.trim()).map((para, i) => (
              <p key={i} style={{ margin: '0 0 12px 0' }}>{para}</p>
            ))}
          </div>
        </div>
      )}

      {/* 批改操作区 */}
      <div style={{ background: '#fff', border: '1.5px solid #e8f0fe', borderRadius: 14, padding: '24px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', marginBottom: 20 }}>🎯 批改操作</div>

        {/* 题型标记 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 12 }}>
            题型标记（用于用户端分数统计）
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {/* Task 选择 */}
            <div style={{ display: 'flex', gap: 8 }}>
              {(['TASK2', 'TASK1'] as const).map(t => (
                <button key={t} onClick={() => { setReviewTask(t); setReviewSubtype('') }} style={{
                  padding: '8px 18px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                  border: `1.5px solid ${reviewTask === t ? '#1d4ed8' : '#e8f0fe'}`,
                  background: reviewTask === t ? '#eff6ff' : '#f8fafc',
                  color: reviewTask === t ? '#1d4ed8' : '#64748b',
                  fontWeight: reviewTask === t ? 700 : 400,
                }}>
                  {t === 'TASK2' ? 'Task 2 大作文' : 'Task 1 小作文'}
                </button>
              ))}
            </div>

            {/* 子类型 */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={() => setReviewSubtype('')} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                border: `1.5px solid ${reviewSubtype === '' ? '#1d4ed8' : '#e8f0fe'}`,
                background: reviewSubtype === '' ? '#eff6ff' : '#f8fafc',
                color: reviewSubtype === '' ? '#1d4ed8' : '#64748b',
                fontWeight: reviewSubtype === '' ? 700 : 400,
              }}>不限</button>
              {subtypes.map(s => (
                <button key={s} onClick={() => setReviewSubtype(s)} style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                  border: `1.5px solid ${reviewSubtype === s ? '#1d4ed8' : '#e8f0fe'}`,
                  background: reviewSubtype === s ? '#eff6ff' : '#f8fafc',
                  color: reviewSubtype === s ? '#1d4ed8' : '#64748b',
                  fontWeight: reviewSubtype === s ? 700 : 400,
                }}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        {/* 四维评分 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 12 }}>
            四维评分（0 – 9 分，支持 0.5 步进）
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              { label: 'TA 任务回应', val: ta,  set: setTa,  color: '#3b82f6' },
              { label: 'CC 连贯衔接', val: cc,  set: setCc,  color: '#8b5cf6' },
              { label: 'LR 词汇资源', val: lr,  set: setLr,  color: '#10b981' },
              { label: 'GRA 语法多样', val: gra, set: setGra, color: '#f59e0b' },
            ].map(dim => (
              <div key={dim.label}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textAlign: 'center', fontWeight: 500 }}>{dim.label}</div>
                <input
                  type="number" min={0} max={9} step={0.5}
                  value={dim.val}
                  onChange={e => dim.set(e.target.value)}
                  placeholder="—"
                  style={{
                    width: '100%', padding: '10px', fontSize: 16, fontWeight: 700,
                    textAlign: 'center', borderRadius: 8,
                    border: `1.5px solid ${dim.color}40`,
                    background: `${dim.color}08`, color: '#1e3a5f', outline: 'none',
                  }}
                />
              </div>
            ))}
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textAlign: 'center', fontWeight: 500 }}>综合分</div>
              <input type="text" readOnly value={overall} style={{
                width: '100%', padding: '10px', fontSize: 16, fontWeight: 700,
                textAlign: 'center', borderRadius: 8, border: '1.5px solid #bfdbfe',
                background: '#eff6ff', color: '#1d4ed8', outline: 'none',
              }} />
            </div>
          </div>
        </div>

        {/* 上传批改文件 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 10 }}>
            上传批改文件（PDF / Word，可选）
          </div>
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 8,
            border: `2px dashed ${reviewFile ? '#10b981' : '#93c5fd'}`,
            borderRadius: 12, padding: '28px 20px', cursor: 'pointer',
            background: reviewFile ? '#f0fdf4' : '#f8faff',
          }}>
            <span style={{ fontSize: 28 }}>{reviewFile ? '✅' : '📎'}</span>
            <span style={{ fontSize: 13, color: reviewFile ? '#16a34a' : '#64748b', fontWeight: 500 }}>
              {reviewFile ? reviewFile.name : '点击选择批改文件'}
            </span>
            <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
              onChange={e => setReviewFile(e.target.files?.[0] || null)} />
          </label>
        </div>

        {/* 批改总评 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 10 }}>
            批改总评（用户可见，可选）
          </div>
          <textarea rows={4} value={comment} onChange={e => setComment(e.target.value)}
            placeholder="整体评语、建议、改进方向..."
            style={{
              width: '100%', padding: '14px', fontSize: 14, borderRadius: 10,
              border: '1.5px solid #e8f0fe', background: '#f8faff', color: '#374151',
              resize: 'vertical', lineHeight: 1.7, outline: 'none',
            }} />
        </div>

        {/* 按钮 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={() => router.back()} style={{
            padding: '11px 22px', borderRadius: 10, border: '1.5px solid #e2e8f0',
            background: '#fff', color: '#64748b', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>取消</button>
          <button onClick={handleSubmitReview} disabled={submitting} style={{
            padding: '11px 28px', borderRadius: 10, border: 'none',
            background: submitting ? '#93c5fd' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}>
            {submitting ? '提交中...' : sub.status === 'REVIEWED' ? '更新批改' : '提交批改 →'}
          </button>
        </div>
      </div>
    </div>
  )
}