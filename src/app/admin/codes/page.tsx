'use client'
import { useState, useEffect } from 'react'
import { useLayoutStore } from '@/store/layoutStore'
import api from '@/lib/api'

type CodeType = 'TASK1' | 'TASK2' | 'ANY'

interface CorrectionCode {
  id: number
  code: string
  type: CodeType
  isUsed: boolean
  usedAt?: string
  createdAt: string
  user?: { id: number; phone: string; username: string }
}

export default function AdminCodesPage() {
  const { collapsed } = useLayoutStore()
  const [codes, setCodes] = useState<CorrectionCode[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [filterUsed, setFilterUsed] = useState('')
  const [genType, setGenType] = useState<CodeType>('ANY')
  const [genCount, setGenCount] = useState(10)
  const [generating, setGenerating] = useState(false)
  const [newCodes, setNewCodes] = useState<CorrectionCode[]>([])
  const [copied, setCopied] = useState(false)
  const limit = 15

  const fetchCodes = () => {
    setLoading(true)
    const params: Record<string, string> = { page: String(page), limit: String(limit) }
    if (filterType) params.type = filterType
    if (filterUsed !== '') params.isUsed = filterUsed
    api.get('/correction-codes', { params })
      .then(res => { setCodes(res.data.codes || []); setTotal(res.data.total || 0) })
      .finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchCodes() }, [page, filterType, filterUsed])

  const handleGenerate = async () => {
    setGenerating(true)
    setNewCodes([])
    try {
      const res = await api.post('/correction-codes/generate', { type: genType, count: genCount })
      setNewCodes(res.data.codes)
      fetchCodes()
    } catch { alert('生成失败') }
    finally { setGenerating(false) }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(newCodes.map(c => c.code).join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const totalPages = Math.ceil(total / limit)

  const typeStyle: Record<string, React.CSSProperties> = {
    TASK1: { background: '#eff6ff', color: '#1d4ed8' },
    TASK2: { background: '#f0fdf4', color: '#166534' },
    ANY:   { background: '#f5f3ff', color: '#7c3aed' },
  }

  return (
    <div style={{ maxWidth: '100%' }}>

      {/* 页头 */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        border: '1.5px solid #bfdbfe', borderLeft: '5px solid #1d4ed8',
        borderRadius: 16, padding: '24px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e3a5f', marginBottom: 6 }}>批改码管理</h1>
          <div style={{ fontSize: 15, color: '#64748b' }}>
            共 <strong style={{ color: '#1d4ed8' }}>{total}</strong> 条批改码
          </div>
        </div>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
        }}>🎟️</div>
      </div>

      {/* 生成区域 */}
      <div style={{ background: '#fff', border: '1.5px solid #e8f0fe', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1e3a5f', marginBottom: 16 }}>生成批改码</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>类型</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['TASK1', 'TASK2', 'ANY'] as CodeType[]).map(t => (
                <div key={t} onClick={() => setGenType(t)} style={{
                  padding: '8px 18px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                  fontWeight: genType === t ? 600 : 400,
                  background: genType === t ? '#eff6ff' : '#fff',
                  color: genType === t ? '#1d4ed8' : '#64748b',
                  border: `1.5px solid ${genType === t ? '#bfdbfe' : '#e2e8f0'}`,
                  transition: 'all .15s',
                }}>{t}</div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>数量（1-100）</div>
            <input type="number" min={1} max={100} value={genCount}
              onChange={e => setGenCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
              style={{ width: 100, padding: '10px 14px', fontSize: 14, borderRadius: 8, border: '1.5px solid #e8f0fe', background: '#f8faff', color: '#1e3a5f', outline: 'none' }} />
          </div>
          <button onClick={handleGenerate} disabled={generating} style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            color: '#fff', fontWeight: 600, fontSize: 14,
            cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1,
          }}>{generating ? '生成中...' : '生成'}</button>
        </div>

        {newCodes.length > 0 && (
          <div style={{ marginTop: 20, background: '#f8fafc', borderRadius: 10, padding: '16px 20px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>已生成 {newCodes.length} 条</span>
              <button onClick={handleCopy} style={{
                padding: '6px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                background: '#fff', color: copied ? '#16a34a' : '#1d4ed8',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>{copied ? '✓ 已复制' : '复制全部'}</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {newCodes.map(c => (
                <span key={c.id} style={{ fontSize: 13, fontFamily: 'monospace', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', color: '#1e293b' }}>{c.code}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 筛选栏 */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center',
        background: '#fff', border: '1.5px solid #e8f0fe',
        borderRadius: 12, padding: '12px 16px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ label: '全部类型', value: '' }, { label: 'TASK1', value: 'TASK1' }, { label: 'TASK2', value: 'TASK2' }, { label: 'ANY', value: 'ANY' }].map(opt => (
            <div key={opt.value} onClick={() => { setFilterType(opt.value); setPage(1) }} style={{
              padding: '8px 18px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              fontWeight: filterType === opt.value ? 600 : 400,
              background: filterType === opt.value ? '#eff6ff' : '#fff',
              color: filterType === opt.value ? '#1d4ed8' : '#64748b',
              border: `1.5px solid ${filterType === opt.value ? '#bfdbfe' : '#e2e8f0'}`,
              transition: 'all .15s',
            }}>{opt.label}</div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ label: '全部状态', value: '' }, { label: '未使用', value: 'false' }, { label: '已使用', value: 'true' }].map(opt => (
            <div key={opt.value} onClick={() => { setFilterUsed(opt.value); setPage(1) }} style={{
              padding: '8px 18px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              fontWeight: filterUsed === opt.value ? 600 : 400,
              background: filterUsed === opt.value ? '#f0fdf4' : '#fff',
              color: filterUsed === opt.value ? '#16a34a' : '#64748b',
              border: `1.5px solid ${filterUsed === opt.value ? '#86efac' : '#e2e8f0'}`,
              transition: 'all .15s',
            }}>{opt.label}</div>
          ))}
        </div>
      </div>

      {/* 列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 16 }}>加载中...</div>
      ) : codes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
          暂无批改码
        </div>
      ) : collapsed ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {codes.map(c => (
            <div key={c.id} style={{ background: '#fff', border: '1.5px solid #e8f0fe', borderRadius: 14, padding: '18px 20px' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8faff')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{c.code}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 600, ...typeStyle[c.type] }}>{c.type}</span>
                  <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: c.isUsed ? '#fef2f2' : '#f0fdf4', color: c.isUsed ? '#ef4444' : '#16a34a' }}>{c.isUsed ? '已使用' : '未使用'}</span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>
                {c.user ? `使用者：${c.user.username}（${c.user.phone}）· ` : ''}
                {new Date(c.createdAt).toLocaleDateString('zh-CN')}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1.5px solid #e8f0fe', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #f8faff, #eff6ff)' }}>
                {['批改码', '类型', '状态', '使用者', '生成时间'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#64748b', borderBottom: '1.5px solid #e8f0fe', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < codes.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8faff')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: 15, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>{c.code}</td>
                  <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20, fontWeight: 600, ...typeStyle[c.type] }}>{c.type}</span>
                  </td>
                  <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20, fontWeight: 600, background: c.isUsed ? '#fef2f2' : '#f0fdf4', color: c.isUsed ? '#ef4444' : '#16a34a' }}>{c.isUsed ? '已使用' : '未使用'}</span>
                  </td>
                  <td style={{ padding: '16px', fontSize: 14, color: '#374151' }}>{c.user ? `${c.user.username}（${c.user.phone}）` : '—'}</td>
                  <td style={{ padding: '16px', fontSize: 14, color: '#94a3b8', whiteSpace: 'nowrap' }}>{new Date(c.createdAt).toLocaleDateString('zh-CN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e8f0fe', background: page === 1 ? '#f8faff' : '#fff', color: page === 1 ? '#94a3b8' : '#1d4ed8', fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 14 }}>← 上一页</button>
          <span style={{ padding: '8px 16px', fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center' }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e8f0fe', background: page === totalPages ? '#f8faff' : '#fff', color: page === totalPages ? '#94a3b8' : '#1d4ed8', fontWeight: 600, cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 14 }}>下一页 →</button>
        </div>
      )}
    </div>
  )
}