'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import BgWords from '@/app/(auth)/BgWords'
import { useLayoutStore } from '@/store/layoutStore'

function AdminNavItem({
  icon, label, path, pathname, onClick, collapsed,
}: {
  icon: string; label: string; path: string; pathname: string
  onClick: (p: string) => void; collapsed: boolean
}) {
  const isActive = pathname === path || pathname.startsWith(path + '/')
  return (
    <div
      onClick={() => onClick(path)}
      title={collapsed ? label : ''}
      style={{
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '10px 0' : '9px 12px',
        borderRadius: 10, marginBottom: 2, cursor: 'pointer',
        background: isActive ? '#eff6ff' : 'transparent',
        color: isActive ? '#1d4ed8' : '#5a7a9f',
        fontWeight: isActive ? 600 : 400, fontSize: 14,
        transition: 'all .15s',
      }}
    >
      <span style={{ fontSize: 17, width: 22, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      {!collapsed && <span>{label}</span>}
      {!collapsed && isActive && (
        <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: '#3b82f6' }} />
      )}
    </div>
  )
}

function Divider({ collapsed }: { collapsed: boolean }) {
  return <div style={{ height: 1, background: '#f1f5f9', margin: collapsed ? '6px 8px' : '6px 4px' }} />
}

const navItems = [
  { icon: '📊', label: '数据概览',   path: '/admin' },
  { icon: '✏️', label: '批改工作台', path: '/admin/submissions' },
  { icon: '🔑', label: '批改码管理', path: '/admin/codes' },
  { icon: '📚', label: '真题管理',   path: '/admin/questions' },
  { icon: '📝', label: '范文管理',   path: '/admin/essays' },
  { icon: '🎬', label: '视频管理',   path: '/admin/videos' },
  { icon: '👥', label: '用户管理',   path: '/admin/users' },
  { icon: '💬', label: '留言反馈',   path: '/admin/messages' },
  { icon: '🌐', label: '站点配置',   path: '/admin/site' },  // ← 加这一行
  { icon: '👤', label: '我的信息',   path: '/admin/profile' },
]

