import {
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  ChevronsUpDown,
  FileText,
  HandshakeIcon,
  Home,
  Inbox,
  LogOut,
  Monitor,
  Moon,
  Network,
  Package,
  Settings,
  Sun,
  Users,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Can } from '@/modules/auth/components/Can.js';
import { MANAGEMENT_ROLES } from '@/modules/auth/constants.js';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { usePermission } from '@/modules/auth/hooks/usePermission.js';

const navigationTop = [
  { name: 'Clientes', href: '/clientes', icon: Building2, permission: 'business_clients.read' },
  {
    name: 'Negociaciones',
    href: '/negociaciones',
    icon: HandshakeIcon,
    permission: 'negotiations.read',
  },
];

const navigationBottom = [
  { name: 'Documentación', href: '/documentacion', icon: FileText },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
];

const employabilityChildren = [
  { name: 'Vacantes', href: '/empleabilidad/vacantes', icon: Briefcase },
  { name: 'Aplicantes', href: '/empleabilidad/aplicantes', icon: Users },
  { name: 'Solicitudes', href: '/empleabilidad/mensajes', icon: Inbox },
];

const orgChildren = [
  { name: 'Equipo', href: '/organizacion/equipo', icon: Users, permission: 'employees.read' },
  {
    name: 'Configuración',
    href: '/organizacion/configuracion',
    icon: Settings,
    permission: 'departments.read',
  },
];

function getInitials(profile: { firstName: string; lastName: string } | null): string {
  if (!profile) return '??';
  return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
}

function ThemeMenuItems() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenuGroup>
      <DropdownMenuItem onClick={() => setTheme('light')}>
        <Sun />
        Claro
        {theme === 'light' && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme('dark')}>
        <Moon />
        Oscuro
        {theme === 'dark' && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme('system')}>
        <Monitor />
        Sistema
        {theme === 'system' && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
      </DropdownMenuItem>
    </DropdownMenuGroup>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const { user, logout } = useAuth();
  const { hasPermission } = usePermission();
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
                Distribuidor Tigo
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-1">
            <Avatar className="size-8 rounded-md">
              <AvatarFallback className="rounded-md bg-primary text-primary-foreground font-bold">
                B
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Can roles={MANAGEMENT_ROLES}>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/overview')} tooltip="Overview">
                    <Link to="/overview">
                      <Home />
                      <span>Overview</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Can>

              {navigationTop
                .filter((item) => !item.permission || hasPermission(item.permission))
                .map((item) => (
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
                <SidebarMenuButton asChild isActive={isActive('/catalogo')} tooltip="Catálogo">
                  <Link to="/catalogo">
                    <BookOpen />
                    <span>Catálogo</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={location.pathname === '/catalogo'}>
                      <Link to="/catalogo">
                        <Package />
                        <span>Productos</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={isActive('/catalogo/configuracion')}>
                      <Link to="/catalogo/configuracion">
                        <Settings />
                        <span>Configuración</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>

              {navigationBottom.map((item) => (
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
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/empleabilidad')}
                  tooltip="Empleabilidad"
                >
                  <Link to="/empleabilidad/vacantes">
                    <Briefcase />
                    <span>Empleabilidad</span>
                  </Link>
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

              {orgChildren.some((c) => hasPermission(c.permission)) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive('/organizacion')}
                    tooltip="Organización"
                  >
                    <Link to="/organizacion/equipo">
                      <Network />
                      <span>Organización</span>
                    </Link>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    {orgChildren
                      .filter((child) => hasPermission(child.permission))
                      .map((child) => (
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
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" tooltip={user?.email ?? 'Usuario'}>
                  <Avatar className="size-7 shrink-0">
                    <AvatarFallback className="text-xs">
                      {user ? getInitials(user.profile) : '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col truncate">
                    <span className="truncate text-sm font-medium">
                      {user?.profile
                        ? `${user.profile.firstName} ${user.profile.lastName}`
                        : user?.username}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={isCollapsed ? 'right' : 'top'}
                align="start"
                className="w-56"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">
                      {user?.profile
                        ? `${user.profile.firstName} ${user.profile.lastName}`
                        : user?.username}
                    </span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ThemeMenuItems />
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
