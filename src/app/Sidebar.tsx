import {
  BarChart3,
  BookOpen,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  FileText,
  HandshakeIcon,
  Home,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSidebar } from './SidebarContext';

const navigation = [
  { name: 'Overview', href: '/overview', icon: Home },
  { name: 'Negociaciones', href: '/negociaciones', icon: HandshakeIcon },
  { name: 'Documentación', href: '/documentacion', icon: FileText },
  { name: 'Catálogo', href: '/catalogo', icon: BookOpen },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
  {
    name: 'Empleabilidad',
    icon: '',
    children: [
      { name: 'Aplicantes', href: '/empleabilidad/aplicantes', icon: Briefcase },
      { name: 'Mensajes', href: '/empleabilidad/mensajes', icon: Users },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const { isCollapsed, toggleCollapse } = useSidebar();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const isActive = (href: string) => {
    if (href === '/overview') {
      return location.pathname === href || location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const toggleSection = (name: string) => {
    setExpandedSection(expandedSection === name ? null : name);
  };

  return (
    <aside
      className={cn(
        'border-r border-sidebar-border bg-sidebar transition-all duration-300 lg:block',
        isCollapsed ? 'w-20' : 'hidden w-64 lg:block',
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        {!isCollapsed ? (
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="flex flex-col">
              <span className="font-extrabold text-foreground tracking-tight leading-none text-lg">
                BOPACORP
              </span>
              <span className="text-[10px] font-bold text-primary tracking-widest uppercase mt-1 leading-none">
                Partner Movistar
              </span>
            </div>
          </div>
        ) : (
          <img src={logo} alt="Bopacorp" className="h-8 w-auto" />
        )}

        <Button variant="ghost" size="icon" onClick={toggleCollapse} className="h-8 w-8 ml-auto">
          {isCollapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
        </Button>
      </div>

      <nav className="flex flex-col gap-1 p-2">
        {navigation.map((item) => {
          if (item.children) {
            const isExpanded = expandedSection === item.name;

            return (
              <div key={item.name} className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  onClick={() => !isCollapsed && toggleSection(item.name)}
                  className={cn(
                    'justify-start gap-2 px-3 py-2 h-9 text-sidebar-foreground hover:bg-sidebar-accent',
                    isCollapsed && 'justify-center w-full',
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <span className="text-base">{item.icon}</span>
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-sm font-medium">{item.name}</span>
                      <ChevronRight
                        className={cn('size-4 transition-transform', isExpanded && 'rotate-90')}
                      />
                    </>
                  )}
                </Button>

                {!isCollapsed && isExpanded && (
                  <div className="ml-2 flex flex-col gap-1 border-l border-sidebar-border pl-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors h-9',
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
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center justify-start gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors h-9',
                isActive(item.href)
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isCollapsed && 'justify-center',
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="size-4" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
