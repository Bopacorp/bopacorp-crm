import { Outlet } from 'react-router-dom';
import { AppBreadcrumb } from './AppBreadcrumb';
import { Sidebar } from './Sidebar';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1">
        <header className="flex h-14 items-center border-b border-border px-6">
          <AppBreadcrumb />
        </header>
        <div className="grain p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
