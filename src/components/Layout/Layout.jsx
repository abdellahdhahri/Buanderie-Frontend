import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ReferentielsBar } from "../pages/Referentiels/ReferentielsBar";
import { useReferentiels } from "../pages/Referentiels/useReferentiels";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const { items: referentiels } = useReferentiels();
  const surReferentiel = referentiels.some((r) => r.path.toLowerCase() === pathname.toLowerCase());

  return (
    <div className="app-shell">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className={`main-content ${sidebarOpen ? "main-content--shifted" : ""}`}>
        <div className="px-6 pb-6 md:px-8 md:pb-8 pt-3 flex flex-col gap-8  mx-auto w-full animate-in fade-in duration-500">
          {surReferentiel && <ReferentielsBar />}
          <Outlet />
        </div>
      </main>
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
