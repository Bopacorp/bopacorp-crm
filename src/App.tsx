import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '@/app/MainLayout.js';
import { TooltipProvider } from '@/components/ui/tooltip';
import RequireAuth from '@/modules/auth/components/RequireAuth.js';
import LoginPage from '@/modules/auth/pages/LoginPage';
import CatalogPage from '@/modules/catalog/pages/CatalogPage';
import MatrixDetailPage from '@/modules/catalog/pages/MatrixDetailPage';
import DocumentationPage from '@/modules/documentation/pages/DocumentationPage';
import ApplicantsPage from '@/modules/employability/pages/ApplicantsPage';
import MessagesPage from '@/modules/employability/pages/MessagesPage';
import NegotiationDetailPage from '@/modules/negotiations/pages/NegotiationDetailPage';
import NegotiationsPage from '@/modules/negotiations/pages/NegotiationsPage';
import OverviewPage from '@/modules/overview/pages/OverviewPage';
import ReportsPage from '@/modules/reports/pages/ReportsPage';

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <Routes>
          <Route element={<MainLayout />}>
            {/* Overview */}
            <Route
              path="/"
              element={
                <RequireAuth>
                  <OverviewPage />
                </RequireAuth>
              }
            />
            <Route
              path="/overview"
              element={
                <RequireAuth>
                  <OverviewPage />
                </RequireAuth>
              }
            />

            {/* Negotiations */}
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
              path="/catalogo/matrices/:id"
              element={
                <RequireAuth>
                  <MatrixDetailPage />
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
      </TooltipProvider>
    </BrowserRouter>
  );
}
