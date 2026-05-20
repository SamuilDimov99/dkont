import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getSnapshot, login, registerClient, clearToken, persistSession, loadPersistedSession, clearPersistedSession } from "./api.js";
import { showDeveloperArea } from "./constants.js";
import { AuthenticatedApp } from "./components/AuthenticatedApp.jsx";
import { LoginPage } from "./components/LoginPage.jsx";
import { AssignmentPage } from "./pages/AssignmentPage.jsx";
import { ChecklistPage } from "./pages/ChecklistPage.jsx";
import { DocumentationPage } from "./pages/DocumentationPage.jsx";
import { LiveDashboardPage } from "./pages/LiveDashboardPage.jsx";

/**
 * Root component — wraps everything in a BrowserRouter so all child components
 * can use React Router hooks (useNavigate, useParams, etc.).
 */
export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

/**
 * Main application shell.
 *
 * Responsibilities:
 *  - Session state (login / logout / restore from localStorage on page refresh)
 *  - Bulk data loading via getSnapshot()
 *  - Role-based visibility (visibleShipments filters the shipment list per role)
 *  - Routing between the login page and the authenticated views
 *
 * Session persistence:
 *  The JWT token is stored in localStorage by api.js (see setToken / clearToken).
 *  The session object (role, userId, etc.) is also stored in localStorage so that
 *  refreshing the page restores the authenticated state without a new login.
 */
