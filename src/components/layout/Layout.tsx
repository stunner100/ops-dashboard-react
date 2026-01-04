import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { SidebarProvider } from '../../context/SidebarContext';

export function Layout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Sidebar />
        {/* Main content - full width on mobile, offset on desktop */}
        <main className="md:ml-[260px] transition-all duration-300">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
