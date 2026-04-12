'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useLayoutStore } from '@/store/layoutStore'
import { Question, Essay } from '@/types'
import { useAuthStore } from '@/store/authStore'

const DAILY_OUTLINE_LIMIT = 4

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
  const [userLoaded, setUserLoaded] = useState(false)
  const [outlineViewed, setOutlineViewed] = useState(false) // 本次已记录过
  const { user } = useAuthStore()
  const isSubscribed = user?.role === 'ADMIN' || user?.subscription === 'BASIC' || user?.subscription === 'PRO'

  // 数据加载
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
  }, [id])

  // 等 user 加载完，只查次数，不消耗
  useEffect(() => {
    if (user === undefined) return
    setUserLoaded(true)

    if (isSubscribed) {
      setOutlineUnlocked(true)
      return
    }

    // 免费用户：只查今日已用次数，判断是否还有余量
    api.get('/outline-view-log/today')
      .then(res => {
        const count = res.data.count || 0
        setTodayCount(count)
        setOutlineUnlocked(count < DAILY_OUTLINE_LIMIT)
      })
      .catch(() => {
        setOutlineUnlocked(true)
      })
  }, [user, isSubscribed])

  // 点击「看思路」按钮
  const handleClickOutline = () => {
    if (outlineLocked) return
    setTab('outline')

    // 订阅用户不计数
    if (isSubscribed) return

    // 免费用户：只在本次会话第一次点击时记录
    if (!outlineViewed) {
      setOutlineViewed(true)
      api.post('/outline-view-log/record')
        .then(res => {
          setTodayCount(res.data.count)
          // 如果用完了，下次进这道题就锁住
          if (res.data.count >= DAILY_OUTLINE_LIMIT) {
            // 本次已经看了，不立刻锁，让用户看完当前这次
          }
        })
        .catch(() => {})
    }
  }

  if (loading || !userLoaded) return (
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
        <div
          onClick={handleClickOutline}
          style={{ flex: 1, minWidth: '140px', background: '#fff', borderRadius: '12px', padding: '16px 20px', cursor: outlineLocked ? 'not-allowed' : 'pointer', border: `2px solid ${tab === 'outline' && !outlineLocked ? '#3b82f6' : '#e8f0fe'}`, transition: 'all .15s', position: 'relative' }}
          onMouseEnter={(e) => { if (!outlineLocked) e.currentTarget.style.borderColor = '#3b82f6' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = tab === 'outline' && !outlineLocked ? '#3b82f6' : '#e8f0fe' }}>
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
        outlineLocked ? (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e8f0fe', overflow: 'hidden' }}>
            <div style={{ padding: '60px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>今日思路查看次数已用完</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>明天可继续查看，或升级订阅享受不限次数</div>
              <button
                onClick={() => router.push('/dashboard/pricing')}
                style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                升级订阅 →
              </button>
            </div>
          </div>
        ) : (
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
        )
      )}

    </div>
  )
}