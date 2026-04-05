'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import '../(auth)/auth.css'
import BgWords from '../(auth)/BgWords'

type Step = 'phone' | 'reset'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pwWarnings, setPwWarnings] = useState<string[]>([])

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
    try {
      setLoading(true)
      await api.post('/auth/send-code', { phone })
      setCodeSent(true); setError('')
    } catch { setError('发送失败，请重试') }
    finally { setLoading(false) }
  }

  const verifyAndNext = () => {
    if (!code) { setError('请输入验证码'); return }
    setError('')
    setStep('reset')
  }

  const resetPassword = async () => {
    setError('')
    if (!validatePassword(newPassword)) { setError('密码不符合要求'); return }
    if (newPassword !== confirmPassword) { setError('两次密码不一致'); return }
    try {
      setLoading(true)
      await api.post('/auth/reset-password', { phone, code, newPassword })
      router.push('/login')
    } catch (err: any) { setError(err.response?.data?.error || '重置失败') }
    finally { setLoading(false) }
  }

  return (
    <div className="auth-bg">
      <BgWords />
      <div className="auth-card">

        {/* 顶部返回 + 标题 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <span onClick={() => router.push('/login')}
            style={{ color: '#93c5fd', cursor: 'pointer', fontSize: '22px', lineHeight: 1 }}>←</span>
          <div>
            <div className="auth-logo-title" style={{ fontSize: '22px', textAlign: 'left' }}>
              {step === 'phone' ? '找回密码' : '设置新密码'}
            </div>
            <div className="auth-logo-sub" style={{ textAlign: 'left' }}>IELTS WRITING PRO</div>
          </div>
        </div>

        {/* 步骤条 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
          {['验证手机号', '设置新密码'].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i === 0 ? 'unset' : 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: (step === 'phone' && i === 0) || (step === 'reset') ? '#3b82f6' : '#eff6ff',
                  color: (step === 'phone' && i === 0) || (step === 'reset') ? '#fff' : '#93c5fd',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: '600', border: '1px solid #bfdbfe',
                }}>
                  {step === 'reset' && i === 0 ? '✓' : i + 1}
                </div>
                <div style={{ fontSize: '11px', color: (step === 'phone' && i === 0) || step === 'reset' ? '#3b82f6' : '#93c5fd', whiteSpace: 'nowrap' }}>{s}</div>
              </div>
              {i === 0 && (
                <div style={{ flex: 1, height: '1px', background: step === 'reset' ? '#3b82f6' : '#dbeafe', margin: '0 10px', marginBottom: '18px' }} />
              )}
            </div>
          ))}
        </div>

        {error && <div className="auth-error">{error}</div>}

        {step === 'phone' && (<>
          <div className="auth-field">
            <label className="auth-label">手机号</label>
            <input className="auth-input" type="tel" value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入注册时的手机号" maxLength={11} />
          </div>
          <div className="auth-field" style={{ marginBottom: '24px' }}>
            <label className="auth-label">验证码</label>
            <div className="auth-code-row">
              <input className="auth-input" type="text" value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="请输入验证码" maxLength={6} style={{ flex: 1 }} />
              <button className="auth-send-btn" onClick={sendCode} disabled={loading || codeSent}>
                {codeSent ? '已发送' : '发送验证码'}
              </button>
            </div>
          </div>
          <button className="auth-submit-btn" onClick={verifyAndNext} disabled={loading}>
            下一步
          </button>
        </>)}

        {step === 'reset' && (<>
          <div className="auth-field">
            <label className="auth-label">新密码</label>
            <input className="auth-input" type="password" value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); validatePassword(e.target.value) }}
              placeholder="至少8位，包含字母和数字" />
            {pwWarnings.length > 0 && (
              <div className="pw-warnings">
                {pwWarnings.map((w, i) => <span key={i} className="pw-warn-tag">{w}</span>)}
              </div>
            )}
          </div>
          <div className="auth-field" style={{ marginBottom: '24px' }}>
            <label className="auth-label">确认新密码</label>
            <input className={`auth-input${confirmPassword && confirmPassword !== newPassword ? ' error' : ''}`}
              type="password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入新密码" />
            {confirmPassword && confirmPassword !== newPassword && (
              <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>两次密码不一致</div>
            )}
          </div>
          <button className="auth-submit-btn" onClick={resetPassword} disabled={loading}>
            {loading ? '请稍候...' : '确认重置'}
          </button>
        </>)}

        <div className="auth-footer" style={{ marginTop: '16px' }}>
          <a onClick={() => router.push('/login')}>返回登录</a>
        </div>
      </div>
    </div>
  )
}