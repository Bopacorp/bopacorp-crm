import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '@/app/MainLayout.js';
import RequireAuth from '@/modules/auth/components/RequireAuth.js';
import LoginPage from '@/modules/auth/pages/LoginPage';
import DashboardPage from '@/modules/dashboard/pages/DashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route
            path="/"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
