'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'

const BASE_URL = 'http://localhost:4000'

interface Stat          { icon: string; value: string; label: string }
interface Teacher       { id: number; name: string; title: string; avatar: string; score: string; experience: string; background: string; specialty: string[] }
interface SuccessCase   { id: number; nickname: string; from: number; to: number; duration: string; comment: string; tag: string }
interface ContactMethod { icon: string; label: string; value: string; note: string }
interface AboutIntro    { title: string; description: string }
interface ContactConfig { wechat_service: { desc1: string; desc2: string; desc3: string }; wechat_public: { name: string; desc1: string; desc2: string }; email: string; email_note: string }
interface Notice        { id: number; type: string; title: string; content: string; date: string; sortOrder: number; visible: boolean }

const TABS = [
  { key: 'intro',    label: '平台简介', icon: '🎯' },
  { key: 'stats',    label: '数据统计', icon: '📊' },
  { key: 'teachers', label: '师资介绍', icon: '👩‍🏫' },
  { key: 'cases',    label: '学员案例', icon: '🎓' },
  { key: 'contact',  label: '联系方式', icon: '📬' },
  { key: 'notices',  label: '告示板',   icon: '📢' },
]

function SectionHeader({ title, onAdd }: { title: string; onAdd?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 4, height: 18, borderRadius: 2, background: '#1d4ed8' }} />
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1e3a5f' }}>{title}</span>
      </div>
      {onAdd && (
        <button onClick={onAdd} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + 新增
        </button>
      )}
    </div>
  )
}

function SaveBtn({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <button onClick={onClick} disabled={saving} style={{ padding: '10px 32px', borderRadius: 10, border: 'none', background: saving ? '#cbd5e1' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 12px rgba(29,78,216,.25)' }}>
      {saving ? '保存中...' : '保存'}
    </button>
  )
}

function Input({ label, value, onChange, placeholder, multiline }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  const base: React.CSSProperties = { width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 14, color: '#1e293b', outline: 'none', background: '#fafafa', boxSizing: 'border-box', fontFamily: 'inherit' }
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 5 }}>{label}</div>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4} style={{ ...base, resize: 'vertical', lineHeight: 1.7 }} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />
      }
    </div>
  )
}

function Card({ children, onDelete }: { children: React.ReactNode; onDelete?: () => void }) {
  return (
    <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', marginBottom: 12, position: 'relative' }}>
      {onDelete && (
        <button onClick={onDelete} style={{ position: 'absolute', top: 12, right: 12, width: 26, height: 26, borderRadius: 6, border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      )}
      {children}
    </div>
  )
}

function QRUploader({ label, value, keyName, onUploaded }: { label: string; value: string; keyName: string; onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await api.post(`/site-config/upload/${keyName}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onUploaded(res.data.url)
    } catch {
      alert('上传失败')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 100, height: 100, borderRadius: 10, border: '1.5px solid #e2e8f0', overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${BASE_URL}${value}`} alt="二维码" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 32, color: '#cbd5e1' }}>📷</span>
          )}
        </div>
        <div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: 13, cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 500 }}>
            {uploading ? '上传中...' : value ? '🔄 重新上传' : '📷 上传二维码'}
            <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </label>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>支持 JPG / PNG，建议 300×300px</div>
        </div>
      </div>
    </div>
  )
}

