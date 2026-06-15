import { Outlet } from 'react-router-dom';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppBreadcrumb } from './AppBreadcrumb';
import { BreadcrumbTitleProvider } from './BreadcrumbTitleContext';
import { AppSidebar } from './Sidebar';

export default function MainLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <BreadcrumbTitleProvider>
          <header className="flex h-14 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger className="-ml-1" />
            <AppBreadcrumb />
          </header>
          <div className="grain p-6 md:p-8">
            <Outlet />
          </div>
        </BreadcrumbTitleProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
