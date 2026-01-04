import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  BookOpen,
  MessageSquare,
  Bell,
  Upload,
  X,
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
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'KPIs', href: '/kpi', icon: BarChart3 },
  { name: 'Library', href: '/sop', icon: BookOpen },
  { name: 'Team Chat', href: '/chat', icon: MessageSquare },
  { name: 'Inbox', href: '/notifications', icon: Bell },
  { name: 'Ingest Data', href: '/ingest', icon: Upload, adminOnly: true },
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
          fixed left-0 top-0 h-screen bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl 
          border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col z-50
          transition-transform duration-300 ease-out w-[260px]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
          <NavLink to="/" className="flex items-center gap-3 group" onClick={handleNavClick}>
            <Logo showText={true} size="sm" />
          </NavLink>
          {/* Mobile close button */}
          <button
            onClick={closeSidebar}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto scrollbar-thin">
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Menu
          </div>
          <ul className="space-y-1">
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    onClick={handleNavClick}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                      ? 'text-primary-600 dark:text-primary-400 bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-primary-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                    <span>{item.name}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/50">
          <p className="text-xs text-center text-slate-400 dark:text-slate-500">
            © 2024 Night Market
          </p>
        </div>
      </aside>
    </>
  );
}
