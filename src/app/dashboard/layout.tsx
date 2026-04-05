'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useLayoutStore } from '@/store/layoutStore'
import api from '@/lib/api'

function NavContent({ user, pathname, onNav, onLogout, collapsed, onToggle }: {
  user: {
    id: number
    phone: string
    role: string
    subscription: string
    username?: string
  } | null
  pathname: string
  onNav: (path: string) => void
  onLogout: () => void
  collapsed: boolean
  onToggle: () => void
}) {
  const [studyOpen, setStudyOpen] = useState(
    pathname.startsWith('/dashboard/essays') ||
    pathname.startsWith('/dashboard/videos') ||
    pathname.startsWith('/dashboard/submit') ||
    pathname.startsWith('/dashboard/submissions')||
    pathname.startsWith('/dashboard/scores') ||
    pathname.startsWith('/dashboard/reflections') 
  )
  const [shopOpen, setShopOpen] = useState(
    pathname.startsWith('/dashboard/shop')
  )

  return (
    <>
      <div style={{
        padding: collapsed ? '20px 0' : '24px 20px 16px',
        borderBottom: '1px solid #e8f0fe',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        flexShrink: 0,
      }}>
        {!collapsed && (
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#1d4ed8' }}>雅思写作</div>
            <div style={{ fontSize: '10px', color: '#93c5fd', letterSpacing: '0.5px', marginTop: '2px' }}>IELTS WRITING PRO</div>
          </div>
        )}
        <button onClick={onToggle} style={{
          width: '32px', height: '32px', borderRadius: '8px',
          border: '1px solid #e8f0fe', background: '#f8faff',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '14px', color: '#64748b', flexShrink: 0,
        }}>
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {!collapsed && (
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e8f0fe', cursor: 'pointer', flexShrink: 0 }}
          onClick={() => onNav('/dashboard/profile')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: '#dbeafe', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '15px', flexShrink: 0,
            }}>👤</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontSize: '14px', fontWeight: '600', color: '#1e3a5f',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{user?.username || '加载中...'}</div>
              <span style={{
                fontSize: '10px',
                background: user?.subscription === 'PRO' ? '#dbeafe' : user?.subscription === 'BASIC' ? '#dcfce7' : '#f1f5f9',
                color: user?.subscription === 'PRO' ? '#1d4ed8' : user?.subscription === 'BASIC' ? '#16a34a' : '#64748b',
                padding: '1px 7px', borderRadius: '10px', fontWeight: '600',
              }}>
                {user?.subscription === 'PRO' ? '高级会员' : user?.subscription === 'BASIC' ? '基础会员' : '免费用户'}
              </span>
            </div>
          </div>
        </div>
      )}

      {collapsed && (
        <div style={{
          padding: '14px 0', borderBottom: '1px solid #e8f0fe',
          display: 'flex', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
        }} onClick={() => onNav('/dashboard/profile')}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: '#dbeafe', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '15px',
          }}>👤</div>
        </div>
      )}

      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', minHeight: 0 }}>
        <NavItem icon="📚" label="真题库" path="/dashboard/questions" pathname={pathname} onNav={onNav} collapsed={collapsed} />
        <NavItem icon="💻" label="模拟机考" path="/dashboard/exam" pathname={pathname} onNav={onNav} collapsed={collapsed} />

        <Divider collapsed={collapsed} />

        {collapsed ? (
          <>
            <NavItem icon="📝" label="范文精选" path="/dashboard/essays" pathname={pathname} onNav={onNav} collapsed={collapsed} />
            <NavItem icon="🎬" label="视频课" path="/dashboard/videos" pathname={pathname} onNav={onNav} collapsed={collapsed} />
            <NavItem icon="✏️" label="提交批改" path="/dashboard/submit" pathname={pathname} onNav={onNav} collapsed={collapsed} />
            <NavItem icon="📋" label="我的批改" path="/dashboard/submissions" pathname={pathname} onNav={onNav} collapsed={collapsed} />
            <NavItem icon="📊" label="我的分数" path="/dashboard/scores" pathname={pathname} onNav={onNav} collapsed={collapsed} />
            <NavItem icon="📖" label="积累反思" path="/dashboard/reflections" pathname={pathname} onNav={onNav} collapsed={false} />
          </>
        ) : (
          <>
            <div onClick={() => setStudyOpen(o => !o)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 12px', borderRadius: '10px', cursor: 'pointer',
              marginBottom: '1px', transition: 'all .15s',
              background: studyOpen ? '#f8faff' : 'transparent',
              color: studyOpen ? '#1d4ed8' : '#5a7a9f',
              fontWeight: studyOpen ? '600' : '400', fontSize: '14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '17px', width: '22px', textAlign: 'center' }}>📖</span>
                <span>备考学习</span>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'inline-block', transform: studyOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .15s' }}>›</span>
            </div>
            {studyOpen && (
              <div style={{ paddingLeft: '12px', marginBottom: '2px' }}>
                <NavItem icon="📝" label="范文精选" path="/dashboard/essays" pathname={pathname} onNav={onNav} collapsed={false} />
                <NavItem icon="🎬" label="视频课" path="/dashboard/videos" pathname={pathname} onNav={onNav} collapsed={false} />
                <NavItem icon="✏️" label="提交批改" path="/dashboard/submit" pathname={pathname} onNav={onNav} collapsed={false} />
                <NavItem icon="📋" label="我的批改" path="/dashboard/submissions" pathname={pathname} onNav={onNav} collapsed={false} />
                <NavItem icon="📊" label="我的分数" path="/dashboard/scores" pathname={pathname} onNav={onNav} collapsed={false} />
                <NavItem icon="📖" label="积累反思" path="/dashboard/reflections" pathname={pathname} onNav={onNav} collapsed={collapsed} />
              </div>
            )}
          </>
        )}

        <Divider collapsed={collapsed} />

        {collapsed ? (
          <>
            <NavItem icon="🛍️" label="资料购买" path="/dashboard/shop" pathname={pathname} onNav={onNav} collapsed={collapsed} exact />
            <NavItem icon="✏️" label="购买批改" path="/dashboard/shop/corrections" pathname={pathname} onNav={onNav} collapsed={collapsed} />
            <NavItem icon="🛒" label="购物车" path="/dashboard/shop/cart" pathname={pathname} onNav={onNav} collapsed={collapsed} />
            <NavItem icon="📦" label="购买记录" path="/dashboard/shop/orders" pathname={pathname} onNav={onNav} collapsed={collapsed} />
          </>
        ) : (
          <>
            <div onClick={() => setShopOpen(o => !o)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 12px', borderRadius: '10px', cursor: 'pointer',
              marginBottom: '1px', transition: 'all .15s',
              background: shopOpen ? '#f8faff' : 'transparent',
              color: shopOpen ? '#1d4ed8' : '#5a7a9f',
              fontWeight: shopOpen ? '600' : '400', fontSize: '14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '17px', width: '22px', textAlign: 'center' }}>🛍️</span>
                <span>资料商城</span>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'inline-block', transform: shopOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .15s' }}>›</span>
            </div>
            {shopOpen && (
              <div style={{ paddingLeft: '12px', marginBottom: '2px' }}>
                <NavItem icon="🛍️" label="资料购买" path="/dashboard/shop" pathname={pathname} onNav={onNav} collapsed={false} exact />
                <NavItem icon="✏️" label="购买批改" path="/dashboard/shop/corrections" pathname={pathname} onNav={onNav} collapsed={false} />
                <NavItem icon="🛒" label="购物车" path="/dashboard/shop/cart" pathname={pathname} onNav={onNav} collapsed={false} />
                <NavItem icon="📦" label="购买记录" path="/dashboard/shop/orders" pathname={pathname} onNav={onNav} collapsed={false} />
              </div>
            )}
          </>
        )}

        <Divider collapsed={collapsed} />

        <NavItem icon="💎" label="订阅方案" path="/dashboard/pricing" pathname={pathname} onNav={onNav} collapsed={collapsed} />
        <NavItem icon="👤" label="个人主页" path="/dashboard/profile" pathname={pathname} onNav={onNav} collapsed={collapsed} />
        <NavItem icon="📞" label="联系客服" path="/dashboard/contact" pathname={pathname} onNav={onNav} collapsed={collapsed} />
        <NavItem icon="ℹ️" label="关于我们" path="/dashboard/about" pathname={pathname} onNav={onNav} collapsed={collapsed} />
      </nav>

      <div style={{ padding: '12px 8px', borderTop: '1px solid #e8f0fe', flexShrink: 0 }}>
        <div onClick={onLogout} title={collapsed ? '退出登录' : ''}
          style={{
            display: 'flex', alignItems: 'center',
            gap: collapsed ? '0' : '10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '10px 0' : '10px 12px',
            borderRadius: '10px', cursor: 'pointer', color: '#94a3b8', fontSize: '14px',
          }}>
          <span style={{ fontSize: '18px' }}>🚪</span>
          {!collapsed && <span>退出登录</span>}
        </div>
      </div>
    </>
  )
}