export default function SiteConfigPage() {
  const [activeTab, setActiveTab] = useState('intro')
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState('')

  const [intro,          setIntro]          = useState<AboutIntro>({ title: '雅思写作 PRO', description: '' })
  const [stats,          setStats]          = useState<Stat[]>([])
  const [teachers,       setTeachers]       = useState<Teacher[]>([])
  const [successCases,   setSuccessCases]   = useState<SuccessCase[]>([])
  const [contactMethods, setContactMethods] = useState<ContactMethod[]>([])
  const [contactConfig,  setContactConfig]  = useState<ContactConfig>({
    wechat_service: { desc1: '扫码添加客服微信', desc2: '添加时备注「学员」', desc3: '工作日 9:00 - 22:00 在线' },
    wechat_public:  { name: 'IELTSWritingPro', desc1: '关注公众号', desc2: '获取最新题目更新和学习资讯' },
    email: 'support@ieltspro.cn',
    email_note: '工作日 24 小时内回复，节假日 48 小时内回复',
  })
  const [qrWechat,       setQrWechat]       = useState('')
  const [qrPublic,       setQrPublic]       = useState('')
  const [notices,        setNotices]        = useState<Notice[]>([])
  const [noticeForm,     setNoticeForm]     = useState<Omit<Notice, 'id'>>({ type: 'notice', title: '', content: '', date: new Date().toISOString().slice(0, 10), sortOrder: 0, visible: true })
  const [editingNotice,  setEditingNotice]  = useState<Notice | null>(null)

  useEffect(() => {
    Promise.all([
      api.get('/site-config'),
      api.get('/notices/admin/all'),
    ]).then(([cfgRes, noticeRes]) => {
      const cfg = cfgRes.data
      if (cfg.about_intro)      setIntro(cfg.about_intro)
      if (cfg.stats)            setStats(cfg.stats)
      if (cfg.teachers)         setTeachers(cfg.teachers)
      if (cfg.success_cases)    setSuccessCases(cfg.success_cases)
      if (cfg.contact_methods)  setContactMethods(cfg.contact_methods)
      if (cfg.contact_config)   setContactConfig(cfg.contact_config)
      if (cfg.qr_wechat)        setQrWechat(cfg.qr_wechat)
      if (cfg.qr_public)        setQrPublic(cfg.qr_public)
      setNotices(noticeRes.data)
    }).catch(console.error)
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  async function saveConfig(key: string, value: unknown) {
    setSaving(true)
    try {
      await api.put(`/site-config/${key}`, { value })
      showToast('✅ 保存成功')
    } catch {
      showToast('❌ 保存失败')
    } finally {
      setSaving(false)
    }
  }

  function updateItem<T>(list: T[], setList: (v: T[]) => void, index: number, patch: Partial<T>) {
    const next = [...list]
    next[index] = { ...next[index], ...patch }
    setList(next)
  }
  function removeItem<T>(list: T[], setList: (v: T[]) => void, index: number) {
    setList(list.filter((_, i) => i !== index))
  }

  async function handleCreateNotice() {
    if (!noticeForm.title || !noticeForm.content) return
    try {
      const res = await api.post('/notices', noticeForm)
      setNotices(prev => [res.data, ...prev])
      setNoticeForm({ type: 'notice', title: '', content: '', date: new Date().toISOString().slice(0, 10), sortOrder: 0, visible: true })
      showToast('✅ 公告已创建')
    } catch { showToast('❌ 创建失败') }
  }

  async function handleUpdateNotice() {
    if (!editingNotice) return
    try {
      const res = await api.put(`/notices/${editingNotice.id}`, editingNotice)
      setNotices(prev => prev.map(n => n.id === editingNotice.id ? res.data : n))
      setEditingNotice(null)
      showToast('✅ 已更新')
    } catch { showToast('❌ 更新失败') }
  }

  async function handleDeleteNotice(id: number) {
    if (!confirm('确定删除这条公告？')) return
    try {
      await api.delete(`/notices/${id}`)
      setNotices(prev => prev.filter(n => n.id !== id))
      showToast('✅ 已删除')
    } catch { showToast('❌ 删除失败') }
  }

  async function handleToggleNotice(id: number) {
    try {
      const res = await api.patch(`/notices/${id}/visibility`)
      setNotices(prev => prev.map(n => n.id === id ? res.data : n))
    } catch { showToast('❌ 操作失败') }
  }

  const renderTab = () => {
    switch (activeTab) {

      case 'intro':
        return (
          <div>
            <SectionHeader title="平台简介" />
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '24px' }}>
              <Input label="标题" value={intro.title} onChange={v => setIntro({ ...intro, title: v })} placeholder="雅思写作 PRO" />
              <Input label="介绍文字" value={intro.description} onChange={v => setIntro({ ...intro, description: v })} multiline placeholder="平台介绍..." />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <SaveBtn onClick={() => saveConfig('about_intro', intro)} saving={saving} />
              </div>
            </div>
          </div>
        )

      case 'stats':
        return (
          <div>
            <SectionHeader title="数据统计" onAdd={() => setStats([...stats, { icon: '🎯', value: '', label: '' }])} />
            {stats.map((s, i) => (
              <Card key={i} onDelete={() => removeItem(stats, setStats, i)}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 12 }}>
                  <Input label="图标" value={s.icon} onChange={v => updateItem(stats, setStats, i, { icon: v })} placeholder="🎯" />
                  <Input label="数值" value={s.value} onChange={v => updateItem(stats, setStats, i, { value: v })} placeholder="2,400+" />
                  <Input label="标签" value={s.label} onChange={v => updateItem(stats, setStats, i, { label: v })} placeholder="累计学员" />
                </div>
              </Card>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <SaveBtn onClick={() => saveConfig('stats', stats)} saving={saving} />
            </div>
          </div>
        )

      case 'teachers':
        return (
          <div>
            <SectionHeader title="师资介绍" onAdd={() => setTeachers([...teachers, { id: Date.now(), name: '', title: '', avatar: '👩‍🏫', score: '', experience: '', background: '', specialty: [] }])} />
            {teachers.map((t, i) => (
              <Card key={t.id} onDelete={() => removeItem(teachers, setTeachers, i)}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input label="姓名" value={t.name} onChange={v => updateItem(teachers, setTeachers, i, { name: v })} placeholder="Sarah 老师" />
                  <Input label="职称" value={t.title} onChange={v => updateItem(teachers, setTeachers, i, { title: v })} placeholder="首席写作导师" />
                  <Input label="头像（emoji）" value={t.avatar} onChange={v => updateItem(teachers, setTeachers, i, { avatar: v })} placeholder="👩‍🏫" />
                  <Input label="分数标签" value={t.score} onChange={v => updateItem(teachers, setTeachers, i, { score: v })} placeholder="雅思写作 8.5" />
                  <Input label="经验标签" value={t.experience} onChange={v => updateItem(teachers, setTeachers, i, { experience: v })} placeholder="8年雅思教学经验" />
                </div>
                <Input label="背景介绍" value={t.background} onChange={v => updateItem(teachers, setTeachers, i, { background: v })} multiline placeholder="毕业于..." />
                <Input
                  label="专长标签（逗号分隔）"
                  value={t.specialty.join(',')}
                  onChange={v => updateItem(teachers, setTeachers, i, { specialty: v.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="Task 2 议论文,语法精讲,高分范文解析"
                />
              </Card>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <SaveBtn onClick={() => saveConfig('teachers', teachers)} saving={saving} />
            </div>
          </div>
        )

      case 'cases':
        return (
          <div>
            <SectionHeader title="学员成功案例" onAdd={() => setSuccessCases([...successCases, { id: Date.now(), nickname: '', from: 5.5, to: 7.0, duration: '', comment: '', tag: '' }])} />
            {successCases.map((c, i) => (
              <Card key={c.id} onDelete={() => removeItem(successCases, setSuccessCases, i)}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 1fr 1fr', gap: 12 }}>
                  <Input label="昵称" value={c.nickname} onChange={v => updateItem(successCases, setSuccessCases, i, { nickname: v })} placeholder="小雨同学" />
                  <Input label="原分" value={String(c.from)} onChange={v => updateItem(successCases, setSuccessCases, i, { from: parseFloat(v) || 0 })} placeholder="5.5" />
                  <Input label="现分" value={String(c.to)} onChange={v => updateItem(successCases, setSuccessCases, i, { to: parseFloat(v) || 0 })} placeholder="7.0" />
                  <Input label="用时" value={c.duration} onChange={v => updateItem(successCases, setSuccessCases, i, { duration: v })} placeholder="3个月" />
                  <Input label="标签" value={c.tag} onChange={v => updateItem(successCases, setSuccessCases, i, { tag: v })} placeholder="目标7分达成" />
                </div>
                <Input label="评语" value={c.comment} onChange={v => updateItem(successCases, setSuccessCases, i, { comment: v })} multiline placeholder="学员评价..." />
              </Card>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <SaveBtn onClick={() => saveConfig('success_cases', successCases)} saving={saving} />
            </div>
          </div>
        )

      case 'contact':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* 微信客服 */}
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '24px' }}>
              <SectionHeader title="微信客服" />
              <QRUploader label="客服二维码" value={qrWechat} keyName="qr_wechat" onUploaded={url => { setQrWechat(url); showToast('✅ 上传成功') }} />
              <Input label="第一行文字" value={contactConfig.wechat_service.desc1} onChange={v => setContactConfig({ ...contactConfig, wechat_service: { ...contactConfig.wechat_service, desc1: v } })} />
              <Input label="第二行文字" value={contactConfig.wechat_service.desc2} onChange={v => setContactConfig({ ...contactConfig, wechat_service: { ...contactConfig.wechat_service, desc2: v } })} />
              <Input label="第三行文字" value={contactConfig.wechat_service.desc3} onChange={v => setContactConfig({ ...contactConfig, wechat_service: { ...contactConfig.wechat_service, desc3: v } })} />
            </div>

            {/* 公众号 */}
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '24px' }}>
              <SectionHeader title="微信公众号" />
              <QRUploader label="公众号二维码" value={qrPublic} keyName="qr_public" onUploaded={url => { setQrPublic(url); showToast('✅ 上传成功') }} />
              <Input label="公众号名称" value={contactConfig.wechat_public.name} onChange={v => setContactConfig({ ...contactConfig, wechat_public: { ...contactConfig.wechat_public, name: v } })} />
              <Input label="第一行文字" value={contactConfig.wechat_public.desc1} onChange={v => setContactConfig({ ...contactConfig, wechat_public: { ...contactConfig.wechat_public, desc1: v } })} />
              <Input label="第二行文字" value={contactConfig.wechat_public.desc2} onChange={v => setContactConfig({ ...contactConfig, wechat_public: { ...contactConfig.wechat_public, desc2: v } })} />
            </div>

            {/* 邮箱 */}
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '24px' }}>
              <SectionHeader title="电子邮箱" />
              <Input label="邮箱地址" value={contactConfig.email} onChange={v => setContactConfig({ ...contactConfig, email: v })} placeholder="support@ieltspro.cn" />
              <Input label="说明文字" value={contactConfig.email_note} onChange={v => setContactConfig({ ...contactConfig, email_note: v })} placeholder="工作日 24 小时内回复..." />
            </div>

            {/* About 页联系方式列表 */}
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '24px' }}>
              <SectionHeader title="关于我们页 — 联系方式列表" onAdd={() => setContactMethods([...contactMethods, { icon: '💬', label: '', value: '', note: '' }])} />
              {contactMethods.map((m, i) => (
                <Card key={i} onDelete={() => removeItem(contactMethods, setContactMethods, i)}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', gap: 12 }}>
                    <Input label="图标" value={m.icon} onChange={v => updateItem(contactMethods, setContactMethods, i, { icon: v })} placeholder="💬" />
                    <Input label="标签" value={m.label} onChange={v => updateItem(contactMethods, setContactMethods, i, { label: v })} placeholder="微信公众号" />
                    <Input label="值" value={m.value} onChange={v => updateItem(contactMethods, setContactMethods, i, { value: v })} placeholder="IELTSWritingPro" />
                    <Input label="备注" value={m.note} onChange={v => updateItem(contactMethods, setContactMethods, i, { note: v })} placeholder="扫码关注..." />
                  </div>
                </Card>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <SaveBtn onClick={async () => {
                setSaving(true)
                try {
                  await Promise.all([
                    api.put('/site-config/contact_config',  { value: contactConfig }),
                    api.put('/site-config/contact_methods', { value: contactMethods }),
                  ])
                  showToast('✅ 保存成功')
                } catch { showToast('❌ 保存失败') }
                finally { setSaving(false) }
              }} saving={saving} />
            </div>
          </div>
        )

      case 'notices':
        return (
          <div>
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '24px', marginBottom: 20 }}>
              <SectionHeader title={editingNotice ? '编辑公告' : '新增公告'} />
              {(() => {
                const form = editingNotice ?? noticeForm
                const setForm = editingNotice
                  ? (patch: Partial<Notice>) => setEditingNotice({ ...editingNotice, ...patch })
                  : (patch: Partial<Omit<Notice, 'id'>>) => setNoticeForm({ ...noticeForm, ...patch })
                return (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 100px', gap: 12 }}>
                      <Input label="标题" value={form.title} onChange={v => setForm({ title: v })} placeholder="公告标题..." />
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 5 }}>类型</div>
                        <select value={form.type} onChange={e => setForm({ type: e.target.value })} style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 14, color: '#1e293b', background: '#fafafa', outline: 'none' }}>
                          <option value="notice">📢 公告</option>
                          <option value="update">🔄 更新</option>
                          <option value="tip">💡 建议</option>
                        </select>
                      </div>
                      <Input label="日期" value={form.date} onChange={v => setForm({ date: v })} placeholder="2026-03-20" />
                      <Input label="排序（越小越前）" value={String(form.sortOrder)} onChange={v => setForm({ sortOrder: parseInt(v) || 0 })} placeholder="0" />
                    </div>
                    <Input label="内容" value={form.content} onChange={v => setForm({ content: v })} multiline placeholder="公告内容..." />
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      {editingNotice && (
                        <button onClick={() => setEditingNotice(null)} style={{ padding: '9px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, cursor: 'pointer' }}>取消</button>
                      )}
                      <button
                        onClick={editingNotice ? handleUpdateNotice : handleCreateNotice}
                        style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                      >
                        {editingNotice ? '确认修改' : '创建公告'}
                      </button>
                    </div>
                  </>
                )
              })()}
            </div>

            <SectionHeader title={`全部公告（${notices.length}）`} />
            {notices.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 14 }}>暂无公告</div>
            )}
            {notices.map(n => (
              <div key={n.id} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, background: n.type === 'update' ? '#eff6ff' : n.type === 'tip' ? '#f0fdf4' : '#fffbeb', color: n.type === 'update' ? '#3b82f6' : n.type === 'tip' ? '#22c55e' : '#f59e0b', padding: '2px 8px', borderRadius: 4 }}>
                      {n.type === 'update' ? '更新' : n.type === 'tip' ? '建议' : '公告'}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{n.title}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{n.date}</span>
                    {!n.visible && <span style={{ fontSize: 11, background: '#f1f5f9', color: '#94a3b8', padding: '2px 8px', borderRadius: 4 }}>已隐藏</span>}
                  </div>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{n.content}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => handleToggleNotice(n.id)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>
                    {n.visible ? '隐藏' : '显示'}
                  </button>
                  <button onClick={() => setEditingNotice(n)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: 12, cursor: 'pointer' }}>编辑</button>
                  <button onClick={() => handleDeleteNotice(n.id)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff5f5', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>删除</button>
                </div>
              </div>
            ))}
          </div>
        )

      default: return null
    }
  }

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1.5px solid #bfdbfe', borderLeft: '5px solid #1d4ed8', borderRadius: 16, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1e3a5f', marginBottom: 4 }}>站点配置</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>管理关于我们、联系方式、告示板等前台展示内容</div>
        </div>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🌐</div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ padding: '8px 18px', borderRadius: 10, border: activeTab === t.key ? '1.5px solid #1d4ed8' : '1.5px solid #e2e8f0', background: activeTab === t.key ? '#eff6ff' : '#fff', color: activeTab === t.key ? '#1d4ed8' : '#64748b', fontWeight: activeTab === t.key ? 700 : 400, fontSize: 14, cursor: 'pointer', transition: 'all .15s' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {renderTab()}

      {toast && (
        <div style={{ position: 'fixed', bottom: 32, right: 32, background: '#1e293b', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}