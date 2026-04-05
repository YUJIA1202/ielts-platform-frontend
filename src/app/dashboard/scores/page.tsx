'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLayoutStore } from '@/store/layoutStore'
import api from '@/lib/api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

interface Submission {
  id: number
  status: string
  createdAt: string
  overallScore: number | null
  taScore: number | null
  ccScore: number | null
  lrScore: number | null
  graScore: number | null
  reviewTask: string | null
  reviewSubtype: string | null
  question: { task: string; subtype: string | null; content: string } | null
  customPrompt: string | null
}

type ScoreKey = 'overallScore' | 'taScore' | 'ccScore' | 'lrScore' | 'graScore'

const SCORE_OPTIONS: { key: ScoreKey; label: string }[] = [
  { key: 'overallScore', label: '综合分' },
  { key: 'taScore',      label: 'TA'     },
  { key: 'ccScore',      label: 'CC'     },
  { key: 'lrScore',      label: 'LR'     },
  { key: 'graScore',     label: 'GRA'    },
]

const TASK2_SUBTYPES = ['全部', '程度同意', '报告', '优缺点', '双边']
const TASK1_SUBTYPES = ['全部', '线图', '表格', '柱状图', '混合图', '饼图', '流程图', '地图']

function getSubtype(s: Submission): string | null {
  return s.question?.subtype ?? s.reviewSubtype ?? null
}

function getTask(s: Submission): string | null {
  return s.question?.task ?? s.reviewTask ?? null
}

