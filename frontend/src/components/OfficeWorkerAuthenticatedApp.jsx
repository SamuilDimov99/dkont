import { useTranslation } from "react-i18next";
import { BarChart3, ClipboardList, Truck } from "lucide-react";
import { AuthenticatedShell } from "./AuthenticatedShell.jsx";
import { Dashboard, OfficeReports, Shipments } from "./operations/index.js";

export function OfficeWorkerAuthenticatedApp({ active, data, error, load, loginSuccess, logoutMessage, onLogout, session, setActive, setLoginSuccess, visibleShipments }) {
  const { t } = useTranslation();
  const currentEmployee = data.employees.find((employee) => employee.id === Number(session.employeeId));
  const currentOffice = data.offices.find((office) => office.id === Number(session.officeId));

  const officeWorkerTabs = [
    ["dashboard", t("nav.dashboard"), BarChart3],
    ["shipments", t("nav.officeShipments"), Truck],
    ["reports", t("nav.reports"), ClipboardList],
  ];

  return (
    <AuthenticatedShell
      active={active}
      currentEmployee={currentEmployee}
      currentOffice={currentOffice}
      error={error}
      loginSuccess={loginSuccess}
      logoutMessage={logoutMessage}
      onLogout={onLogout}
      session={session}
      setActive={setActive}
      setLoginSuccess={setLoginSuccess}
      tabs={officeWorkerTabs}
    >
      {active === "dashboard" && <Dashboard data={data} visibleShipments={visibleShipments} currentClient={null} currentOffice={currentOffice} session={session} onRefresh={load} />}
      {active === "shipments" && <Shipments data={data} shipments={visibleShipments} role={session.role} session={session} currentOffice={currentOffice} onRefresh={load} />}
      {active === "reports" && <OfficeReports data={data} shipments={visibleShipments} />}
    </AuthenticatedShell>
  );
}
