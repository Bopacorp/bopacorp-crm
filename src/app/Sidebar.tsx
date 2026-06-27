import {
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  ChevronsUpDown,
  FileText,
  HandshakeIcon,
  Home,
  LogOut,
  MessageCircle,
  Monitor,
  Moon,
  Network,
  Package,
  Settings,
  Sun,
  Users,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
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
  { key: 'nav.clients', href: '/clientes', icon: Building2, permission: 'business_clients.read' },
  {
    key: 'nav.negotiations',
    href: '/negociaciones',
    icon: HandshakeIcon,
    permission: 'negotiations.read',
  },
];

const navigationBottom = [
  {
    key: 'nav.documentation',
    href: '/documentacion',
    icon: FileText,
    permission: 'negotiation_documents.read',
  },
  {
    key: 'nav.reports',
    href: '/reportes',
    icon: BarChart3,
    permission: 'report_exports.read',
  },
];

const catalogChildren = [
  {
    key: 'nav.catalog.products',
    href: '/catalogo',
    icon: Package,
    permission: 'catalog_items.read',
  },
  {
    key: 'nav.catalog.settings',
    href: '/catalogo/configuracion',
    icon: Settings,
    permission: 'categories.read',
  },
  {
    key: 'nav.catalog.requests',
    href: '/catalogo/solicitudes',
    icon: MessageCircle,
    permission: 'contact_requests.read',
  },
];

const employabilityChildren = [
  {
    key: 'nav.employability.vacancies',
    href: '/empleabilidad/vacantes',
    icon: Briefcase,
    permission: 'job_vacancies.read',
  },
  {
    key: 'nav.employability.applicants',
    href: '/empleabilidad/aplicantes',
    icon: Users,
    permission: 'job_applications.read',
  },
];

const orgChildren = [
  {
    key: 'nav.organization.team',
    href: '/organizacion/equipo',
    icon: Users,
    permission: 'employees.read',
  },
  {
    key: 'nav.organization.settings',
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
  const { t } = useTranslation();

  return (
    <DropdownMenuGroup>
      <DropdownMenuItem onClick={() => setTheme('light')}>
        <Sun />
        {t('theme.light')}
        {theme === 'light' && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme('dark')}>
        <Moon />
        {t('theme.dark')}
        {theme === 'dark' && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme('system')}>
        <Monitor />
        {t('theme.system')}
        {theme === 'system' && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
      </DropdownMenuItem>
    </DropdownMenuGroup>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { hasPermission } = usePermission();
  const isCollapsed = state === 'collapsed';

  const toggleLang = () => {
    const next = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

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
          <SidebarGroupLabel>{t('nav.menu')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/overview')}
                  tooltip={t('nav.overview')}
                >
                  <Link to="/overview">
                    <Home />
                    <span>{t('nav.overview')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {navigationTop
                .filter((item) => !item.permission || hasPermission(item.permission))
                .map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={t(item.key)}>
                      <Link to={item.href}>
                        <item.icon />
                        <span>{t(item.key)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

              {(() => {
                const visible = catalogChildren.filter((c) => hasPermission(c.permission));
                if (visible.length === 0) return null;
                return (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive('/catalogo')}
                      tooltip={t('nav.catalog')}
                    >
                      <Link to={visible[0].href}>
                        <BookOpen />
                        <span>{t('nav.catalog')}</span>
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      {visible.map((child) => (
                        <SidebarMenuSubItem key={child.href}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={
                              child.href === '/catalogo'
                                ? location.pathname === '/catalogo'
                                : isActive(child.href)
                            }
                          >
                            <Link to={child.href}>
                              <child.icon />
                              <span>{t(child.key)}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                );
              })()}

              {navigationBottom
                .filter((item) => !item.permission || hasPermission(item.permission))
                .map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={t(item.key)}>
                      <Link to={item.href}>
                        <item.icon />
                        <span>{t(item.key)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

              {(() => {
                const visible = employabilityChildren.filter((c) => hasPermission(c.permission));
                if (visible.length === 0) return null;
                return (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive('/empleabilidad')}
                      tooltip={t('nav.employability')}
                    >
                      <Link to={visible[0].href}>
                        <Briefcase />
                        <span>{t('nav.employability')}</span>
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      {visible.map((child) => (
                        <SidebarMenuSubItem key={child.href}>
                          <SidebarMenuSubButton asChild isActive={isActive(child.href)}>
                            <Link to={child.href}>
                              <child.icon />
                              <span>{t(child.key)}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                );
              })()}

              <Can roles={MANAGEMENT_ROLES}>
                {orgChildren.some((c) => hasPermission(c.permission)) && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive('/organizacion')}
                      tooltip={t('nav.organization')}
                    >
                      <Link to="/organizacion/equipo">
                        <Network />
                        <span>{t('nav.organization')}</span>
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
                                <span>{t(child.key)}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                )}
              </Can>
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
                <DropdownMenuItem onClick={toggleLang}>
                  <span className="text-xs font-semibold uppercase">
                    {i18n.language === 'es' ? 'EN' : 'ES'}
                  </span>
                  {i18n.language === 'es' ? 'English' : 'Español'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut />
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
