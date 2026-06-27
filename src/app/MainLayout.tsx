import { Outlet } from 'react-router-dom';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationBell } from '@/modules/notifications/components/NotificationBell.js';
import { AppBreadcrumb } from './AppBreadcrumb';
import { BreadcrumbTitleProvider } from './BreadcrumbTitleContext';
import { AppSidebar } from './Sidebar';

export default function MainLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <BreadcrumbTitleProvider>
          <header className="flex h-14 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger className="-ml-1" />
            <AppBreadcrumb />
            <div className="ml-auto">
              <NotificationBell />
            </div>
          </header>
          <div className="grain min-w-0 overflow-x-hidden p-6 md:p-8">
            <Outlet />
          </div>
        </BreadcrumbTitleProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
