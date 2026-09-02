import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import "./original-home.css";
import "./academic-home-overrides.css";

import { Layout } from "./components/Layout";
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
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/household" element={<HouseholdPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/scan" element={<ScanPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;


