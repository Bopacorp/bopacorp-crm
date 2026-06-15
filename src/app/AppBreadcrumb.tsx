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
import { useBreadcrumbTitleValue } from './BreadcrumbTitleContext';

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

function isUuid(segment: string): boolean {
  return segment.length > 10 && segment.includes('-');
}

function getSegments(pathname: string, dynamicTitle: string | null): BreadcrumbSegment[] {
  const paths = pathname.split('/').filter(Boolean);

  if (paths.length === 0 || pathname === '/') {
    return [{ label: 'Overview' }];
  }

  const segments: BreadcrumbSegment[] = [];
  let currentPath = '';

  for (let i = 0; i < paths.length; i++) {
    const segment = paths[i];
    currentPath += `/${segment}`;
    const isLast = i === paths.length - 1;

    if (isUuid(segment)) {
      segments.push({ label: dynamicTitle ?? '...' });
      continue;
    }

    const label = routeLabels[segment] || segment;

    segments.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  }

  return segments;
}

export function AppBreadcrumb() {
  const location = useLocation();
  const dynamicTitle = useBreadcrumbTitleValue();
  const segments = getSegments(location.pathname, dynamicTitle);

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
