'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import '../(auth)/auth.css'
import BgWords from '../(auth)/BgWords'

export default function RegisterPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pwWarnings, setPwWarnings] = useState<string[]>([])
  const [countdown, setCountdown] = useState(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCountdown = () => {
    setCountdown(60)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(countdownRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [])

  const validatePassword = (pw: string) => {
    const warns: string[] = []
    if (pw.length < 8) warns.push('至少8位')
    if (!/[a-zA-Z]/.test(pw)) warns.push('需包含字母')
    if (!/[0-9]/.test(pw)) warns.push('需包含数字')
    setPwWarnings(warns)
    return warns.length === 0
  }

  const sendCode = async () => {
    if (!phone || phone.length !== 11) { setError('请输入正确的手机号'); return }
    if (countdown > 0) return
    try {
      setLoading(true)
      await api.post('/auth/send-code', { phone })
      startCountdown()
      setError('')
    } catch { setError('发送失败') }
    finally { setLoading(false) }
  }

  const submit = async () => {
    setError('')
    if (!username) { setError('请输入用户名'); return }
    if (!validatePassword(password)) { setError('密码不符合要求'); return }
    if (password !== confirmPassword) { setError('两次密码不一致'); return }
    if (!code) { setError('请输入验证码'); return }
    try {
      setLoading(true)
      const res = await api.post('/auth/register', { phone, code, username, password })
      setAuth(res.data.user, res.data.token)
      router.push('/dashboard/questions')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || '注册失败'
      setError(msg)
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-bg">
      <BgWords />
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="auth-logo-title">创建账号</div>
          <div className="auth-logo-sub">IELTS WRITING PRO</div>
          <div className="auth-logo-bar" />
        </div>

        {error && (
          <div className="auth-error" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        <div className="auth-field">
          <label className="auth-label">手机号</label>
          <input className="auth-input" type="tel" value={phone}
            onChange={(e) => setPhone(e.target.value)} placeholder="请输入手机号" maxLength={11} />
        </div>
        <div className="auth-field">
          <label className="auth-label">用户名</label>
          <input className="auth-input" type="text" value={username}
            onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名" />
        </div>
        <div className="auth-field">
          <label className="auth-label">设置密码</label>
          <input className="auth-input" type="password" value={password}
            onChange={(e) => { setPassword(e.target.value); validatePassword(e.target.value) }}
            placeholder="至少8位，包含字母和数字" />
          {pwWarnings.length > 0 && (
            <div className="pw-warnings">
              {pwWarnings.map((w, i) => <span key={i} className="pw-warn-tag">{w}</span>)}
            </div>
          )}
        </div>
        <div className="auth-field">
          <label className="auth-label">确认密码</label>
          <input
            className={`auth-input${confirmPassword && confirmPassword !== password ? ' error' : ''}`}
            type="password" value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)} placeholder="请再次输入密码" />
          {confirmPassword && confirmPassword !== password && (
            <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>两次密码不一致</div>
          )}
        </div>
        <div className="auth-field" style={{ marginBottom: '20px' }}>
          <label className="auth-label">验证码</label>
          <div className="auth-code-row">
            <input className="auth-input" type="text" value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="请输入验证码" maxLength={6} style={{ flex: 1 }} />
            <button
              className="auth-send-btn"
              onClick={sendCode}
              disabled={loading || countdown > 0}
              style={{ opacity: countdown > 0 ? 0.6 : 1 }}
            >
              {countdown > 0 ? `${countdown}s 后重发` : '发送验证码'}
            </button>
          </div>
        </div>

        <button className="auth-submit-btn" onClick={submit} disabled={loading}>
          {loading ? '请稍候...' : '立即注册'}
        </button>
        <div className="auth-footer">
          已有账号？<a onClick={() => router.push('/login')}>去登录</a>
        </div>
      </div>
    </div>
  )
}