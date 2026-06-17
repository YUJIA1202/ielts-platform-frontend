'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { ExamSession } from '@/types'

function wordCount(text: string | null) {
  return text?.trim() ? text.trim().split(/\s+/).length : 0
}

export default function ExamHistoryPage() {
  const router = useRouter()
  const [items, setItems] = useState<ExamSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/exam-sessions/my')
      .then(response => setItems(response.data || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: 980, margin: '0 auto 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, color: '#1e3a5f' }}>模考记录</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>每次考试的题目、用时和作文都会保存在这里。</p>
        </div>
        <button onClick={() => router.push('/dashboard/questions')} style={{ border: 0, borderRadius: 10, padding: '10px 18px', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
          开始新模考
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>加载中...</div>
      ) : items.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, color: '#64748b' }}>还没有模考记录。</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => router.push(`/dashboard/exams/${item.id}`)}
              style={{ width: '100%', textAlign: 'left', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 8 }}>
                <strong style={{ color: '#1e3a5f', fontSize: 15 }}>{item.primaryQuestion.content}</strong>
                <span style={{ color: item.status === 'COMPLETED' ? '#16a34a' : '#d97706', fontSize: 12, fontWeight: 700 }}>
                  {item.status === 'COMPLETED' ? '已交卷' : '未完成'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, color: '#64748b', fontSize: 12, flexWrap: 'wrap' }}>
                <span>{item.mode === 'MIXED' ? '混合模考' : item.primaryQuestion.task}</span>
                <span>{Math.floor(item.elapsedSeconds / 60)} 分钟</span>
                <span>{wordCount(item.primaryAnswer) + wordCount(item.secondaryAnswer)} 词</span>
                <span>{new Date(item.createdAt).toLocaleString('zh-CN')}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
