import { useState, useRef, useEffect } from 'react';
import { Bell, Search, Moon, Sun, User, LogOut, ChevronDown, HelpCircle, Sparkles, FileText, LayoutDashboard, MessageSquare, BarChart3, BellRing, Menu } from 'lucide-react';
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
    <header className="h-14 md:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 transition-colors duration-200">
      {/* Left side: Mobile menu + Title */}
      <div className="flex items-center gap-3 md:gap-6 min-w-0">
        {/* Mobile menu button */}
        <button
          onClick={openSidebar}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col min-w-0">
          {/* Breadcrumbs - hide on mobile */}
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 mb-0.5">
            <span>Ops Center</span>
            {pathSegments.length > 0 && (
              <>
                <span className="text-slate-300">/</span>
                <span className="capitalize">{pathSegments[0]}</span>
              </>
            )}
          </div>
          <h1 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white tracking-tight truncate">{title}</h1>
        </div>
        {/* View tabs passed as children - hide on mobile */}
        <div className="hidden lg:block">{children}</div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2 md:gap-3 ml-auto">
        {/* Search - hide on mobile */}
        <div className="relative hidden lg:block ml-4" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="w-64 pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium"
          />

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
              {searchResults.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSearchSelect(item.path)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* No results message */}
          {showSearchResults && searchQuery.trim() && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-4 z-50">
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center">No pages found</p>
            </div>
          )}
        </div>

        {/* Ask AI Button - compact on mobile */}
        <button
          onClick={openAI}
          className="group relative flex items-center gap-2 px-3 md:px-4 py-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all ring-1 ring-slate-900/5 dark:ring-white/10 overflow-hidden"
          title="Ask AI Assistant (⌘K)"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Sparkles className="w-4 h-4 text-indigo-300 dark:text-indigo-600 group-hover:scale-110 transition-transform duration-300" />
          <span className="relative hidden md:inline">Ask AI</span>
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />


        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Help */}
        <button className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
        </button>

        {/* Profile dropdown */}
        <div className="relative ml-2" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold shadow-inner ring-1 ring-white dark:ring-slate-700">
              {initials}
            </div>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl shadow-slate-200/20 dark:shadow-slate-900/40 py-1.5 z-50 animate-slide-up origin-top-right">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
              </div>

              <div className="p-1.5">
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                  <User className="w-4 h-4 text-slate-400" />
                  Profile & Settings
                </button>
                <div className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer" onClick={toggleTheme}>
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? <Moon className="w-4 h-4 text-slate-400" /> : <Sun className="w-4 h-4 text-slate-400" />}
                    Theme
                  </div>
                  <span className="text-xs text-slate-400 capitalize">{theme}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700/50 p-1.5 mt-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
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