function NavItem({ icon, label, path, pathname, onNav, collapsed, exact }: {
  icon: string
  label: string
  path: string
  pathname: string
  onNav: (path: string) => void
  collapsed: boolean
  exact?: boolean
}) {
  const isActive = exact ? pathname === path : pathname === path || pathname.startsWith(path + '/')
  return (
    <div onClick={() => onNav(path)} title={collapsed ? label : ''}
      style={{
        display: 'flex', alignItems: 'center',
        gap: collapsed ? '0' : '10px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '10px 0' : '9px 12px',
        borderRadius: '10px', marginBottom: '1px', cursor: 'pointer',
        transition: 'all .15s',
        background: isActive ? '#eff6ff' : 'transparent',
        color: isActive ? '#1d4ed8' : '#5a7a9f',
        fontWeight: isActive ? '600' : '400', fontSize: '14px',
      }}>
      <span style={{ fontSize: '17px', width: '22px', textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      {!collapsed && <span>{label}</span>}
      {!collapsed && isActive && (
        <div style={{ marginLeft: 'auto', width: '4px', height: '4px', borderRadius: '50%', background: '#3b82f6' }} />
      )}
    </div>
  )
}

function Divider({ collapsed }: { collapsed: boolean }) {
  return <div style={{ height: 1, background: '#f1f5f9', margin: collapsed ? '6px 8px' : '6px 4px' }} />
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, setAuth, logout } = useAuthStore()
  const { collapsed, setCollapsed, hideLayout } = useLayoutStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    if (!user) {
      api.get('/auth/me').then((res) => {
        setAuth(res.data, token)
      }).catch(() => {
        logout()
        router.push('/login')
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogout = () => { logout(); router.push('/login') }
  const handleNav = (path: string) => { router.push(path); setSidebarOpen(false) }
  const sidebarWidth = collapsed ? 64 : 220
  const mainPadding = collapsed ? '32px 108px 32px 120px' : '32px 40px'

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .dashboard-root { display: flex; min-height: 100vh; background: #f4f7fe; }
        .sidebar-desktop {
          height: 100vh; background: #fff;
          border-right: 1px solid #e8f0fe;
          display: flex; flex-direction: column;
          position: fixed; top: 0; left: 0; z-index: 100;
          transition: width .2s ease;
          overflow: hidden;
        }
        .main-content { flex: 1; min-height: 100vh; transition: margin-left .2s ease; overflow: hidden; }
        .topbar-mobile { display: none; }
        .sidebar-overlay { display: none; }
        .sidebar-mobile { display: none; }

        @media (max-width: 768px) {
          .sidebar-desktop { display: none; }
          .main-content { margin-left: 0 !important; }
          .main-inner { padding: 72px 16px 32px !important; }
          .topbar-mobile {
            display: flex; position: fixed;
            top: 0; left: 0; right: 0; height: 56px;
            background: #fff; border-bottom: 1px solid #e8f0fe;
            align-items: center; padding: 0 16px; z-index: 200; gap: 12px;
          }
          .hamburger { width: 36px; height: 36px; background: #eff6ff; border: none; border-radius: 8px; cursor: pointer; font-size: 18px; }
          .sidebar-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 300; }
          .sidebar-mobile { display: flex; flex-direction: column; position: fixed; top: 0; left: 0; width: 260px; height: 100vh; background: #fff; z-index: 400; box-shadow: 4px 0 20px rgba(0,0,0,0.1); animation: slideIn .2s ease; }
          @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        }
      `}</style>

      <div className="dashboard-root">
        {!hideLayout && (
          <aside className="sidebar-desktop" style={{ width: `${sidebarWidth}px` }}>
            <NavContent
              user={user} pathname={pathname}
              onNav={handleNav} onLogout={handleLogout}
              collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)}
            />
          </aside>
        )}

        {!hideLayout && (
          <div className="topbar-mobile">
            <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1d4ed8', flex: 1 }}>雅思写作</div>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>👤</div>
          </div>
        )}

        {!hideLayout && sidebarOpen && (
          <>
            <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            <aside className="sidebar-mobile">
              <NavContent
                user={user} pathname={pathname}
                onNav={handleNav} onLogout={handleLogout}
                collapsed={false} onToggle={() => setSidebarOpen(false)}
              />
            </aside>
          </>
        )}

        <main className="main-content" style={{ marginLeft: hideLayout ? '0' : `${sidebarWidth}px` }}>
          {hideLayout ? (
            <>{children}</>
          ) : (
            <>
              {collapsed && (
                <div style={{
                  position: 'fixed', left: `${sidebarWidth}px`, right: 0,
                  top: 0, bottom: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden',
                }}>
                  {[
                    { text: 'IELTS Writing 7', size: 28, top: '6%', left: '3%', rotate: -12 },
                    { text: '雅思 7.5', size: 36, top: '4%', left: '38%', rotate: 8 },
                    { text: 'IELTS 8', size: 24, top: '3%', left: '70%', rotate: -6 },
                    { text: 'IELTS Writing 7.5', size: 22, top: '18%', left: '62%', rotate: 14 },
                    { text: '雅思 8', size: 40, top: '22%', left: '18%', rotate: -10 },
                    { text: 'Band 7.5', size: 30, top: '35%', left: '78%', rotate: 5 },
                    { text: 'IELTS Writing 8', size: 26, top: '42%', left: '5%', rotate: -15 },
                    { text: '雅思 6.5', size: 34, top: '55%', left: '45%', rotate: 11 },
                    { text: 'IELTS 7.5', size: 28, top: '60%', left: '72%', rotate: -7 },
                    { text: 'IELTS Writing 6.5', size: 22, top: '68%', left: '12%', rotate: 9 },
                    { text: 'Band 8', size: 38, top: '74%', left: '58%', rotate: -13 },
                    { text: '雅思 7', size: 32, top: '80%', left: '28%', rotate: 6 },
                    { text: 'IELTS 6.5', size: 26, top: '86%', left: '70%', rotate: -9 },
                    { text: 'IELTS Writing 8.5', size: 24, top: '90%', left: '4%', rotate: 12 },
                    { text: 'Band 9', size: 42, top: '48%', left: '32%', rotate: -5 },
                  ].map((w, i) => (
                    <div key={i} style={{
                      position: 'absolute', fontSize: `${w.size}px`, fontWeight: '900',
                      color: '#dbeafe', transform: `rotate(${w.rotate}deg)`,
                      top: w.top, left: w.left, fontFamily: 'Georgia, serif',
                      userSelect: 'none', whiteSpace: 'nowrap',
                    }}>{w.text}</div>
                  ))}
                </div>
              )}
              <div
                className="main-inner"
                style={{
                  position: 'relative', zIndex: 1,
                  padding: mainPadding,
                  transition: 'padding .2s ease',
                }}
              >
                {children}
              </div>
            </>
          )}
        </main>
      </div>
    </>
  )
}