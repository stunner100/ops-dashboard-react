import { useState, useRef, useEffect } from 'react';
import { Bell, Search, Moon, Sun, User, LogOut, Sparkles, FileText, LayoutDashboard, MessageSquare, BarChart3, BellRing, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useAIAssistant } from '../../context/AIAssistantContext';
import { useSidebar } from '../../context/SidebarContext';
import { useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  children?: React.ReactNode;
}

// Navigation items for search
const searchableItems = [
  { id: 'nav-overview', title: 'Overview Board', description: 'Task management and overview', path: '/', icon: LayoutDashboard },
  { id: 'nav-kpi', title: 'KPI Dashboard', description: 'Key performance indicators', path: '/kpi', icon: BarChart3 },
  { id: 'nav-sop', title: 'SOP Library', description: 'Standard operating procedures', path: '/sop', icon: FileText },
  { id: 'nav-chat', title: 'Team Chat', description: 'Team communication channels', path: '/chat', icon: MessageSquare },
  { id: 'nav-notifications', title: 'Notifications', description: 'Alerts and notifications', path: '/notifications', icon: BellRing },
];

export function Header({ title, children }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { open: openAI } = useAIAssistant();
  const { openSidebar } = useSidebar();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Filter search results based on query
  const searchResults = searchQuery.trim()
    ? searchableItems.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];

  const handleSearchSelect = (path: string) => {
    navigate(path);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const initials = profile?.full_name
    ? profile.full_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() || 'U';

  const pathSegments = location.pathname.split('/').filter(Boolean);

  return (
    <header className="h-[52px] bg-white dark:bg-black border-b border-slate-200/60 dark:border-white/5 flex items-center justify-between px-4 sticky top-0 z-30 transition-colors duration-200">
      {/* Left side: Mobile menu + Title */}
      <div className="flex items-center gap-4 min-w-0 h-full">
        {/* Mobile menu button */}
        <button
          onClick={openSidebar}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors md:hidden"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>

        <div className="flex items-center gap-2 h-full py-2">
          {/* Simplified Breadcrumbs - hide on mobile */}
          <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">Ops</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            {pathSegments.length > 0 && (
              <>
                <span className="capitalize text-slate-900 dark:text-slate-200">{pathSegments[0]}</span>
              </>
            )}
          </div>
          <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-white/10 mx-1 hidden md:block" />
          <h1 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{title}</h1>
        </div>
        {/* View tabs passed as children - hide on mobile */}
        <div className="hidden lg:block h-full">{children}</div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Search - simplified */}
        <div className="relative hidden md:block" ref={searchRef}>
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-100/50 dark:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 rounded-md transition-all group">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-500 transition-colors" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="w-32 lg:w-48 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:w-48 lg:focus:w-64 transition-all font-medium py-0.5"
            />
            <div className="flex items-center gap-0.5 px-1 rounded bg-white dark:bg-black border border-slate-200 dark:border-white/10 text-[9px] font-bold text-slate-400">
              <span>⌘</span>K
            </div>
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full right-0 mt-1.5 w-72 bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-lg shadow-xl overflow-hidden z-50 animate-slide-up origin-top-right">
              <div className="p-1">
                {searchResults.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSearchSelect(item.path)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-md transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-500 truncate">{item.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-1 hidden md:block" />

        {/* Ask AI Button */}
        <button
          onClick={openAI}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold rounded-md shadow-sm transition-all"
          title="Ask AI Assistant (⌘K)"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Ask AI</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Notifications */}
        <button className="relative p-1.5 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary-500 rounded-full ring-2 ring-white dark:ring-black"></span>
        </button>

        {/* Profile dropdown */}
        <div className="relative ml-1" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-1 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 text-[10px] font-bold shadow-inner border border-white dark:border-white/10">
              {initials}
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-lg shadow-xl py-1.5 z-50 animate-slide-up origin-top-right">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-500 truncate">{profile?.email}</p>
              </div>

              <div className="p-1">
                <button className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-md transition-colors text-left">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Settings
                </button>
              </div>

              <div className="border-t border-slate-100 dark:border-white/5 p-1 mt-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header >
  );
}
