import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import "./original-home.css";
import "./academic-home-overrides.css";

import { AuthProvider } from "./components/AuthProvider";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { HouseholdPage } from "./pages/HouseholdPage";
import { InventoryPage } from "./pages/InventoryPage";
import { RecipesPage } from "./pages/RecipesPage";
import { ScanPage } from "./pages/ScanPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/household" element={<HouseholdPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/scan" element={<ScanPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
