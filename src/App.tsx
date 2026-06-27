import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import MainLayout from '@/app/MainLayout.js';
import { TooltipProvider } from '@/components/ui/tooltip';
import RequireAuth from '@/modules/auth/components/RequireAuth.js';
import { RequirePermission } from '@/modules/auth/components/RequirePermission.js';
import { MANAGEMENT_ROLES, SALES_MANAGEMENT_ROLES } from '@/modules/auth/constants.js';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import LoginPage from '@/modules/auth/pages/LoginPage';
import CatalogItemCreatePage from '@/modules/catalog/pages/CatalogItemCreatePage';
import CatalogItemDetailPage from '@/modules/catalog/pages/CatalogItemDetailPage';
import CatalogPage from '@/modules/catalog/pages/CatalogPage';
import CatalogSettingsPage from '@/modules/catalog/pages/CatalogSettingsPage';
import ContactRequestsPage from '@/modules/catalog/pages/ContactRequestsPage';
import { ClientSheetProvider } from '@/modules/clients/context/ClientSheetContext';
import ClientsPage from '@/modules/clients/pages/ClientsPage';
import DocumentationPage from '@/modules/documentation/pages/DocumentationPage';
import ApplicantsPage from '@/modules/employability/pages/ApplicantsPage';
import VacanciesPage from '@/modules/employability/pages/VacanciesPage';
import NegotiationDetailPage from '@/modules/negotiations/pages/NegotiationDetailPage';
import NegotiationsPage from '@/modules/negotiations/pages/NegotiationsPage';
import OrgSettingsPage from '@/modules/org/pages/OrgSettingsPage';
import TeamPage from '@/modules/org/pages/TeamPage';
import OverviewPage from '@/modules/overview/pages/OverviewPage';
import ReportsPage from '@/modules/reports/pages/ReportsPage';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';

function HomeRedirect() {
  const { hasRole } = useAuth();
  const isCoordinatorOnly =
    hasRole('coordinator') && !hasRole('admin') && !hasRole('manager') && !hasRole('supervisor');
  return <Navigate to={isCoordinatorOnly ? '/documentacion' : '/overview'} replace />;
}

function SalesOnly({ children }: { children: ReactNode }) {
  const { hasRole } = useAuth();
  const allowed = hasRole('advisor') || SALES_MANAGEMENT_ROLES.some((r) => hasRole(r));
  return allowed ? children : <Navigate to="/clientes" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <ErrorBoundary>
          <Routes>
            <Route element={<MainLayout />}>
              {/* Home redirect */}
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <HomeRedirect />
                  </RequireAuth>
                }
              />

              {/* Overview */}
              <Route
                path="/overview"
                element={
                  <RequireAuth>
                    <SalesOnly>
                      <OverviewPage />
                    </SalesOnly>
                  </RequireAuth>
                }
              />

              {/* Clients & Negotiations */}
              <Route
                element={
                  <ClientSheetProvider>
                    <Outlet />
                  </ClientSheetProvider>
                }
              >
                <Route
                  path="/clientes"
                  element={
                    <RequireAuth>
                      <ClientsPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/negociaciones"
                  element={
                    <RequireAuth>
                      <NegotiationsPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/negociaciones/:id"
                  element={
                    <RequireAuth>
                      <NegotiationDetailPage />
                    </RequireAuth>
                  }
                />
              </Route>

              {/* Documentation */}
              <Route
                path="/documentacion"
                element={
                  <RequireAuth>
                    <RequirePermission
                      permission="negotiation_documents.read"
                      roles={MANAGEMENT_ROLES}
                    >
                      <DocumentationPage />
                    </RequirePermission>
                  </RequireAuth>
                }
              />

              {/* Catalog */}
              <Route
                path="/catalogo"
                element={
                  <RequireAuth>
                    <RequirePermission permission="catalog_items.read">
                      <CatalogPage />
                    </RequirePermission>
                  </RequireAuth>
                }
              />
              <Route
                path="/catalogo/configuracion"
                element={
                  <RequireAuth>
                    <RequirePermission permission="categories.read">
                      <CatalogSettingsPage />
                    </RequirePermission>
                  </RequireAuth>
                }
              />
              <Route
                path="/catalogo/solicitudes"
                element={
                  <RequireAuth>
                    <RequirePermission permission="contact_requests.read">
                      <ContactRequestsPage />
                    </RequirePermission>
                  </RequireAuth>
                }
              />
              <Route
                path="/catalogo/nuevo"
                element={
                  <RequireAuth>
                    <RequirePermission permission="catalog_items.read">
                      <CatalogItemCreatePage />
                    </RequirePermission>
                  </RequireAuth>
                }
              />
              <Route
                path="/catalogo/:id"
                element={
                  <RequireAuth>
                    <RequirePermission permission="catalog_items.read">
                      <CatalogItemDetailPage />
                    </RequirePermission>
                  </RequireAuth>
                }
              />

              {/* Organization */}
              <Route
                path="/organizacion/equipo"
                element={
                  <RequireAuth>
                    <SalesOnly>
                      <TeamPage />
                    </SalesOnly>
                  </RequireAuth>
                }
              />
              <Route
                path="/organizacion/configuracion"
                element={
                  <RequireAuth>
                    <SalesOnly>
                      <RequirePermission permission="departments.read">
                        <OrgSettingsPage />
                      </RequirePermission>
                    </SalesOnly>
                  </RequireAuth>
                }
              />

              {/* Reports */}
              <Route
                path="/reportes"
                element={
                  <RequireAuth>
                    <SalesOnly>
                      <RequirePermission permission="report_exports.read">
                        <ReportsPage />
                      </RequirePermission>
                    </SalesOnly>
                  </RequireAuth>
                }
              />

              {/* Employability */}
              <Route
                path="/empleabilidad/vacantes"
                element={
                  <RequireAuth>
                    <RequirePermission permission="job_vacancies.read">
                      <VacanciesPage />
                    </RequirePermission>
                  </RequireAuth>
                }
              />
              <Route
                path="/empleabilidad/aplicantes"
                element={
                  <RequireAuth>
                    <RequirePermission permission="job_applications.read">
                      <ApplicantsPage />
                    </RequirePermission>
                  </RequireAuth>
                }
              />
            </Route>

            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </TooltipProvider>
    </BrowserRouter>
  );
}
