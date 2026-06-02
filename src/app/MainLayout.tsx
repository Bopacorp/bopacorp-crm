import { Outlet } from 'react-router-dom';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* TODO: Sidebar navigation */}
      <aside className="hidden w-64 border-r border-border bg-sidebar lg:block">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <span className="font-semibold text-sidebar-foreground">Bopacorp CRM</span>
        </div>
        <nav className="space-y-1 p-4">
          <a
            href="/"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"
          >
            Dashboard
          </a>
        </nav>
      </aside>

      <main className="flex-1">
        <header className="flex h-14 items-center border-b border-border px-6">
          <h1 className="text-lg font-medium text-foreground">Dashboard</h1>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
