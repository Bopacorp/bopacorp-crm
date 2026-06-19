import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import MainLayout from '@/app/MainLayout.js';
import { TooltipProvider } from '@/components/ui/tooltip';
import RequireAuth from '@/modules/auth/components/RequireAuth.js';
import { MANAGEMENT_ROLES } from '@/modules/auth/constants.js';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import LoginPage from '@/modules/auth/pages/LoginPage';
import CatalogItemCreatePage from '@/modules/catalog/pages/CatalogItemCreatePage';
import CatalogItemDetailPage from '@/modules/catalog/pages/CatalogItemDetailPage';
import CatalogPage from '@/modules/catalog/pages/CatalogPage';
import CatalogSettingsPage from '@/modules/catalog/pages/CatalogSettingsPage';
import { ClientSheetProvider } from '@/modules/clients/context/ClientSheetContext';
import ClientsPage from '@/modules/clients/pages/ClientsPage';
import DocumentationPage from '@/modules/documentation/pages/DocumentationPage';
import ApplicantsPage from '@/modules/employability/pages/ApplicantsPage';
import MessagesPage from '@/modules/employability/pages/MessagesPage';
import VacanciesPage from '@/modules/employability/pages/VacanciesPage';
import MatrixDetailPage from '@/modules/matrices/pages/MatrixDetailPage';
import NegotiationDetailPage from '@/modules/negotiations/pages/NegotiationDetailPage';
import NegotiationsPage from '@/modules/negotiations/pages/NegotiationsPage';
import OrgSettingsPage from '@/modules/org/pages/OrgSettingsPage';
import TeamPage from '@/modules/org/pages/TeamPage';
import OverviewPage from '@/modules/overview/pages/OverviewPage';
import ReportsPage from '@/modules/reports/pages/ReportsPage';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';

function HomeRedirect() {
  const { hasRole } = useAuth();
  const isManagement = MANAGEMENT_ROLES.some((role) => hasRole(role));
  return <Navigate to={isManagement ? '/overview' : '/clientes'} replace />;
}

function ManagementOnly({ children }: { children: ReactNode }) {
  const { hasRole } = useAuth();
  const isManagement = MANAGEMENT_ROLES.some((role) => hasRole(role));
  return isManagement ? children : <Navigate to="/clientes" replace />;
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
                    <ManagementOnly>
                      <OverviewPage />
                    </ManagementOnly>
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
                    <DocumentationPage />
                  </RequireAuth>
                }
              />

              {/* Catalog */}
              <Route
                path="/catalogo"
                element={
                  <RequireAuth>
                    <CatalogPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/catalogo/configuracion"
                element={
                  <RequireAuth>
                    <CatalogSettingsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/negociaciones/matrices/:id"
                element={
                  <RequireAuth>
                    <MatrixDetailPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/catalogo/nuevo"
                element={
                  <RequireAuth>
                    <CatalogItemCreatePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/catalogo/:id"
                element={
                  <RequireAuth>
                    <CatalogItemDetailPage />
                  </RequireAuth>
                }
              />

              {/* Organization */}
              <Route
                path="/organizacion/equipo"
                element={
                  <RequireAuth>
                    <TeamPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/organizacion/configuracion"
                element={
                  <RequireAuth>
                    <OrgSettingsPage />
                  </RequireAuth>
                }
              />

              {/* Reports */}
              <Route
                path="/reportes"
                element={
                  <RequireAuth>
                    <ReportsPage />
                  </RequireAuth>
                }
              />

              {/* Employability */}
              <Route
                path="/empleabilidad/vacantes"
                element={
                  <RequireAuth>
                    <VacanciesPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/empleabilidad/aplicantes"
                element={
                  <RequireAuth>
                    <ApplicantsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/empleabilidad/mensajes"
                element={
                  <RequireAuth>
                    <MessagesPage />
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
