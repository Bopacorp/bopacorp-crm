import { Link, useLocation } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

const routeLabels: Record<string, string> = {
  overview: 'Overview',
  clientes: 'Clientes',
  negociaciones: 'Negociaciones',
  documentacion: 'Documentación',
  catalogo: 'Catálogo',
  reportes: 'Reportes',
  empleabilidad: 'Empleabilidad',
  aplicantes: 'Aplicantes',
  mensajes: 'Mensajes',
  matrices: 'Matrices',
};

function getSegments(pathname: string): BreadcrumbSegment[] {
  const paths = pathname.split('/').filter(Boolean);

  if (paths.length === 0 || pathname === '/') {
    return [{ label: 'Overview' }];
  }

  const segments: BreadcrumbSegment[] = [];
  let currentPath = '';

  for (let i = 0; i < paths.length; i++) {
    const segment = paths[i];
    currentPath += `/${segment}`;

    // Skip IDs in breadcrumbs (they're typically UUIDs)
    if (segment.length > 10 && segment.includes('-')) {
      continue;
    }

    const label = routeLabels[segment] || segment;
    const isLast = i === paths.length - 1;

    segments.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  }

  return segments;
}

export function AppBreadcrumb() {
  const location = useLocation();
  const segments = getSegments(location.pathname);

  if (segments.length <= 1) {
    return null;
  }

  return (
    <>
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {segments.map((segment) => (
            <BreadcrumbItem key={segment.label}>
              {segment.href ? (
                <>
                  <BreadcrumbLink asChild>
                    <Link to={segment.href}>{segment.label}</Link>
                  </BreadcrumbLink>
                  {segment !== segments[segments.length - 1] && <BreadcrumbSeparator />}
                </>
              ) : (
                <BreadcrumbPage>{segment.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}
