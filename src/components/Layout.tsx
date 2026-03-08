import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <h1>Budgeter</h1>
          <p className="muted">Backend-first finance app</p>
        </div>

        <nav className="nav">
          <Link className={location.pathname === "/" ? "active" : ""} to="/">
            Dashboard
          </Link>
          <Link className={location.pathname.startsWith("/budgets") ? "active" : ""} to="/budgets">
            Budgets
          </Link>
          <Link className={location.pathname.startsWith("/entries") ? "active" : ""} to="/entries">
            Entries
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="user-box">
            <strong>{user?.displayName ?? "User"}</strong>
            <span className="muted">{user?.email}</span>
          </div>
          <button className="secondary-button" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
