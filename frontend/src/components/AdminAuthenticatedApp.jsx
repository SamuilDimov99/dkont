import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BarChart3, Building2, CheckCircle2, ClipboardList, LayoutList, MapPinned, Truck, Users } from "lucide-react";
import { AuthenticatedShell } from "./AuthenticatedShell.jsx";
import { Clients, Companies, Dashboard, Employees, Offices, OfficeOverview, Reports, Shipments } from "./operations/index.js";

export function AdminAuthenticatedApp({ active, data, error, load, loginSuccess, logoutMessage, onLogout, session, setActive, setLoginSuccess, visibleShipments }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currentEmployee = data.employees.find((employee) => employee.id === Number(session.employeeId));
  const currentOffice = data.offices.find((office) => office.id === Number(session.officeId));

  const adminTabs = [
    ["dashboard", t("nav.dashboard"), BarChart3],
    ["companies", t("nav.companies"), Building2],
    ["offices", t("nav.offices"), Building2],
    ["officeOverview", t("nav.officeOverview"), LayoutList],
    ["employees", t("nav.employees"), ClipboardList],
    ["clients", t("nav.clients"), Users],
    ["shipments", t("nav.shipments"), Truck],
    ["reports", t("nav.reports"), CheckCircle2],
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
      tabs={adminTabs}
      extraTabs={<button type="button" className="secondary" onClick={() => navigate("/live")}><MapPinned size={16} /> Live</button>}
    >
      {active === "dashboard" && <Dashboard data={data} visibleShipments={visibleShipments} currentClient={null} currentOffice={currentOffice} session={session} onRefresh={load} />}
      {active === "companies" && <Companies data={data} onRefresh={load} />}
      {active === "offices" && <Offices data={data} selectedCompanyId={data.companies[0]?.id ?? ""} onRefresh={load} />}
      {active === "officeOverview" && <OfficeOverview data={data} shipments={visibleShipments} onRefresh={load} />}
      {active === "employees" && <Employees data={data} selectedCompanyId={data.companies[0]?.id ?? ""} onRefresh={load} />}
      {active === "clients" && <Clients data={data} selectedCompanyId={data.companies[0]?.id ?? ""} onRefresh={load} />}
      {active === "shipments" && <Shipments data={data} shipments={visibleShipments} role={session.role} session={session} onRefresh={load} />}
      {active === "reports" && <Reports data={data} />}
    </AuthenticatedShell>
  );
}
