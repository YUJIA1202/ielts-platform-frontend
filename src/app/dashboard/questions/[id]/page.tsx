'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useLayoutStore } from '@/store/layoutStore'
import { Question, Essay } from '@/types'
import { useAuthStore } from '@/store/authStore'

const DAILY_OUTLINE_LIMIT = 4
const STORAGE_KEY = 'outline_usage'

function getOutlineUsage(): { date: string; count: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { date: '', count: 0 }
    return JSON.parse(raw)
  } catch { return { date: '', count: 0 } }
}

function incrementOutlineUsage(): number {
  const today = new Date().toISOString().split('T')[0]
  const usage = getOutlineUsage()
  const newCount = usage.date === today ? usage.count + 1 : 1
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: newCount }))
  return newCount
}

function getTodayOutlineCount(): number {
  const today = new Date().toISOString().split('T')[0]
  const usage = getOutlineUsage()
  return usage.date === today ? usage.count : 0
}

export default function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { collapsed } = useLayoutStore()
  const [question, setQuestion] = useState<Question | null>(null)
  const [essays, setEssays] = useState<Essay[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'outline' | 'essays' | 'practice'>('outline')
  const [outlineUnlocked, setOutlineUnlocked] = useState(false)
  const [todayCount, setTodayCount] = useState(0)
  const { user } = useAuthStore()
  const isSubscribed = user?.role === 'ADMIN' || user?.subscription === 'BASIC' || user?.subscription === 'PRO'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const qRes = await api.get(`/questions/${id}`)
        setQuestion(qRes.data)
        const eRes = await api.get(`/essays/question/${id}`)
        setEssays(eRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    const count = getTodayOutlineCount()
    setTodayCount(count)

    if (user) {
      if (isSubscribed) {
        // 订阅用户直接解锁，不计数
        setOutlineUnlocked(true)
      } else if (count < DAILY_OUTLINE_LIMIT) {
        // 免费用户还有次数
        const newCount = incrementOutlineUsage()
        setTodayCount(newCount)
        setOutlineUnlocked(true)
      }
    }
  }, [id, isSubscribed, user])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>加载中...</div>
  )

  if (!question) return (
    <div style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>题目不存在</div>
  )

  const outlineLocked = !outlineUnlocked

  return (
    <div style={{ maxWidth: collapsed ? '900px' : '100%', margin: collapsed ? '0 20% 0 5%' : '0', transition: 'all .2s ease' }}>

      <div style={{ marginBottom: '24px' }}>
        <span onClick={() => router.back()}
          style={{ fontSize: '15px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', width: 'fit-content' }}>
          ← 返回真题库
        </span>
      </div>

      {/* 题目卡片 */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '28px 32px', border: '1px solid #e8f0fe', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {question.task && (
            <span style={{ fontSize: '12px', background: '#eff6ff', color: '#3b82f6', padding: '3px 10px', borderRadius: '6px', fontWeight: '500' }}>
              {question.task === 'TASK2' ? 'Task 2 大作文' : 'Task 1 小作文'}
            </span>
          )}
          {question.subtype && (
            <span style={{ fontSize: '12px', background: '#f8faff', color: '#64748b', padding: '3px 10px', borderRadius: '6px' }}>
              {question.subtype}
            </span>
          )}
          {question.topic && (
            <span style={{ fontSize: '12px', background: '#f0fdf4', color: '#16a34a', padding: '3px 10px', borderRadius: '6px', fontWeight: '500' }}>
              {question.topic}
            </span>
          )}
          {question.source && <span style={{ fontSize: '12px', color: '#94a3b8' }}>{question.source}</span>}
          {question.year && <span style={{ fontSize: '12px', color: '#94a3b8' }}>{question.year}/{question.month}</span>}
        </div>
        <div style={{ fontSize: '17px', color: '#1e3a5f', lineHeight: '1.75' }}>
          {question.content}
        </div>
        {question.imageUrl && (
          <img
            src={question.imageUrl}
            alt="题目图表"
            style={{ display: 'block', maxWidth: '600px', width: '100%', margin: '16px auto 0', borderRadius: 8, border: '1px solid #e2e8f0' }}
          />
        )}
      </div>

      {/* 三个按钮 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>

        {/* 看思路 */}
        <div onClick={() => !outlineLocked && setTab('outline')}
          style={{ flex: 1, minWidth: '140px', background: '#fff', borderRadius: '12px', padding: '16px 20px', cursor: outlineLocked ? 'not-allowed' : 'pointer', border: `2px solid ${tab === 'outline' ? '#3b82f6' : '#e8f0fe'}`, transition: 'all .15s', position: 'relative' }}
          onMouseEnter={(e) => { if (!outlineLocked) e.currentTarget.style.borderColor = '#3b82f6' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = tab === 'outline' ? '#3b82f6' : '#e8f0fe' }}>
          {outlineLocked && (
            <div style={{ position: 'absolute', top: '10px', right: '12px', fontSize: '11px', background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '6px', fontWeight: '500' }}>
              今日已用完
            </div>
          )}
          <div style={{ fontSize: '20px', marginBottom: '6px' }}>{outlineLocked ? '🔒' : '💡'}</div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: outlineLocked ? '#94a3b8' : '#1e3a5f' }}>看思路</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
            {outlineLocked
              ? '明天再来'
              : isSubscribed
                ? '不限次数'
                : `今日剩余 ${Math.max(0, DAILY_OUTLINE_LIMIT - todayCount)} 次`}
          </div>
        </div>

        {/* 查看范文 */}
        <div onClick={() => essays.length > 0 ? router.push(`/dashboard/essays/${essays[0].id}`) : router.push('/dashboard/essays')}
          style={{ flex: 1, minWidth: '140px', background: '#fff', borderRadius: '12px', padding: '16px 20px', cursor: 'pointer', border: '2px solid #e8f0fe', transition: 'all .15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e8f0fe' }}>
          <div style={{ fontSize: '20px', marginBottom: '6px' }}>📝</div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e3a5f' }}>查看范文</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
            {essays.length > 0 ? `${essays.length} 篇范文可查看` : '暂无范文'}
          </div>
        </div>

        {/* 写作练习 */}
        <div onClick={() => router.push(`/exam-room?questionId=${id}`)}
          style={{ flex: 1, minWidth: '140px', background: '#fff', borderRadius: '12px', padding: '16px 20px', cursor: 'pointer', border: '2px solid #e8f0fe', transition: 'all .15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e8f0fe' }}>
          <div style={{ fontSize: '20px', marginBottom: '6px' }}>✍️</div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e3a5f' }}>写作练习</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>前往模拟机考作答</div>
        </div>

      </div>

      {/* 思路内容 */}
      {tab === 'outline' && (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e8f0fe', overflow: 'hidden' }}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e3a5f' }}>💡 写作思路</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              {isSubscribed ? '订阅会员 · 不限次数' : `今日已看 ${todayCount}/${DAILY_OUTLINE_LIMIT}`}
            </div>
          </div>
          <div style={{ padding: '28px 32px', fontSize: '15px', color: '#334155', lineHeight: '1.9', whiteSpace: 'pre-wrap' }}>
            {question.outline || '暂无思路内容，管理员尚未添加。'}
          </div>
        </div>
      )}

    </div>
  )
}