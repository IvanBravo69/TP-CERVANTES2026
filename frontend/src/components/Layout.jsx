import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/dashboard',   icon: 'bi-speedometer2',          label: 'Dashboard',    always: true },
  { to: '/clientes',    icon: 'bi-people',                 label: 'Clientes',     perm: 'VER_CLIENTES' },
  { to: '/propiedades', icon: 'bi-building',               label: 'Propiedades',  perm: 'VER_PROPIEDADES' },
  { to: '/agentes',     icon: 'bi-person-badge',           label: 'Agentes',      perm: 'VER_AGENTES' },
  { to: '/contratos',   icon: 'bi-file-earmark-text',      label: 'Contratos',    perm: 'VER_CONTRATOS' },
  { to: '/servicios',   icon: 'bi-lightning-charge',       label: 'Servicios',    perm: 'VER_SERVICIOS' },
  // { to: '/cobros',      icon: 'bi-arrow-down-circle',      label: 'Cobros',       perm: 'VER_FINANZAS' },
  // { to: '/pagos',       icon: 'bi-arrow-up-circle',        label: 'Pagos',        perm: 'VER_FINANZAS' },
  // { to: '/recibos',     icon: 'bi-receipt',                label: 'Recibos',      perm: 'VER_RECIBOS' },
  // { to: '/honorarios',  icon: 'bi-percent',                label: 'Honorarios',   perm: 'VER_HONORARIOS' },
  { to: '/reportes',    icon: 'bi-bar-chart',              label: 'Reportes',     perm: 'VER_REPORTES' },
]

const ADMIN_NAV = [
  { to: '/usuarios', icon: 'bi-person-gear',  label: 'Usuarios', perm: 'VER_USUARIOS' },
  { to: '/roles',    icon: 'bi-shield-lock',  label: 'Roles',    perm: 'VER_ROLES' },
]

export default function Layout() {
  const { user, logout, has } = useAuth()
  const navigate = useNavigate()
  const initials = (user?.username || 'U').slice(0, 2).toUpperCase()

  function handleLogout(e) {
    e.preventDefault()
    logout()
    navigate('/login')
  }

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon"><i className="bi bi-buildings-fill" /></div>
          <div className="sidebar-brand-text">
            <h6>Sistema Britos</h6>
            <small>Gestión Inmobiliaria</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">Menú</div>
          {NAV.filter(n => n.always || has(n.perm)).map(n => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <i className={`bi ${n.icon}`} /> {n.label}
            </NavLink>
          ))}

          {ADMIN_NAV.some(n => has(n.perm)) && (
            <>
              <div className="sidebar-section">Administración</div>
              {ADMIN_NAV.filter(n => has(n.perm)).map(n => (
                <NavLink key={n.to} to={n.to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
                  <i className={`bi ${n.icon}`} /> {n.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name">{user?.full_name || user?.username}</div>
              <div className="sidebar-user-role">{user?.role || ''}</div>
            </div>
          </div>
          <a href="#" className="sidebar-link" onClick={handleLogout}>
            <i className="bi bi-box-arrow-left" /> Cerrar sesión
          </a>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="topbar">
          <span className="topbar-title">
            {NAV.concat(ADMIN_NAV).find(n => location.pathname.startsWith(n.to))?.label || 'Sistema Britos'}
          </span>
          <div className="topbar-user">
            <div>
              <div className="topbar-user-name">{user?.full_name || user?.username}</div>
              <div className="topbar-user-role">{user?.role || ''}</div>
            </div>
            <div className="topbar-avatar">{initials}</div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </>
  )
}
