'use client'
import { useState, useEffect, useRef, useCallback, useReducer } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import '../(auth)/auth.css'
import BgWords from '../(auth)/BgWords'

type LoginMethod = 'password' | 'phone'

function SliderCaptcha({ onVerified }: { onVerified: () => void }) {
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState(0)
  const [verified, setVerified] = useState(false)
  const [failed, setFailed] = useState(false)
  const startX = useRef(0)
  const trackWidth = 280
  const thumbWidth = 48
  const target = trackWidth - thumbWidth - 4

  const handleMouseDown = (e: React.MouseEvent) => {
    if (verified) return
    setDragging(true)
    setFailed(false)
    startX.current = e.clientX
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (verified) return
    setDragging(true)
    setFailed(false)
    startX.current = e.touches[0].clientX
  }

  const handleMove = useCallback((clientX: number) => {
    if (!dragging) return
    const delta = Math.max(0, Math.min(clientX - startX.current, target))
    setOffset(delta)
  }, [dragging, target])

  const handleEnd = useCallback(() => {
    if (!dragging) return
    setDragging(false)
    if (offset >= target - 10) {
      setOffset(target)
      setVerified(true)
      onVerified()
    } else {
      setFailed(true)
      setTimeout(() => { setOffset(0); setFailed(false) }, 500)
    }
  }, [dragging, offset, target, onVerified])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX)
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX)
    if (dragging) {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', handleEnd)
      window.addEventListener('touchmove', onTouchMove)
      window.addEventListener('touchend', handleEnd)
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [dragging, handleMove, handleEnd])

  return (
    <div style={{ margin: '16px 0' }}>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>请滑动滑块完成验证</div>
      <div style={{
        width: trackWidth, height: 44,
        background: verified ? '#f0fdf4' : failed ? '#fef2f2' : '#f1f5f9',
        borderRadius: 22, position: 'relative', overflow: 'hidden',
        border: `1.5px solid ${verified ? '#86efac' : failed ? '#fca5a5' : '#e2e8f0'}`,
        transition: 'background .3s, border-color .3s',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: offset + thumbWidth / 2,
          background: verified ? 'rgba(34,197,94,.2)' : 'rgba(59,130,246,.15)',
          transition: dragging ? 'none' : 'width .3s',
        }} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 13,
          color: verified ? '#16a34a' : '#94a3b8',
          userSelect: 'none', pointerEvents: 'none',
        }}>
          {verified ? '✓ 验证成功' : failed ? '请重新滑动' : '向右滑动'}
        </div>
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{
            position: 'absolute', left: offset + 2, top: 2,
            width: thumbWidth - 4, height: 40,
            background: verified ? '#22c55e' : '#3b82f6',
            borderRadius: 20, cursor: verified ? 'default' : 'grab',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 18, boxShadow: '0 2px 8px rgba(0,0,0,.15)',
            transition: dragging ? 'none' : 'left .3s, background .3s',
            userSelect: 'none',
          }}
        >
          {verified ? '✓' : '›'}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [failCount, setFailCount] = useState(0)
  const [needCaptcha, setNeedCaptcha] = useState(false)
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // useReducer 管理错误，更新同步不会被批量处理冲掉
  const [error, dispatchError] = useReducer(
    (_: string, action: string) => action,
    ''
  )
  const showError = (msg: string) => dispatchError(msg)
  const hideError = () => dispatchError('')

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

  const sendCode = async () => {
    if (!phone || phone.length !== 11) { showError('请输入正确的手机号'); return }
    if (countdown > 0) return
    try {
      setLoading(true)
      await api.post('/auth/send-code', { phone })
      startCountdown()
      hideError()
    } catch { showError('发送失败，请重试') }
    finally { setLoading(false) }
  }

  const submit = async () => {
    if (loginMethod === 'password' && (!phone || !password)) {
      showError('请输入手机号和密码')
      return
    }
    if (loginMethod === 'phone' && !code) {
      showError('请输入验证码')
      return
    }
    if (needCaptcha && !captchaVerified) {
      showError('请先完成滑动验证')
      return
    }

    setLoading(true)
    try {
      if (loginMethod === 'password') {
        const res = await api.post('/auth/login-password', { phone, password })
        hideError()
        setAuth(res.data.user, res.data.token)
        router.push('/dashboard/questions')
      } else {
        const res = await api.post('/auth/login', { phone, code })
        hideError()
        setAuth(res.data.user, res.data.token)
        router.push('/dashboard/questions')
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as {
          response: {
            data: {
              error?: string
              failCount?: number
              needCaptcha?: boolean
              locked?: boolean
            }
          }
        }).response
        const data = response?.data
        showError(data?.error || '手机号或密码错误')
        if (data?.locked) {
          setNeedCaptcha(false)
          setCaptchaVerified(false)
        } else if (typeof data?.failCount === 'number') {
          setFailCount(data.failCount)
          if (data.failCount >= 5 || data?.needCaptcha) {
            setNeedCaptcha(true)
            setCaptchaVerified(false)
          }
        }
      } else {
        showError('登录失败，请检查网络')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      <BgWords />
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="auth-logo-title">雅思写作</div>
          <div className="auth-logo-sub">IELTS WRITING PRO</div>
          <div className="auth-logo-bar" />
        </div>

        <div className="auth-tab-group" style={{ marginBottom: 16 }}>
          {(['password', 'phone'] as LoginMethod[]).map((m) => (
            <div key={m} className={`auth-tab${loginMethod === m ? ' active' : ''}`}
              onClick={() => {
                setLoginMethod(m)
                hideError()
                setFailCount(0)
                setNeedCaptcha(false)
                setCaptchaVerified(false)
              }}>
              {m === 'password' ? '密码登录' : '验证码登录'}
            </div>
          ))}
        </div>

        <div
          className="auth-error"
          style={{
            display: error ? 'flex' : 'none',
            alignItems: 'center',
            gap: 6,
            marginBottom: 12,
          }}
        >
          <span>⚠️</span>
          <span style={{ flex: 1 }}>{error}</span>
          {failCount > 0 && failCount <= 5 && (
            <span style={{ fontSize: 11, color: '#f87171', flexShrink: 0 }}>
              {failCount}/5 次
            </span>
          )}
        </div>

        <div className="auth-field">
          <label className="auth-label">手机号</label>
          <input className="auth-input" type="tel" value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="请输入手机号" maxLength={11} />
        </div>

        {loginMethod === 'password' && (
          <div className="auth-field">
            <label className="auth-label">密码</label>
            <input className="auth-input" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
              placeholder="请输入密码" />
          </div>
        )}

        {loginMethod === 'phone' && (
          <div className="auth-field">
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
        )}

        {needCaptcha && (
          <SliderCaptcha onVerified={() => setCaptchaVerified(true)} />
        )}

        {loginMethod === 'password' && (
          <div style={{ textAlign: 'right', marginBottom: '16px' }}>
            <span onClick={() => router.push('/forgot-password')}
              style={{ fontSize: '12px', color: '#93c5fd', cursor: 'pointer' }}>
              忘记密码？
            </span>
          </div>
        )}

        <button
          className="auth-submit-btn"
          onClick={submit}
          disabled={loading || (needCaptcha && !captchaVerified)}
          style={{
            marginTop: loginMethod === 'phone' ? '10px' : '0',
            opacity: needCaptcha && !captchaVerified ? 0.6 : 1,
          }}
        >
          {loading ? '请稍候...' : '登录'}
        </button>

        <div className="auth-footer">
          还没有账号？<a onClick={() => router.push('/register')}>立即注册</a>
        </div>
        <div className="auth-terms">登录即代表同意《用户协议》和《隐私政策》</div>
      </div>
    </div>
  )
}