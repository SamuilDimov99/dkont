import { useTranslation } from "react-i18next";
import { BarChart3, PackageSearch, Truck } from "lucide-react";
import { AuthenticatedShell } from "./AuthenticatedShell.jsx";
import { ClientDeliveries, Dashboard, Shipments } from "./operations/index.js";

export function ClientAuthenticatedApp({ active, clientId, data, error, load, loginSuccess, logoutMessage, onLogout, session, setActive, setLoginSuccess, visibleShipments }) {
  const { t } = useTranslation();
  const currentClient = data.clients.find((client) => client.id === Number(clientId));

  const clientTabs = [
    ["dashboard", t("nav.dashboard"), BarChart3],
    ["shipments", t("nav.myShipments"), Truck],
    ["deliveries", t("nav.myDeliveries"), PackageSearch],
  ];

  return (
    <AuthenticatedShell
      active={active}
      currentClient={currentClient}
      error={error}
      loginSuccess={loginSuccess}
      logoutMessage={logoutMessage}
      onLogout={onLogout}
      session={session}
      setActive={setActive}
      setLoginSuccess={setLoginSuccess}
      tabs={clientTabs}
    >
      {active === "dashboard" && <Dashboard data={data} visibleShipments={visibleShipments} currentClient={currentClient} currentOffice={null} session={session} onRefresh={load} />}
      {active === "shipments" && <Shipments data={data} shipments={visibleShipments} role={session.role} session={session} onRefresh={load} />}
      {active === "deliveries" && <ClientDeliveries data={data} shipments={visibleShipments} session={session} onRefresh={load} />}
    </AuthenticatedShell>
  );
}