const dividerBefore = new Set([1, 3, 7, 8, 9])

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, setAuth, logout } = useAuthStore()
  const { collapsed, setCollapsed } = useLayoutStore()
  const [checking, setChecking] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true

    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }

    if (user) {
      if (user.role !== 'ADMIN') { router.push('/dashboard'); return }
      setChecking(false)
      return
    }

    api.get('/auth/me').then((res) => {
      setAuth(res.data, token)
      if (res.data.role !== 'ADMIN') {
        router.push('/dashboard')
      } else {
        setChecking(false)
      }
    }).catch(() => {
      logout()
      router.push('/login')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleNav = (path: string) => { router.push(path); setSidebarOpen(false) }
  const handleLogout = () => { logout(); router.push('/login') }
  const sidebarWidth = collapsed ? 64 : 220

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* Logo */}
      <div style={{
        padding: collapsed && !isMobile ? '20px 0' : '24px 20px 16px',
        borderBottom: '1px solid #e8f0fe',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
        flexShrink: 0,
      }}>
        {(!collapsed || isMobile) && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1d4ed8', letterSpacing: '-0.3px' }}>
              IELTS Writing
            </div>
            <div style={{ fontSize: 10, color: '#f59e0b', letterSpacing: '1px', marginTop: 2, fontWeight: 700 }}>
              ADMIN PORTAL
            </div>
          </div>
        )}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: '1px solid #e8f0fe', background: '#f8faff',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 14, color: '#64748b', flexShrink: 0,
            }}>
            {collapsed ? '→' : '←'}
          </button>
        )}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: '1px solid #e8f0fe', background: '#f8faff',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 14, color: '#64748b', flexShrink: 0,
            }}>
            ✕
          </button>
        )}
      </div>

      {/* Admin info */}
      <div
        onClick={() => handleNav('/admin/profile')}
        style={{
          padding: collapsed && !isMobile ? '12px 0' : '14px 20px',
          borderBottom: '1px solid #e8f0fe',
          display: 'flex', justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
          flexShrink: 0, cursor: 'pointer',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: '#fef3c7', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 16, flexShrink: 0,
          }}>🛡️</div>
          {(!collapsed || isMobile) && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: '#1e3a5f',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.username || 'Admin'}
              </div>
              <span style={{
                fontSize: 10, background: '#fef3c7', color: '#92400e',
                padding: '1px 7px', borderRadius: 10, fontWeight: 700,
              }}>ADMIN</span>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', minHeight: 0 }}>
        {navItems.map((item, i) => (
          <div key={item.path}>
            {dividerBefore.has(i) && <Divider collapsed={collapsed && !isMobile} />}
            <AdminNavItem
              icon={item.icon}
              label={item.label}
              path={item.path}
              pathname={pathname}
              onClick={handleNav}
              collapsed={collapsed && !isMobile}
            />
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid #e8f0fe', flexShrink: 0 }}>
        <div
          onClick={() => handleNav('/dashboard')}
          title={collapsed && !isMobile ? '返回用户端' : ''}
          style={{
            display: 'flex', alignItems: 'center',
            gap: collapsed && !isMobile ? 0 : 10,
            justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
            padding: collapsed && !isMobile ? '10px 0' : '9px 12px',
            borderRadius: 10, cursor: 'pointer', color: '#3b82f6',
            fontSize: 14, marginBottom: 2,
          }}>
          <span style={{ fontSize: 17 }}>↩️</span>
          {(!collapsed || isMobile) && <span>返回用户端</span>}
        </div>
        <div
          onClick={handleLogout}
          title={collapsed && !isMobile ? '退出登录' : ''}
          style={{
            display: 'flex', alignItems: 'center',
            gap: collapsed && !isMobile ? 0 : 10,
            justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
            padding: collapsed && !isMobile ? '10px 0' : '9px 12px',
            borderRadius: 10, cursor: 'pointer', color: '#94a3b8', fontSize: 14,
          }}>
          <span style={{ fontSize: 17 }}>🚪</span>
          {(!collapsed || isMobile) && <span>退出登录</span>}
        </div>
      </div>
    </>
  )

  if (checking) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#f4f7fe', color: '#94a3b8', fontSize: 15,
      }}>
        验证权限中...
      </div>
    )
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .admin-root { display: flex; min-height: 100vh; background: #f4f7fe; }
        .admin-sidebar {
          height: 100vh; background: #fff;
          border-right: 1px solid #e8f0fe;
          display: flex; flex-direction: column;
          position: fixed; top: 0; left: 0; z-index: 100;
          transition: width .2s ease; overflow: hidden;
        }
        .admin-main { flex: 1; min-height: 100vh; transition: margin-left .2s ease; overflow: hidden; }
        .admin-topbar { display: none; }
        .admin-overlay { display: none; }
        .admin-sidebar-mobile { display: none; }

        .admin-sidebar nav { scrollbar-width: thin; scrollbar-color: transparent transparent; }
        .admin-sidebar nav::-webkit-scrollbar { width: 4px; }
        .admin-sidebar nav::-webkit-scrollbar-track { background: transparent; }
        .admin-sidebar nav::-webkit-scrollbar-thumb { background: transparent; border-radius: 4px; transition: background .2s; }
        .admin-sidebar nav:hover::-webkit-scrollbar-thumb { background: #e8f0fe; }

        @media (max-width: 1024px) {
          .admin-sidebar { display: none; }
          .admin-main { margin-left: 0 !important; }
          .admin-inner { padding: 72px 20px 32px !important; }
          .admin-topbar {
            display: flex; position: fixed;
            top: 0; left: 0; right: 0; height: 56px;
            background: #fff; border-bottom: 1px solid #e8f0fe;
            align-items: center; padding: 0 16px; z-index: 200; gap: 12px;
          }
          .admin-hamburger {
            width: 36px; height: 36px; background: #eff6ff;
            border: none; border-radius: 8px; cursor: pointer; font-size: 18px;
          }
          .admin-overlay {
            display: block; position: fixed; inset: 0;
            background: rgba(0,0,0,0.3); z-index: 300;
          }
          .admin-sidebar-mobile {
            display: flex; flex-direction: column;
            position: fixed; top: 0; left: 0; width: 260px; height: 100vh;
            background: #fff; z-index: 400;
            box-shadow: 4px 0 20px rgba(0,0,0,0.1);
            animation: slideIn .2s ease;
          }
          @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        }

        @media (max-width: 768px) {
          .admin-inner { padding: 72px 16px 32px !important; }
        }

        .bg-canvas { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
        .bg-word {
          position: absolute; font-weight: 900; color: #dbeafe;
          font-family: Georgia, serif; user-select: none; white-space: nowrap;
          transform: rotate(var(--rotate)); opacity: 0.85;
        }
        @keyframes float-up-down {
          0%, 100% { transform: rotate(var(--rotate)) translateY(0px); }
          50% { transform: rotate(var(--rotate)) translateY(-12px); }
        }
      `}</style>

      <div className="admin-root">

        <aside className="admin-sidebar" style={{ width: sidebarWidth }}>
          <SidebarContent />
        </aside>

        <div className="admin-topbar">
          <button className="admin-hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1d4ed8', flex: 1 }}>IELTS Writing</div>
          <span style={{
            fontSize: 10, background: '#fef3c7', color: '#92400e',
            padding: '2px 8px', borderRadius: 10, fontWeight: 700,
          }}>ADMIN</span>
        </div>

        {sidebarOpen && (
          <>
            <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />
            <aside className="admin-sidebar-mobile">
              <SidebarContent isMobile />
            </aside>
          </>
        )}

        <main className="admin-main" style={{ marginLeft: sidebarWidth }}>
          {collapsed && (
            <div style={{
              position: 'fixed',
              left: sidebarWidth, right: 0, top: 0, bottom: 0,
              zIndex: 0, pointerEvents: 'none', overflow: 'hidden',
            }}>
              <BgWords />
            </div>
          )}
          <div
            className="admin-inner"
            style={{
              position: 'relative', zIndex: 1,
              padding: collapsed ? '32px 320px 32px 180px' : '32px 40px',
              transition: 'padding .2s ease',
            }}
          >
            {children}
          </div>
        </main>

      </div>
    </>
  )
}