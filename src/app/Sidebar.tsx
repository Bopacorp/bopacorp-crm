import {
  BarChart3,
  BookOpen,
  Briefcase,
  FileText,
  HandshakeIcon,
  Home,
  LogOut,
  Users,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  Sidebar as SidebarPrimitive,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { ModeToggle } from '@/shared/ui/ModeToggle';

const navigation = [
  { name: 'Overview', href: '/overview', icon: Home },
  { name: 'Negociaciones', href: '/negociaciones', icon: HandshakeIcon },
  { name: 'Documentación', href: '/documentacion', icon: FileText },
  { name: 'Catálogo', href: '/catalogo', icon: BookOpen },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
];

const employabilityChildren = [
  { name: 'Aplicantes', href: '/empleabilidad/aplicantes', icon: Briefcase },
  { name: 'Mensajes', href: '/empleabilidad/mensajes', icon: Users },
];

function getInitials(profile: { firstName: string; lastName: string } | null): string {
  if (!profile) return '??';
  return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const { user, logout } = useAuth();
  const isCollapsed = state === 'collapsed';

  const isActive = (href: string) => {
    if (href === '/overview') {
      return location.pathname === href || location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <SidebarPrimitive collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        {!isCollapsed ? (
          <div className="flex items-center gap-2 px-2 py-1">
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
          <div className="flex items-center justify-center px-2 py-1">
            <img src={logo} alt="Bopacorp" className="size-8" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.name}>
                    <Link to={item.href}>
                      <item.icon />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem>
                <SidebarMenuButton isActive={isActive('/empleabilidad')} tooltip="Empleabilidad">
                  <Briefcase />
                  <span>Empleabilidad</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  {employabilityChildren.map((child) => (
                    <SidebarMenuSubItem key={child.href}>
                      <SidebarMenuSubButton asChild isActive={isActive(child.href)}>
                        <Link to={child.href}>
                          <child.icon />
                          <span>{child.name}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2">
              {user && (
                <>
                  <Avatar className="size-7">
                    <AvatarFallback className="text-xs">{getInitials(user.profile)}</AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex flex-1 flex-col truncate">
                      <span className="truncate text-sm font-medium">
                        {user.profile
                          ? `${user.profile.firstName} ${user.profile.lastName}`
                          : user.username}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  )}
                </>
              )}
              <div className="ml-auto flex items-center gap-1">
                <ModeToggle />
                <SidebarMenuButton
                  tooltip="Cerrar sesión"
                  onClick={handleLogout}
                  className="size-8"
                >
                  <LogOut className="size-4" />
                </SidebarMenuButton>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
