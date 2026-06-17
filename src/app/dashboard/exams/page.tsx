'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { ExamSession } from '@/types'
import { useLayoutStore } from '@/store/layoutStore'

function wordCount(text: string | null) {
  return text?.trim() ? text.trim().split(/\s+/).length : 0
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, seconds || 0)
  const minutes = Math.floor(safeSeconds / 60)
  const rest = safeSeconds % 60
  return `${minutes} 分 ${rest} 秒`
}

function statusLabel(status: ExamSession['status']) {
  if (status === 'COMPLETED') return '已完成'
  if (status === 'ABANDONED') return '已中断'
  return '进行中'
}

function statusStyle(status: ExamSession['status']) {
  if (status === 'COMPLETED') return { background: '#dcfce7', color: '#166534', border: '#bbf7d0' }
  if (status === 'ABANDONED') return { background: '#fef2f2', color: '#dc2626', border: '#fecaca' }
  return { background: '#fffbeb', color: '#b45309', border: '#fde68a' }
}

export default function ExamHistoryPage() {
  const router = useRouter()
  const { collapsed } = useLayoutStore()
  const [items, setItems] = useState<ExamSession[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | ExamSession['status']>('ALL')

  useEffect(() => {
    api.get('/exam-sessions/my')
      .then(response => setItems(response.data || []))
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const completed = items.filter(item => item.status === 'COMPLETED').length
    const inProgress = items.filter(item => item.status === 'IN_PROGRESS').length
    const words = items.reduce((sum, item) => sum + wordCount(item.primaryAnswer) + wordCount(item.secondaryAnswer), 0)
    const minutes = Math.round(items.reduce((sum, item) => sum + (item.elapsedSeconds || 0), 0) / 60)
    return { completed, inProgress, words, minutes }
  }, [items])

  const filteredItems = useMemo(() => {
    if (filter === 'ALL') return items
    return items.filter(item => item.status === filter)
  }, [filter, items])

  const shellStyle: React.CSSProperties = {
    maxWidth: collapsed ? 980 : '100%',
    margin: collapsed ? '0 auto 60px' : '0 0 60px',
    transition: 'max-width .2s ease, margin .2s ease',
  }

  return (
    <div style={shellStyle}>
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        border: '1.5px solid #bfdbfe',
        borderLeft: '5px solid #1d4ed8',
        borderRadius: 16,
        padding: '24px 28px',
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e3a5f', margin: '0 0 6px' }}>模考记录</h1>
          <div style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6 }}>
            每次模考的题目、用时、字数和作文内容都会保存在这里。
          </div>
        </div>
        <button
          onClick={() => router.push('/dashboard/exam')}
          style={{
            border: 'none',
            borderRadius: 10,
            padding: '11px 20px',
            background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(37,99,235,.18)',
          }}
        >
          + 开始新模考
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 12,
        marginBottom: 16,
      }}>
        {[
          ['全部记录', items.length, '#eff6ff', '#1d4ed8'],
          ['已完成', stats.completed, '#f0fdf4', '#15803d'],
          ['进行中', stats.inProgress, '#fffbeb', '#b45309'],
          ['累计字数', stats.words, '#f5f3ff', '#7c3aed'],
        ].map(([label, value, bg, color]) => (
          <div key={label} style={{
            background: '#fff',
            border: '1.5px solid #e8f0fe',
            borderRadius: 12,
            padding: '16px 18px',
            minHeight: 82,
          }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                minWidth: 38,
                height: 38,
                borderRadius: 10,
                background: String(bg),
                color: String(color),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
              }}>
                {label === '累计字数' ? 'W' : '✓'}
              </span>
              <strong style={{ fontSize: 22, color: '#1e3a5f', lineHeight: 1 }}>{value}</strong>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        border: '1.5px solid #e8f0fe',
        borderRadius: 12,
        padding: '12px 16px',
        marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            ['ALL', '全部'],
            ['COMPLETED', '已完成'],
            ['IN_PROGRESS', '进行中'],
            ['ABANDONED', '已中断'],
          ].map(([key, label]) => {
            const active = filter === key
            return (
              <button
                key={key}
                onClick={() => setFilter(key as typeof filter)}
                style={{
                  border: `1.5px solid ${active ? '#bfdbfe' : '#e8f0fe'}`,
                  background: active ? '#eff6ff' : '#fff',
                  color: active ? '#1d4ed8' : '#64748b',
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>累计练习 {stats.minutes} 分钟</div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 16 }}>加载中...</div>
      ) : filteredItems.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 60,
          color: '#64748b',
          fontSize: 15,
          background: '#fff',
          border: '1.5px solid #e8f0fe',
          borderRadius: 14,
        }}>
          暂无符合条件的模考记录。
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredItems.map(item => {
            const currentStatus = statusStyle(item.status)
            const totalWords = wordCount(item.primaryAnswer) + wordCount(item.secondaryAnswer)
            const isMixed = item.mode === 'MIXED'
            return (
              <div
                key={item.id}
                onClick={() => router.push(`/dashboard/exams/${item.id}`)}
                style={{
                  background: '#fff',
                  border: '1.5px solid #e8f0fe',
                  borderRadius: 14,
                  padding: '20px 24px',
                  cursor: 'pointer',
                  transition: 'background .15s, border-color .15s, box-shadow .15s',
                }}
                onMouseEnter={event => {
                  event.currentTarget.style.background = '#f8faff'
                  event.currentTarget.style.borderColor = '#bfdbfe'
                  event.currentTarget.style.boxShadow = '0 10px 24px rgba(37,99,235,.08)'
                }}
                onMouseLeave={event => {
                  event.currentTarget.style.background = '#fff'
                  event.currentTarget.style.borderColor = '#e8f0fe'
                  event.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
                      <span style={{
                        fontSize: 13,
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontWeight: 700,
                        background: isMixed ? '#f5f3ff' : '#eff6ff',
                        color: isMixed ? '#7c3aed' : '#1d4ed8',
                      }}>
                        {isMixed ? '完整模考' : item.primaryQuestion.task}
                      </span>
                      {item.primaryQuestion.subtype && (
                        <span style={{ fontSize: 13, padding: '4px 10px', borderRadius: 20, background: '#f8fafc', color: '#475569', fontWeight: 600 }}>
                          {item.primaryQuestion.subtype}
                        </span>
                      )}
                      {item.primaryQuestion.topic && (
                        <span style={{ fontSize: 13, padding: '4px 10px', borderRadius: 20, background: '#f0fdf4', color: '#166534', fontWeight: 600 }}>
                          {item.primaryQuestion.topic}
                        </span>
                      )}
                      <span style={{
                        fontSize: 13,
                        padding: '4px 10px',
                        borderRadius: 20,
                        border: `1px solid ${currentStatus.border}`,
                        background: currentStatus.background,
                        color: currentStatus.color,
                        fontWeight: 700,
                      }}>
                        {statusLabel(item.status)}
                      </span>
                    </div>

                    <div style={{
                      fontSize: 15,
                      color: '#1e3a5f',
                      lineHeight: 1.65,
                      fontWeight: 600,
                      marginBottom: 12,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {item.primaryQuestion.content}
                    </div>

                    <div style={{ display: 'flex', gap: 16, color: '#64748b', fontSize: 13, flexWrap: 'wrap' }}>
                      <span>用时：{formatDuration(item.elapsedSeconds)}</span>
                      <span>字数：{totalWords} 词</span>
                      <span>开始：{new Date(item.startedAt || item.createdAt).toLocaleString('zh-CN')}</span>
                      {item.secondaryQuestion && <span>含 {item.secondaryQuestion.task}</span>}
                    </div>
                  </div>

                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    flexShrink: 0,
                    fontWeight: 700,
                  }}>
                    →
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 900px) {
          div[style*="repeat(4"] {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 560px) {
          div[style*="repeat(4"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
