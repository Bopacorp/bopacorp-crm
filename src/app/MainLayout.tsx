import { Search } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AppBreadcrumb } from './AppBreadcrumb';
import { Sidebar } from './Sidebar';
import { SidebarProvider } from './SidebarContext';

export default function MainLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />

        <main className="flex-1">
          <header className="flex h-14 items-center justify-between border-b border-border px-6">
            <AppBreadcrumb />
            <Button variant="ghost" size="icon" className="ml-auto">
              <Search className="size-4" />
            </Button>
          </header>
          <div className="grain p-6 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
