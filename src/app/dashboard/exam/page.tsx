'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Question } from '@/types'
import { useLayoutStore } from '@/store/layoutStore'

const TASK2_SUBTYPES = ['程度同意', '报告', '优缺点', '双边']
const TASK1_SUBTYPES = ['线图', '表格', '柱状图', '混合图', '饼图', '流程图', '地图']
const TOPICS = ['教育', '科技', '环境', '社会', '健康', '经济', '文化', '交通', '媒体', '政府']
const YEARS = ['2025', '2024', '2023', '2022', '2021', '2020']

function ExamSelectContent() {
  const router = useRouter()
  const { collapsed } = useLayoutStore()
  const [questions, setQuestions] = useState<Question[]>([])
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [task, setTask] = useState<'TASK2' | 'TASK1'>('TASK2')
  const [subtype, setSubtype] = useState('')
  const [topic, setTopic] = useState('')
  const [year, setYear] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.append('task', task)
        if (subtype) params.append('subtype', subtype)
        if (topic) params.append('topic', topic)
        if (year) params.append('year', year)
        if (keyword) params.append('keyword', keyword)
        params.append('page', page.toString())
        params.append('limit', '20')
        const res = await api.get(`/questions?${params.toString()}`)
        setQuestions(res.data.questions)
        setTotal(res.data.total)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, subtype, topic, year, keyword, page])

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [r1, r2] = await Promise.all([
          api.get('/questions?limit=200&task=TASK2'),
          api.get('/questions?limit=200&task=TASK1'),
        ])
        setAllQuestions([...r1.data.questions, ...r2.data.questions])
      } catch (err) {
        console.error(err)
      }
    }
    fetchAll()
  }, [])

  const startMix = () => {
    const t2 = allQuestions.filter(q => q.task === 'TASK2')
    const t1 = allQuestions.filter(q => q.task === 'TASK1')
    if (!t2.length || !t1.length) return
    const mq = t2[Math.floor(Math.random() * t2.length)]
    const sq = t1[Math.floor(Math.random() * t1.length)]
    router.push(`/exam-room?questionId=${mq.id}&mixId=${sq.id}`)
  }

  const handleTaskSwitch = (t: 'TASK1' | 'TASK2') => {
    setTask(t); setSubtype(''); setTopic(''); setPage(1)
  }

  const handleSearch = () => { setKeyword(inputValue.trim()); setPage(1) }
  const handleClearSearch = () => { setInputValue(''); setKeyword(''); setPage(1) }

  const subtypes = task === 'TASK2' ? TASK2_SUBTYPES : TASK1_SUBTYPES

  return (
    <div style={{ maxWidth: collapsed ? '920px' : '100%', margin: collapsed ? '0 20% 0 5%' : '0', transition: 'all .2s ease' }}>

      {/* 页头 */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#1e3a5f' }}>模拟机考</div>
          <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>共 {total} 道真题，点击题目开始计时作答</div>
        </div>
        <button
          onClick={startMix}
          disabled={allQuestions.length === 0}
          style={{ padding: '11px 22px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 3px 10px rgba(99,102,241,.30)', flexShrink: 0 }}
        >
          🎲 随机混合模考（60分钟）
        </button>
      </div>

      {/* 搜索框 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#94a3b8', pointerEvents: 'none' }}>🔍</span>
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              placeholder="输入关键词搜索题目..."
              style={{ width: '100%', border: `1.5px solid ${keyword ? '#3b82f6' : '#e2e8f0'}`, borderRadius: 10, padding: '11px 40px 11px 42px', fontSize: 14, color: '#1e293b', outline: 'none', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color .15s' }}
              onFocus={e => e.target.style.borderColor = '#93c5fd'}
              onBlur={e => e.target.style.borderColor = keyword ? '#3b82f6' : '#e2e8f0'}
            />
            {inputValue && (
              <span onClick={handleClearSearch} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#94a3b8', cursor: 'pointer' }}>×</span>
            )}
          </div>
          <button onClick={handleSearch} style={{ padding: '11px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(59,130,246,.25)', flexShrink: 0 }}>搜索</button>
        </div>
        {keyword && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>搜索「<strong style={{ color: '#3b82f6' }}>{keyword}</strong>」共找到 {total} 条结果</span>
            <button onClick={handleClearSearch} style={{ fontSize: 12, color: '#94a3b8', background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '2px 10px', cursor: 'pointer' }}>清除</button>
          </div>
        )}
      </div>

      {/* Task 切换 */}
      <div style={{ display: 'flex', background: '#fff', borderRadius: 12, padding: 5, marginBottom: 24, width: 'fit-content', border: '1px solid #e8f0fe' }}>
        {(['TASK2', 'TASK1'] as const).map(t => (
          <div key={t} onClick={() => handleTaskSwitch(t)} style={{ padding: '10px 28px', borderRadius: 9, fontSize: 15, cursor: 'pointer', fontWeight: task === t ? 600 : 400, background: task === t ? '#3b82f6' : 'transparent', color: task === t ? '#fff' : '#64748b', transition: 'all .15s' }}>
            {t === 'TASK2' ? 'Task 2 大作文（40分钟）' : 'Task 1 小作文（20分钟）'}
          </div>
        ))}
      </div>

      {/* 题型筛选 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10, fontWeight: 600 }}>题型</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {subtypes.map(s => (
            <div key={s} onClick={() => { setSubtype(prev => prev === s ? '' : s); setPage(1) }}
              style={{ padding: '7px 18px', borderRadius: 20, fontSize: 14, cursor: 'pointer', background: subtype === s ? '#eff6ff' : '#fff', color: subtype === s ? '#3b82f6' : '#64748b', border: `1px solid ${subtype === s ? '#93c5fd' : '#e2e8f0'}`, fontWeight: subtype === s ? 600 : 400, transition: 'all .15s' }}>
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Task2 话题筛选 */}
      {task === 'TASK2' && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10, fontWeight: 600 }}>话题</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TOPICS.map(topic_item => (
              <div key={topic_item} onClick={() => { setTopic(prev => prev === topic_item ? '' : topic_item); setPage(1) }}
                style={{ padding: '7px 18px', borderRadius: 20, fontSize: 14, cursor: 'pointer', background: topic === topic_item ? '#f0fdf4' : '#fff', color: topic === topic_item ? '#16a34a' : '#64748b', border: `1px solid ${topic === topic_item ? '#86efac' : '#e2e8f0'}`, fontWeight: topic === topic_item ? 600 : 400, transition: 'all .15s' }}>
                {topic_item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task1 图表特征 */}
      {task === 'TASK1' && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10, fontWeight: 600 }}>图表特征</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['静态', '动态'].map(d => (
              <div key={d} onClick={() => { setTopic(prev => prev === d ? '' : d); setPage(1) }}
                style={{ padding: '7px 18px', borderRadius: 20, fontSize: 14, cursor: 'pointer', background: topic === d ? '#eff6ff' : '#fff', color: topic === d ? '#3b82f6' : '#64748b', border: `1px solid ${topic === d ? '#93c5fd' : '#e2e8f0'}`, fontWeight: topic === d ? 600 : 400, transition: 'all .15s' }}>
                {d}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 年份筛选 */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10, fontWeight: 600 }}>年份</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {YEARS.map(y => (
            <div key={y} onClick={() => { setYear(prev => prev === y ? '' : y); setPage(1) }}
              style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer', background: year === y ? '#f5f3ff' : '#fff', color: year === y ? '#7c3aed' : '#64748b', border: `1px solid ${year === y ? '#c4b5fd' : '#e2e8f0'}`, fontWeight: year === y ? 600 : 400, transition: 'all .15s' }}>
              {y}
            </div>
          ))}
        </div>
      </div>

      {/* 题目列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 15 }}>加载中...</div>
      ) : questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 15 }}>{keyword ? `没有找到与「${keyword}」相关的题目` : '暂无题目'}</div>
          {keyword && (
            <button onClick={handleClearSearch} style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#3b82f6', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>清除搜索</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {questions.map((q, index) => (
            <div
              key={q.id}
              onClick={() => router.push(`/exam-room?questionId=${q.id}`)}
              style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8f0fe', cursor: 'pointer', transition: 'all .15s', display: 'flex', gap: 16, alignItems: 'flex-start' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8f0fe'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#3b82f6', flexShrink: 0 }}>
                {index + 1 + (page - 1) * 20}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, color: '#1e3a5f', lineHeight: 1.7, marginBottom: 10 }}>{q.content}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  {q.subtype && <span style={{ fontSize: 12, background: '#eff6ff', color: '#3b82f6', padding: '3px 10px', borderRadius: 6, fontWeight: 500 }}>{q.subtype}</span>}
                  {q.topic && <span style={{ fontSize: 12, background: '#f0fdf4', color: '#16a34a', padding: '3px 10px', borderRadius: 6, fontWeight: 500 }}>{q.topic}</span>}
                  {q.source && <span style={{ fontSize: 12, color: '#94a3b8' }}>{q.source}</span>}
                  {q.year && <span style={{ fontSize: 12, color: '#94a3b8' }}>{q.year}/{q.month}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, alignSelf: 'center' }}>
                <div style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                  {task === 'TASK2' ? '40 分钟' : '20 分钟'}
                </div>
                <div style={{ background: '#3b82f6', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                  开始 ›
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1, fontSize: 14 }}>上一页</button>
          <span style={{ padding: '9px 16px', color: '#64748b', fontSize: 14 }}>第 {page} 页 / 共 {Math.ceil(total / 20)} 页</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)} style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: page >= Math.ceil(total / 20) ? 'not-allowed' : 'pointer', opacity: page >= Math.ceil(total / 20) ? 0.5 : 1, fontSize: 14 }}>下一页</button>
        </div>
      )}
    </div>
  )
}

export default function ExamPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>加载中...</div>}>
      <ExamSelectContent />
    </Suspense>
  )
}