/* ─── 最新评分卡片 ─── */
function LatestScoreCard({ submission }: { submission: Submission | null }) {
  const dims = [
    { label: 'TA',  value: submission?.taScore  ?? null, icon: '🎯', desc: '任务回应', bg: '#eff6ff', border: '#bfdbfe' },
    { label: 'CC',  value: submission?.ccScore  ?? null, icon: '🔗', desc: '连贯衔接', bg: '#f0fdf4', border: '#bbf7d0' },
    { label: 'LR',  value: submission?.lrScore  ?? null, icon: '📚', desc: '词汇资源', bg: '#faf5ff', border: '#e9d5ff' },
    { label: 'GRA', value: submission?.graScore ?? null, icon: '✏️', desc: '语法范围', bg: '#fff7ed', border: '#fed7aa' },
  ]

  return (
    <div style={{
      background: '#fff',
      padding: '20px 24px',
      marginBottom: 20,
      display: 'flex', alignItems: 'stretch',
      boxShadow: '0 2px 12px rgba(59,130,246,0.06)',
    }}>

      {/* 综合分 */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        paddingRight: 28, marginRight: 28,
        borderRight: '1px solid #e8f0fe',
        minWidth: 80, flexShrink: 0,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: '#eff6ff',
          border: '1.5px solid #bfdbfe',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 8px', fontSize: 18,
        }}>⭐</div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3, fontWeight: 700, letterSpacing: 0.5 }}>总分</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#1e3a5f', lineHeight: 1 }}>
          {submission?.overallScore != null ? submission.overallScore.toFixed(1) : '—'}
        </div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>综合评分</div>
      </div>

      {/* 四维分 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
        {dims.map(d => (
          <div key={d.label} style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: d.value != null ? d.bg : '#f8fafc',
              border: `1.5px solid ${d.value != null ? d.border : '#e2e8f0'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 8px', fontSize: 18,
              boxShadow: d.value != null ? `0 2px 8px ${d.border}80` : 'none',
            }}>{d.icon}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3, fontWeight: 700, letterSpacing: 0.5 }}>{d.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: d.value != null ? '#1e3a5f' : '#cbd5e1', lineHeight: 1 }}>
              {d.value != null ? d.value.toFixed(1) : '—'}
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{d.desc}</div>
          </div>
        ))}
      </div>

      {/* 批改时间 */}
      {submission && (
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingLeft: 20, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            {new Date(submission.createdAt).toLocaleDateString('zh-CN')}
          </span>
        </div>
      )}
    </div>
  )
}
/* ─── TaskPanel ─── */
function TaskPanel({ task, submissions }: { task: 'TASK2' | 'TASK1'; submissions: Submission[] }) {
  const router = useRouter()
  const subtypes = task === 'TASK2' ? TASK2_SUBTYPES : TASK1_SUBTYPES
  const [subtypeFilter, setSubtypeFilter] = useState('全部')
  const [activeScore, setActiveScore] = useState<ScoreKey>('overallScore')

  const allReviewed = submissions
    .filter(s => s.status === 'REVIEWED' && s.overallScore !== null)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const filtered = allReviewed.filter(s => {
    if (subtypeFilter === '全部') return true
    return getSubtype(s) === subtypeFilter
  })

  const latest = filtered[filtered.length - 1] ?? null
  const best   = filtered.reduce<Submission | null>((acc, s) =>
    (!acc || (s.overallScore ?? 0) > (acc.overallScore ?? 0)) ? s : acc, null)
  const avg    = filtered.length > 0
    ? filtered.reduce((sum, s) => sum + (s.overallScore ?? 0), 0) / filtered.length
    : null

  const chartData = filtered.map((s, i) => ({
    index:   i + 1,
    date:    new Date(s.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
    value:   s[activeScore],
    preview: (s.question?.content || s.customPrompt || '').slice(0, 28),
  }))

  const noRecords  = allReviewed.length === 0
  const noFiltered = filtered.length === 0

  return (
    <div>
      {/* 题型筛选 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10, fontWeight: 600 }}>题型筛选</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {subtypes.map(s => (
            <div
              key={s}
              onClick={() => setSubtypeFilter(s)}
              style={{
                padding: '7px 18px', borderRadius: 20, fontSize: 14, cursor: 'pointer',
                background: subtypeFilter === s ? '#eff6ff' : '#fff',
                color: subtypeFilter === s ? '#3b82f6' : '#64748b',
                border: `1px solid ${subtypeFilter === s ? '#93c5fd' : '#e2e8f0'}`,
                fontWeight: subtypeFilter === s ? 600 : 400,
                transition: 'all .15s',
              }}
            >{s}</div>
          ))}
        </div>
      </div>

      {noRecords ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
          <div style={{ fontSize: 15 }}>暂无已批改记录</div>
        </div>
      ) : noFiltered ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 15 }}>该题型暂无已批改记录</div>
        </div>
      ) : (
        <>
          {/* 统计卡片行 */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { label: '最高综合分', value: best?.overallScore ?? null,                          isCount: false },
              { label: '平均综合分', value: avg !== null ? Math.round(avg * 10) / 10 : null,     isCount: false },
              { label: '已批改',     value: filtered.length,                                     isCount: true  },
            ].map(card => (
              <div key={card.label} style={{
                flex: 1, minWidth: 110,
                background: '#fff', borderRadius: 14,
                border: '1px solid #e8f0fe',
                padding: '18px 20px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>{card.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#1e3a5f', lineHeight: 1 }}>
                  {card.value !== null
                    ? card.isCount ? `${card.value}次` : Number(card.value).toFixed(1)
                    : '—'}
                </div>
              </div>
            ))}
          </div>

          {/* 最新评分卡片 */}
          <LatestScoreCard submission={latest} />

          {/* 折线图卡片 */}
          <div style={{
            background: '#fff', borderRadius: 14,
            border: '1px solid #e8f0fe',
            padding: '20px 20px 12px',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, marginRight: 4 }}>显示维度</span>
              {SCORE_OPTIONS.map(opt => (
                <div
                  key={opt.key}
                  onClick={() => setActiveScore(opt.key)}
                  style={{
                    padding: '5px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                    background: activeScore === opt.key ? '#eff6ff' : '#f8fafc',
                    color: activeScore === opt.key ? '#3b82f6' : '#64748b',
                    border: `1px solid ${activeScore === opt.key ? '#93c5fd' : '#e2e8f0'}`,
                    fontWeight: activeScore === opt.key ? 600 : 400,
                    transition: 'all .15s',
                  }}
                >{opt.label}</div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 9]}
                  ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10, border: '1.5px solid #e8f0fe',
                    fontSize: 13, boxShadow: '0 4px 16px rgba(59,130,246,0.08)',
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [
                    value != null ? Number(value).toFixed(1) : '—',
                    SCORE_OPTIONS.find(o => o.key === activeScore)?.label,
                  ]}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  labelFormatter={(_: any, payload: readonly any[]) => {
                    const item = payload?.[0]?.payload
                    return item ? `第${item.index}次  ${item.preview}...` : ''
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#2563eb' }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 全部记录列表 */}
          <div>
            <div style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600, marginBottom: 12 }}>
              全部记录（共 {filtered.length} 次）
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...filtered].reverse().map((s, i) => {
                const subtype = getSubtype(s)
                const isCustom = !s.question && !!s.customPrompt
                return (
                  <div
                    key={s.id}
                    onClick={() => router.push(`/dashboard/submissions/${s.id}`)}
                    style={{
                      background: '#fff', borderRadius: 14,
                      border: `1px solid ${i === 0 ? '#bfdbfe' : '#e8f0fe'}`,
                      padding: '16px 20px',
                      display: 'flex', alignItems: 'center', gap: 16,
                      cursor: 'pointer',
                      transition: 'all .15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#93c5fd'
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.10)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = i === 0 ? '#bfdbfe' : '#e8f0fe'
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.transform = 'none'
                    }}
                  >
                    {/* 序号 */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: i === 0 ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#f8fafc',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700,
                      color: i === 0 ? '#fff' : '#94a3b8',
                      boxShadow: i === 0 ? '0 2px 8px rgba(59,130,246,0.25)' : 'none',
                    }}>
                      #{filtered.length - i}
                    </div>

                    {/* 综合分 */}
                    <div style={{
                      fontSize: 22, fontWeight: 800, color: '#1e3a5f',
                      minWidth: 40, textAlign: 'center', flexShrink: 0,
                    }}>
                      {s.overallScore?.toFixed(1) ?? '—'}
                    </div>

                    {/* 题目 + 标签 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, color: '#1e3a5f', fontWeight: 500, lineHeight: 1.6,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {s.question?.content || s.customPrompt || '自定义题目'}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                        {subtype && (
                          <span style={{
                            fontSize: 12, background: '#eff6ff', color: '#3b82f6',
                            padding: '2px 8px', borderRadius: 6, fontWeight: 500,
                          }}>{subtype}</span>
                        )}
                        {isCustom && (
                          <span style={{
                            fontSize: 12, background: '#f5f3ff', color: '#7c3aed',
                            padding: '2px 8px', borderRadius: 6, fontWeight: 500,
                          }}>自定义</span>
                        )}
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>
                          {new Date(s.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>

                    {/* 四维分 */}
                    <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
                      {[
                        { label: 'TA',  value: s.taScore  },
                        { label: 'CC',  value: s.ccScore  },
                        { label: 'LR',  value: s.lrScore  },
                        { label: 'GRA', value: s.graScore },
                      ].map(dim => (
                        <div key={dim.label} style={{ textAlign: 'center', minWidth: 30 }}>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{dim.label}</div>
                          <div style={{
                            fontSize: 15, fontWeight: 700,
                            color: dim.value != null ? '#334155' : '#cbd5e1',
                          }}>
                            {dim.value?.toFixed(1) ?? '—'}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 箭头 */}
                    <div style={{ color: '#cbd5e1', fontSize: 20, flexShrink: 0 }}>›</div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ─── 主页面 ─── */
export default function ScoresPage() {
  const { collapsed } = useLayoutStore()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'TASK2' | 'TASK1'>('TASK2')

  useEffect(() => {
    api.get('/submissions/my')
      .then(res => setSubmissions(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const task2 = submissions.filter(s => getTask(s) === 'TASK2' || (!s.question && !s.reviewTask && s.customPrompt))
  const task1 = submissions.filter(s => getTask(s) === 'TASK1')

  const reviewedCount = (list: Submission[]) => list.filter(s => s.status === 'REVIEWED').length

  return (
    <div style={{
      maxWidth: collapsed ? 920 : '100%',
      margin: collapsed ? '0 20% 60px 5%' : '0 0 60px',
      transition: 'all .2s ease',
    }}>

      {/* 页头 */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#1e3a5f' }}>我的分数</div>
        <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>追踪每次批改后的分数变化趋势</div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 15 }}>加载中...</div>
        </div>
      ) : submissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: '#1e3a5f', marginBottom: 8 }}>还没有批改记录</div>
          <div style={{ fontSize: 14, marginBottom: 24 }}>提交作文并完成批改后，分数趋势将在这里展示</div>
          <a href="/dashboard/submit" style={{
            padding: '10px 24px', borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff', fontWeight: 600, fontSize: 14,
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(59,130,246,.25)',
          }}>去提交作文 →</a>
        </div>
      ) : (
        <>
          {/* Tab 切换 */}
          <div style={{
            display: 'flex', background: '#fff', borderRadius: 12,
            padding: 5, marginBottom: 28, width: 'fit-content',
            border: '1px solid #e8f0fe',
          }}>
            {([
              { key: 'TASK2' as const, label: 'Task 2 大作文', count: reviewedCount(task2) },
              { key: 'TASK1' as const, label: 'Task 1 小作文', count: reviewedCount(task1) },
            ]).map(tab => (
              <div
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 28px', borderRadius: 9, fontSize: 15, cursor: 'pointer',
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  background: activeTab === tab.key ? '#3b82f6' : 'transparent',
                  color: activeTab === tab.key ? '#fff' : '#64748b',
                  transition: 'all .15s',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {tab.label}
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  padding: '1px 7px', borderRadius: 10,
                  background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                  color: activeTab === tab.key ? '#fff' : '#94a3b8',
                }}>
                  {tab.count}
                </span>
              </div>
            ))}
          </div>

          {activeTab === 'TASK2'
            ? <TaskPanel key="task2" task="TASK2" submissions={task2} />
            : <TaskPanel key="task1" task="TASK1" submissions={task1} />
          }
        </>
      )}
    </div>
  )
}