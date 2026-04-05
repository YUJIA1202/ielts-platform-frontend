'use client'

import { useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLayoutStore } from '@/store/layoutStore'
import Link from 'next/link'
import api from '@/lib/api'

type QuestionInputMode = 'text' | 'image' | 'both'
type EssayInputMode = 'text' | 'file'

function SubmitPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const fromExam = searchParams.get('fromExam') === '1'
  const examQuestionText = searchParams.get('questionText') ?? ''
  const examAnswer = searchParams.get('answer') ?? ''
  const { collapsed } = useLayoutStore()

  const [qMode, setQMode] = useState<QuestionInputMode>('text')
  const [questionText, setQuestionText] = useState(examQuestionText)
  const [questionImage, setQuestionImage] = useState<File | null>(null)
  const [questionImagePreview, setQuestionImagePreview] = useState('')
  const qImageRef = useRef<HTMLInputElement>(null)

  const [correctionCode, setCorrectionCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [codeValid, setCodeValid] = useState(false)
  const [codeType, setCodeType] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  const [eMode, setEMode] = useState<EssayInputMode>('text')
  const [essayText, setEssayText] = useState(examAnswer)
  const [essayFile, setEssayFile] = useState<File | null>(null)
  const essayFileRef = useRef<HTMLInputElement>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [done, setDone] = useState(false)
  const [examBanner, setExamBanner] = useState(fromExam)

  function handleQImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setQuestionImage(file)
    setQuestionImagePreview(URL.createObjectURL(file))
  }

  function removeQImage() {
    setQuestionImage(null)
    setQuestionImagePreview('')
    if (qImageRef.current) qImageRef.current.value = ''
  }

  function handleEssayFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setEssayFile(file)
  }

  function removeEssayFile() {
    setEssayFile(null)
    if (essayFileRef.current) essayFileRef.current.value = ''
  }

  function countWords(text: string) {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
  }
  const wordCount = countWords(essayText)

  function validate() {
    const hasQ =
      (qMode === 'text' && questionText.trim() !== '') ||
      (qMode === 'image' && questionImage !== null) ||
      (qMode === 'both' && (questionText.trim() !== '' || questionImage !== null))
    const hasE =
      (eMode === 'text' && essayText.trim() !== '') ||
      (eMode === 'file' && essayFile !== null)
    return hasQ && hasE && codeValid
  }

  // ── 验证批改码（调用真实 API）──────────────────────────────────────
  async function verifyCode() {
    const code = correctionCode.trim()
    if (!code) { setCodeError('请输入批改码'); return }

    setVerifying(true)
    setCodeError('')
    try {
      const res = await api.post('/correction-codes/verify', { code })
      if (res.data.valid) {
        setCodeValid(true)
        setCodeType(res.data.type)
        setCodeError('')
      } else {
        setCodeValid(false)
        setCodeType(null)
        setCodeError(res.data.reason || '批改码无效')
      }
    } catch {
      setCodeError('验证失败，请检查网络后重试')
      setCodeValid(false)
    } finally {
      setVerifying(false)
    }
  }

  // ── 提交作文（调用真实 API）───────────────────────────────────────
  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const formData = new FormData()
      formData.append('correctionCode', correctionCode.trim())
      if (questionText.trim()) formData.append('customPrompt', questionText.trim())
      if (questionImage) formData.append('image', questionImage)
      if (eMode === 'text') {
        formData.append('content', essayText)
      } else if (essayFile) {
        formData.append('wordFile', essayFile)
      }

      await api.post('/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setDone(true)
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || '提交失败，请检查网络后重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', background: '#dcfce7',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: 36,
        }}>✓</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '0 0 10px' }}>
          提交成功！
        </h2>
        <p style={{ color: '#64748b', fontSize: 15, margin: '0 0 32px', lineHeight: 1.7 }}>
          老师通常在 <strong style={{ color: '#3b82f6' }}>48 小时内</strong> 完成批改，
          完成后可在「我的批改」页面查看和下载批改文件。
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => {
              setDone(false)
              setQuestionText('')
              setQuestionImage(null)
              setQuestionImagePreview('')
              setEssayText('')
              setEssayFile(null)
              setCorrectionCode('')
              setCodeValid(false)
              setCodeType(null)
              setExamBanner(false)
            }}
            style={{
              padding: '10px 28px', borderRadius: 10,
              border: '1.5px solid #e2e8f0', background: '#fff',
              color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}
          >再提交一篇</button>
          <Link href="/dashboard/submissions" style={{
            padding: '10px 28px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff', fontWeight: 700, fontSize: 14,
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
          }}>查看我的批改 →</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: collapsed ? 920 : '100%',
      margin: collapsed ? '0 20% 0 5%' : '0',
      transition: 'all .2s ease',
    }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>提交批改</h1>
        <p style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>
          填写题目和作文，老师将在 48 小时内完成批改并上传批改文件
        </p>
      </div>

      {examBanner && (
        <div style={{
          background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 10,
          padding: '12px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>📋</span>
            <span style={{ fontSize: 14, color: '#1d4ed8', fontWeight: 500 }}>
              已自动带入模考题目和作文内容，确认后直接提交即可
            </span>
          </div>
          <button onClick={() => setExamBanner(false)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#93c5fd', fontSize: 20, lineHeight: 1,
          }}>×</button>
        </div>
      )}

      {/* 1. 批改码 */}
      <div style={{ background: '#fff', border: `1.5px solid ${codeValid ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: 14, padding: '22px 24px', marginBottom: 16, transition: 'border-color .2s' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: codeValid ? '#22c55e' : '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s' }}>1</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>批改码</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>输入从「购买记录」获取的批改码，码与作文题型须匹配</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={correctionCode}
            onChange={e => {
              setCorrectionCode(e.target.value.toUpperCase())
              setCodeValid(false)
              setCodeType(null)
              setCodeError('')
            }}
            onKeyDown={e => { if (e.key === 'Enter') verifyCode() }}
            placeholder="例如：TASK2-A1B2C3 或 ANY-X9Y8Z7"
            disabled={verifying}
            style={{ flex: 1, border: `1.5px solid ${codeError ? '#fca5a5' : codeValid ? '#86efac' : '#e2e8f0'}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#1e293b', outline: 'none', fontFamily: 'monospace', background: codeValid ? '#f0fdf4' : '#fafafa' }}
          />
          <button
            onClick={verifyCode}
            disabled={verifying || codeValid}
            style={{ padding: '10px 20px', borderRadius: 10, border: codeValid ? '1.5px solid #bbf7d0' : 'none', background: codeValid ? '#f0fdf4' : verifying ? '#cbd5e1' : 'linear-gradient(135deg, #3b82f6, #2563eb)', color: codeValid ? '#16a34a' : '#fff', fontWeight: 700, fontSize: 14, cursor: verifying || codeValid ? 'not-allowed' : 'pointer', flexShrink: 0 }}
          >
            {verifying ? '验证中...' : codeValid ? '✓ 验证成功' : '验证'}
          </button>
        </div>
        {codeError && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>{codeError}</div>}
        {codeValid && (
          <div style={{ fontSize: 12, color: '#16a34a', marginTop: 8 }}>
            ✓ 批改码有效（{codeType === 'ANY' ? '通用码' : codeType === 'TASK2' ? 'Task 2 专用' : 'Task 1 专用'}），提交后该码将被标记为已使用
          </div>
        )}
        <div style={{ marginTop: 12, fontSize: 13, color: '#94a3b8' }}>
          还没有批改码？
          <a href="/dashboard/shop/corrections" style={{ color: '#3b82f6', marginLeft: 4, fontWeight: 500 }}>前往购买 →</a>
        </div>
      </div>

      {/* 2. 题目 */}
      <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '22px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>题目内容</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>支持文字输入、图片上传，或两者都提供</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {([
            { val: 'text' as const, label: '✏️ 文字输入' },
            { val: 'image' as const, label: '🖼️ 图片上传' },
            { val: 'both' as const, label: '✏️ + 🖼️ 两者都有' },
          ]).map(({ val, label }) => (
            <button key={val} onClick={() => setQMode(val)} style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              border: qMode === val ? '1.5px solid #3b82f6' : '1.5px solid #e2e8f0',
              background: qMode === val ? '#eff6ff' : '#f8fafc',
              color: qMode === val ? '#2563eb' : '#64748b',
              fontWeight: qMode === val ? 600 : 400, transition: 'all .15s',
            }}>{label}</button>
          ))}
        </div>
        {(qMode === 'text' || qMode === 'both') && (
          <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)}
            placeholder="请粘贴或输入题目原文..." rows={4}
            style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#1e293b', resize: 'vertical', outline: 'none', background: '#fafafa', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        )}
        {(qMode === 'image' || qMode === 'both') && (
          <div style={{ marginTop: qMode === 'both' ? 12 : 0 }}>
            {questionImagePreview ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={questionImagePreview} alt="题目图片" style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 8, border: '1.5px solid #e2e8f0', display: 'block' }} />
                <button onClick={removeQImage} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.55)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            ) : (
              <div onClick={() => qImageRef.current?.click()} style={{ border: '2px dashed #cbd5e1', borderRadius: 12, padding: '32px 24px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🖼️</div>
                <div style={{ fontSize: 14, color: '#3b82f6', fontWeight: 500 }}>点击上传题目图片</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>支持 JPG、PNG、WEBP，最大 10MB</div>
                <input ref={qImageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleQImageChange} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. 作文 */}
      <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '22px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>我的作文</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>直接粘贴文本，或上传 Word 文档（.docx / .doc）</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {([
            { val: 'text' as const, label: '✏️ 文字输入' },
            { val: 'file' as const, label: '📄 上传 Word' },
          ]).map(({ val, label }) => (
            <button key={val} onClick={() => setEMode(val)} style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              border: eMode === val ? '1.5px solid #3b82f6' : '1.5px solid #e2e8f0',
              background: eMode === val ? '#eff6ff' : '#f8fafc',
              color: eMode === val ? '#2563eb' : '#64748b',
              fontWeight: eMode === val ? 600 : 400, transition: 'all .15s',
            }}>{label}</button>
          ))}
        </div>
        {eMode === 'text' && (
          <div>
            <textarea value={essayText} onChange={(e) => setEssayText(e.target.value)}
              placeholder="请在此处粘贴或输入你的作文..." rows={12}
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: 15, color: '#1e293b', resize: 'vertical', outline: 'none', background: '#fafafa', boxSizing: 'border-box', fontFamily: 'Georgia, serif', lineHeight: 1.85 }} />
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 4, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min((wordCount / 250) * 100, 100)}%`, background: wordCount < 150 ? '#ef4444' : wordCount < 250 ? '#f59e0b' : '#22c55e', borderRadius: 99, transition: 'width .3s, background .3s' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, minWidth: 90, textAlign: 'right', whiteSpace: 'nowrap', color: wordCount < 150 ? '#ef4444' : wordCount < 250 ? '#f59e0b' : '#22c55e' }}>
                {wordCount} 词{wordCount >= 250 ? ' ✓' : ''}
              </span>
            </div>
          </div>
        )}
        {eMode === 'file' && (
          essayFile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10 }}>
              <span style={{ fontSize: 28 }}>📄</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{essayFile.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{(essayFile.size / 1024).toFixed(0)} KB</div>
              </div>
              <button onClick={removeEssayFile} style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 13, padding: '4px 10px' }}>移除</button>
            </div>
          ) : (
            <div onClick={() => essayFileRef.current?.click()} style={{ border: '2px dashed #cbd5e1', borderRadius: 12, padding: '32px 24px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 14, color: '#3b82f6', fontWeight: 500 }}>点击上传 Word 文档</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>支持 .docx、.doc，最大 20MB</div>
              <input ref={essayFileRef} type="file" accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style={{ display: 'none' }} onChange={handleEssayFileChange} />
            </div>
          )
        )}
      </div>

      {/* 提交按钮 */}
      <div style={{ padding: '8px 0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
          {!codeValid ? '请先验证批改码才能提交' : '提交后无法修改，请确认内容无误'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {submitError && <span style={{ fontSize: 13, color: '#ef4444' }}>{submitError}</span>}
          <button
            onClick={handleSubmit}
            disabled={!validate() || submitting}
            style={{ padding: '11px 36px', borderRadius: 10, border: 'none', background: !validate() || submitting ? '#cbd5e1' : 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: !validate() || submitting ? 'not-allowed' : 'pointer', boxShadow: validate() && !submitting ? '0 4px 14px rgba(59,130,246,.35)' : 'none', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {submitting ? (
              <><span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />提交中...</>
            ) : '提交批改 →'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: '#94a3b8' }}>加载中...</div>}>
      <SubmitPageInner />
    </Suspense>
  )
}