function AppRoutes() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // ── State ─────────────────────────────────────────────────────────────────

  const [data, setData] = useState(null);          // all data fetched from the server
  const [active, setActive] = useState("dashboard"); // currently selected tab

  // Session is restored from localStorage on mount (lazy initializer runs once)
  const [session,  setSession]  = useState(loadPersistedSession);
  const [role,     setRole]     = useState(() => loadPersistedSession()?.role     ?? "ADMIN");
  const [clientId, setClientId] = useState(() => loadPersistedSession()?.clientId ?? null);

  const [error,        setError]        = useState("");
  const [serverOffline, setServerOffline] = useState(false);
  const [loginSuccess,  setLoginSuccess]  = useState(false);
  const [logoutMessage, setLogoutMessage] = useState(false);

  // ── Data loading ──────────────────────────────────────────────────────────

  /**
   * Fetches all data from the server and stores it in state.
   * The JWT token is attached automatically by api.js, so this works for
   * any authenticated role. Called after login and when the user clicks Refresh.
   */
  const load = async () => {
    const snapshot = await getSnapshot();
    setData(snapshot);
    // Preserve the existing clientId if already set (prevents it being overwritten
    // on subsequent refreshes when the user's clientId is already known)
    setClientId((current) => current ?? snapshot.clients[0]?.id ?? null);
  };

  // ── Auth handlers ─────────────────────────────────────────────────────────

  /**
   * Handles the login form submission.
   * On success: stores the session, loads data, and navigates to the home route.
   * On failure: shows an error message or the server-offline warning.
   */
  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setServerOffline(false);
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const nextSession = await login(payload);
      persistSession(nextSession);   // save to localStorage for page-refresh survival
      setSession(nextSession);
      setRole(nextSession.role);
      setClientId(nextSession.clientId ?? null);
      setActive("dashboard");
      setLoginSuccess(true);
      await load();
      navigate("/");
    } catch (exception) {
      if (exception.code === "SERVER_UNREACHABLE" || exception.status >= 500) {
        setServerOffline(true);
      } else {
        setError(exception.message);
      }
    }
  };

  /**
   * Handles the registration form submission.
   * Identical flow to login — the backend returns the same LoginResponse format
   * so the user is logged in immediately after creating their account.
   */
  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");
    setServerOffline(false);
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    if (!payload.email) delete payload.email;  // omit empty email rather than sending ""
    try {
      const nextSession = await registerClient(payload);
      persistSession(nextSession);
      setSession(nextSession);
      setRole(nextSession.role);
      setClientId(nextSession.clientId ?? null);
      setActive("dashboard");
      setLoginSuccess(true);
      await load();
      navigate("/");
    } catch (exception) {
      if (exception.code === "SERVER_UNREACHABLE" || exception.status >= 500) {
        setServerOffline(true);
      } else {
        setError(exception.message);
      }
    }
  };

  /**
   * Clears all session and data state, removes the token and session from localStorage,
   * and sends the user back to the login page.
   */
  const completeLogout = () => {
    clearToken();             // remove JWT from localStorage
    clearPersistedSession();  // remove session object from localStorage
    setSession(null);
    setData(null);
    setClientId(null);
    setRole("ADMIN");
    setActive("dashboard");
    setError("");
    setServerOffline(false);
    setLoginSuccess(false);
    setLogoutMessage(false);
    navigate("/");
  };

  /** Triggers the logout animation, then performs the actual logout after a short delay. */
  const handleLogout = () => {
    setLoginSuccess(false);
    setLogoutMessage(true);
    window.setTimeout(completeLogout, 700);
  };

  // ── Side effects ──────────────────────────────────────────────────────────

  /**
   * Loads data whenever the session changes (after login or on page refresh where
   * the session was restored from localStorage). Does nothing when logged out.
   */
  useEffect(() => {
    if (session) {
      load().catch((exception) => setError(exception.message));
    }
  }, [session]);

  /** Auto-hides the "Login successful" notification after 2.5 seconds. */
  useEffect(() => {
    if (!loginSuccess) return undefined;
    const timeout = window.setTimeout(() => setLoginSuccess(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [loginSuccess]);

  // ── Computed values ───────────────────────────────────────────────────────

  /**
   * Filters the full shipments list to only the shipments the current user should see:
   *  - ADMIN / EMPLOYEE → all shipments
   *  - CLIENT           → only shipments where they are the sender or recipient
   *  - COURIER          → only shipments assigned to them as the courier
   */
  const visibleShipments = useMemo(() => {
    if (!data) return [];
    if (role === "CLIENT") {
      return data.shipments.filter(
        (s) => s.senderClientId === Number(clientId) || s.receiverClientId === Number(clientId)
      );
    }
    if (role === "EMPLOYEE" && session?.employeeType === "COURIER") {
      return data.shipments.filter((s) => s.courierId === Number(session.employeeId));
    }
    return data.shipments;  // ADMIN and OFFICE_EMPLOYEE see everything
  }, [data, role, clientId, session]);

  // ── Routes ────────────────────────────────────────────────────────────────

  return (
    <Routes>
      {/* Developer-only routes (hidden in production) */}
      {showDeveloperArea && <Route path="/checklist"               element={<ChecklistPage />} />}
      {showDeveloperArea && <Route path="/assignment"              element={<AssignmentPage />} />}
      {showDeveloperArea && <Route path="/documentation"           element={<DocumentationPage />} />}
      {showDeveloperArea && <Route path="/documentation/:section"  element={<DocumentationPage />} />}

      {/* Live GPS map — requires an active session and loaded data */}
      <Route
        path="/live"
        element={
          session && data ? (
            <LiveDashboardPage data={data} session={session} />
          ) : session ? (
            <main className="loading">{t("common.loading")}</main>
          ) : (
            <LoginPage error={error} serverOffline={serverOffline} onDismissOffline={() => setServerOffline(false)} onLogin={handleLogin} onRegister={handleRegister} />
          )
        }
      />

      {/* Main application route — shows the role-specific UI when authenticated */}
      <Route
        path="/*"
        element={
          session && data ? (
            <AuthenticatedApp
              active={active}
              clientId={clientId}
              data={data}
              error={error}
              load={load}
              loginSuccess={loginSuccess}
              logoutMessage={logoutMessage}
              onLogout={handleLogout}
              role={role}
              session={session}
              setActive={setActive}
              setClientId={setClientId}
              setLoginSuccess={setLoginSuccess}
              setRole={setRole}
              visibleShipments={visibleShipments}
            />
          ) : session ? (
            <main className="loading">{t("common.loading")}</main>
          ) : (
            <LoginPage error={error} serverOffline={serverOffline} onDismissOffline={() => setServerOffline(false)} onLogin={handleLogin} onRegister={handleRegister} />
          )
        }
      />
    </Routes>
  );
}
