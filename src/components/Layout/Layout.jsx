import { useState } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className={`main-content ${sidebarOpen ? "main-content--shifted" : ""}`}>
        <div className="p-6 md:p-8 flex flex-col gap-8  mx-auto w-full animate-in fade-in duration-500">
          <Outlet />
        </div>
      </main>
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
