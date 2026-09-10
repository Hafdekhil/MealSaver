import { Outlet } from "react-router-dom";
import { Header } from "./Header";

export function Layout() {
  return (
    <div className="app-shell">
      <Header />
      <Outlet />

      <footer className="site-footer">
        <p>© 2026 MealSaver — Projet académique</p>
      </footer>
    </div>
  );
}
