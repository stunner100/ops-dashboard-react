import { NavLink, useLocation } from 'react-router-dom';
import {
  Layers,
  Activity,
  Library,
  MessageSquare,
  Inbox,
  Shield,
  X,
  Target,
  FileBarChart2,
  LayoutDashboard,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { Logo } from '../Logo';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Overview', href: '/', icon: Layers },
  { name: 'KPIs', href: '/kpi', icon: Activity },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Reports', href: '/reports', icon: FileBarChart2 },
  { name: 'Library', href: '/sop', icon: Library },
  { name: 'Team Chat', href: '/chat', icon: MessageSquare },
  { name: 'Inbox', href: '/notifications', icon: Inbox },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'User Management', href: '/admin/users', icon: Shield, adminOnly: true },
];

export function Sidebar() {
  const { isOpen, closeSidebar } = useSidebar();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const filteredNav = navigation.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const handleNavClick = () => {
    // Close sidebar on mobile when a nav item is clicked
    closeSidebar();
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen bg-white dark:bg-[#080808] 
          border-r border-slate-200/60 dark:border-white/5 flex flex-col z-50
          transition-transform duration-300 ease-out w-[240px]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Brand */}
        <div className="h-13 flex items-center justify-between px-5 border-b border-slate-100 dark:border-white/5">
          <NavLink to="/" className="flex items-center gap-2.5 group" onClick={handleNavClick}>
            <Logo showText={true} size="sm" />
          </NavLink>
          {/* Mobile close button */}
          <button
            onClick={closeSidebar}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors md:hidden"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto scrollbar-thin">
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
            Navigation
          </div>
          <ul className="space-y-0.5">
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    onClick={handleNavClick}
                    className={`relative flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 group ${isActive
                      ? 'text-primary-500 bg-primary-500/5 dark:bg-primary-500/10'
                      : 'text-slate-600 dark:text-[#999999] hover:bg-slate-100/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    <item.icon
                      strokeWidth={1.5}
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-primary-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}
                    />
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium px-1">
            <span>© 2024 Night Market</span>
            <div className="flex gap-2">
              <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors text-[9px] uppercase tracking-tighter">API</span>
              <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors text-[9px] uppercase tracking-tighter">v1.2.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
