import { BarChart3, BookOpen, Briefcase, FileText, HandshakeIcon, Home, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Overview', href: '/overview', icon: Home },
  { name: 'Negociaciones', href: '/negociaciones', icon: HandshakeIcon },
  { name: 'Documentación', href: '/documentacion', icon: FileText },
  { name: 'Catálogo', href: '/catalogo', icon: BookOpen },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
  {
    name: 'Empleabilidad',
    icon: Briefcase,
    children: [
      { name: 'Aplicantes', href: '/empleabilidad/aplicantes', icon: Users },
      { name: 'Mensajes', href: '/empleabilidad/mensajes', icon: FileText },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/overview') {
      return location.pathname === href || location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside className="hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <span className="text-lg font-semibold text-sidebar-foreground">Bopacorp CRM</span>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => {
          if (item.children) {
            return (
              <div key={item.name} className="flex flex-col gap-1">
                <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-sidebar-foreground">
                  <item.icon className="size-4" />
                  <span>{item.name}</span>
                </div>
                <div className="ml-6 flex flex-col gap-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      to={child.href}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive(child.href)
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      )}
                    >
                      <child.icon className="size-4" />
                      <span>{child.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <item.icon className="size-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
