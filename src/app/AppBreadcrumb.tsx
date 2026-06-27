import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, matchPath, useLocation } from 'react-router-dom';
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

interface BreadcrumbRouteItem {
  labelKey?: string;
  href?: string;
  fromTitle?: boolean;
}

const breadcrumbRoutes: Array<{ path: string; items: BreadcrumbRouteItem[] }> = [
  { path: '/', items: [{ labelKey: 'breadcrumb.overview' }] },
  { path: '/overview', items: [{ labelKey: 'breadcrumb.overview' }] },
  { path: '/clientes', items: [{ labelKey: 'breadcrumb.clients' }] },
  { path: '/negociaciones', items: [{ labelKey: 'breadcrumb.negotiations' }] },
  {
    path: '/negociaciones/:id',
    items: [{ labelKey: 'breadcrumb.negotiations', href: '/negociaciones' }, { fromTitle: true }],
  },
  { path: '/documentacion', items: [{ labelKey: 'breadcrumb.documentation' }] },
  { path: '/catalogo', items: [{ labelKey: 'breadcrumb.catalog' }] },
  {
    path: '/catalogo/configuracion',
    items: [
      { labelKey: 'breadcrumb.catalog', href: '/catalogo' },
      { labelKey: 'breadcrumb.settings' },
    ],
  },
  {
    path: '/catalogo/solicitudes',
    items: [
      { labelKey: 'breadcrumb.catalog', href: '/catalogo' },
      { labelKey: 'breadcrumb.requests' },
    ],
  },
  {
    path: '/catalogo/nuevo',
    items: [
      { labelKey: 'breadcrumb.catalog', href: '/catalogo' },
      { labelKey: 'breadcrumb.newProduct' },
    ],
  },
  {
    path: '/catalogo/:id',
    items: [{ labelKey: 'breadcrumb.catalog', href: '/catalogo' }, { fromTitle: true }],
  },
  {
    path: '/organizacion/equipo',
    items: [
      { labelKey: 'breadcrumb.organization', href: '/organizacion/equipo' },
      { labelKey: 'breadcrumb.team' },
    ],
  },
  {
    path: '/organizacion/configuracion',
    items: [
      { labelKey: 'breadcrumb.organization', href: '/organizacion/equipo' },
      { labelKey: 'breadcrumb.settings' },
    ],
  },
  { path: '/reportes', items: [{ labelKey: 'breadcrumb.reports' }] },
  {
    path: '/empleabilidad/vacantes',
    items: [
      { labelKey: 'breadcrumb.employability', href: '/empleabilidad/vacantes' },
      { labelKey: 'breadcrumb.vacancies' },
    ],
  },
  {
    path: '/empleabilidad/aplicantes',
    items: [
      { labelKey: 'breadcrumb.employability', href: '/empleabilidad/vacantes' },
      { labelKey: 'breadcrumb.applicants' },
    ],
  },
];

function getSegments(
  pathname: string,
  dynamicTitle: string | null,
  t: (key: string) => string,
): BreadcrumbSegment[] {
  const route = breadcrumbRoutes.find((candidate) =>
    matchPath({ path: candidate.path, end: true }, pathname),
  );

  if (!route) {
    return [];
  }

  if (route.items.some((item) => item.fromTitle) && !dynamicTitle) {
    return [];
  }

  return route.items.map((item) => {
    if (item.fromTitle) {
      return { label: dynamicTitle ?? '', href: item.href };
    }

    return { label: t(item.labelKey ?? ''), href: item.href };
  });
}

export function AppBreadcrumb() {
  const location = useLocation();
  const dynamicTitle = useBreadcrumbTitleValue();
  const { t } = useTranslation();
  const segments = getSegments(location.pathname, dynamicTitle, t);

  if (segments.length === 0) {
    return null;
  }

  return (
    <>
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {segments.map((segment, index) => (
            <Fragment key={segment.href ?? segment.label}>
              <BreadcrumbItem>
                {segment.href ? (
                  <BreadcrumbLink asChild>
                    <Link to={segment.href}>{segment.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {index < segments.length - 1 && <BreadcrumbSeparator />}
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}
