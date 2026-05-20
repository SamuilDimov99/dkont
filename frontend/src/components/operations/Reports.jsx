import { useState } from "react";
import { useTranslation } from "react-i18next";
import { clientName, fullName, officeName } from "../../utils/logistics.js";
import { Metric } from "../Metric.jsx";
import { ViewTitle } from "../ViewTitle.jsx";

const REPORT_TABS = ["revenue", "employees", "staff", "clients", "shipments", "byEmployee", "undelivered", "bySender", "byReceiver"];

function buildReport(data, dates) {
  const from = dates.from || localDateOffset(-31);
  const to = dates.to || localDateOffset(0);
  const shipments = data.shipments.filter((shipment) => shipment.sentDate >= from && shipment.sentDate <= to);
  const revenue = shipments.reduce((sum, shipment) => sum + Number(shipment.price ?? 0), 0);
  const openShipments = data.shipments.filter((shipment) => shipment.status !== "DELIVERED" && shipment.status !== "CANCELLED");
  return { shipments, openShipments, revenue };
}

function localDateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export function Reports({ data }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("revenue");
  const [dates, setDates] = useState({ from: "", to: "" });
  const [reportCompanyId, setReportCompanyId] = useState(data.companies[0]?.id ?? "");
  const [filterEmployeeId, setFilterEmployeeId] = useState(data.employees[0]?.id ?? "");
  const [filterClientId, setFilterClientId] = useState(data.clients[0]?.id ?? "");
  const report = buildReport(data, dates);

  const cid = Number(reportCompanyId);
  const companyEmployees = data.employees.filter((e) => e.companyId === cid);
  const companyClients = data.clients;
  const companyShipments = data.shipments.filter((s) => s.companyId === cid);

  const loadReport = (event) => {
    event.preventDefault();
    setDates(Object.fromEntries(new FormData(event.currentTarget)));
  };

  const CompanyBar = () => (
    <label className="report-company-select">
      {t("employees.company")}
      <select value={reportCompanyId} onChange={(e) => setReportCompanyId(Number(e.target.value))}>
        {data.companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </label>
  );

  const ShipmentRows = ({ shipments }) => (
    shipments.length === 0 ? <tr><td colSpan={7} className="muted">{t("reports.noResults")}</td></tr> :
    shipments.map((s) => (
      <tr key={s.id}>
        <td>#{s.id}</td>
        <td>{clientName(data, s.senderClientId)}</td>
        <td>{clientName(data, s.receiverClientId)}</td>
        <td>{s.weight} кг</td>
        <td>{Number(s.price).toFixed(2)} {t("reports.currency")}</td>
        <td><span className={`status ${s.status}`}>{t(`labels.${s.status}`)}</span></td>
        <td>{s.sentDate}</td>
      </tr>
    ))
  );

  const shipmentHead = (
    <tr>
      <th>ID</th>
      <th>{t("reports.colSender")}</th>
      <th>{t("reports.colReceiver")}</th>
      <th>{t("reports.colWeight")}</th>
      <th>{t("reports.colPrice")}</th>
      <th>{t("reports.colStatus")}</th>
      <th>{t("reports.colDate")}</th>
    </tr>
  );

  return (
    <ViewTitle eyebrow={t("reports.eyebrow")} title={t("reports.title")}>
      <nav className="report-tabs">
        {REPORT_TABS.map((key) => (
          <button key={key} type="button" className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
            {t(`reports.tab${key.charAt(0).toUpperCase() + key.slice(1)}`)}
          </button>
        ))}
      </nav>

      {tab === "revenue" && (
        <div className="report-section">
          <form className="inline-form" onSubmit={loadReport}>
            <label>{t("reports.from")}<input type="date" name="from" /></label>
            <label>{t("reports.to")}<input type="date" name="to" /></label>
            <button>{t("reports.calculate")}</button>
          </form>
          {report && (
            <div className="metrics">
              <Metric value={`${Number(report.revenue).toFixed(2)} ${t("reports.currency")}`} label={t("reports.revenue")} />
              <Metric value={report.openShipments.length} label={t("reports.undelivered")} />
              <Metric value={report.shipments.length} label={t("reports.total")} />
            </div>
          )}
        </div>
      )}

      {tab === "employees" && (
        <div className="report-section">
          <div className="report-section-header">
            <h3>{t("reports.employeesTitle")}</h3>
            <CompanyBar />
          </div>
          <div className="metrics">
            <Metric value={companyEmployees.length} label={t("reports.totalEmployees")} />
            <Metric value={companyEmployees.filter((e) => e.employeeType === "OFFICE_EMPLOYEE").length} label={t("labels.OFFICE_EMPLOYEE")} />
            <Metric value={companyEmployees.filter((e) => e.employeeType === "COURIER").length} label={t("labels.COURIER")} />
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>{t("reports.colName")}</th>
                <th>{t("reports.colType")}</th>
                <th>{t("reports.colOffice")}</th>
                <th>{t("reports.colEmail")}</th>
                <th>{t("reports.colRole")}</th>
              </tr></thead>
              <tbody>
                {companyEmployees.map((e) => {
                  const user = data.users.find((u) => u.id === e.userId);
                  return (
                    <tr key={e.id}>
                      <td>{fullName(e)}</td>
                      <td><span className={`status ${e.employeeType}`}>{t(`labels.${e.employeeType}`)}</span></td>
                      <td>{officeName(data, e.officeId)}</td>
                      <td>{e.email ?? "—"}</td>
                      <td>{user ? t(`labels.${user.role}`) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "staff" && (
        <div className="report-section">
          <div className="report-section-header">
            <h3>{t("reports.staffTitle")}</h3>
            <CompanyBar />
          </div>
          {(() => {
            const couriers = companyEmployees.filter((e) => e.employeeType === "COURIER");
            const companyOffices = data.offices.filter((o) => o.companyId === cid);
            return <>
              <div className="metrics">
                <Metric value={companyEmployees.length} label={t("reports.totalEmployees")} />
                <Metric value={couriers.length} label={t("reports.totalCouriers")} />
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t("reports.colOffice")}</th>
                      <th>{t("fields.city")}</th>
                      <th>{t("reports.colOfficeWorkers")}</th>
                      <th>{t("reports.colCouriers")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyOffices.map((office) => {
                      const officeWorkers = companyEmployees.filter((e) => e.officeId === office.id && e.employeeType === "OFFICE_EMPLOYEE");
                      const officeCouriers = companyEmployees.filter((e) => e.officeId === office.id && e.employeeType === "COURIER");
                      return (
                        <tr key={office.id}>
                          <td>{office.address}</td>
                          <td>{office.city}</td>
                          <td>
                            {officeWorkers.length > 0
                              ? officeWorkers.map(fullName).join(", ")
                              : <span className="muted">—</span>}
                            <span className="staff-count">({officeWorkers.length})</span>
                          </td>
                          <td>
                            {officeCouriers.length > 0
                              ? officeCouriers.map(fullName).join(", ")
                              : <span className="muted">—</span>}
                            <span className="staff-count">({officeCouriers.length})</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>;
          })()}
        </div>
      )}

      {tab === "clients" && (
        <div className="report-section">
          <div className="report-section-header">
            <h3>{t("reports.clientsTitle")}</h3>
          </div>
          <div className="metrics">
            <Metric value={companyClients.length} label={t("reports.totalClients")} />
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>{t("reports.colName")}</th>
                <th>{t("reports.colEmail")}</th>
                <th>{t("reports.colPhone")}</th>
              </tr></thead>
              <tbody>
                {companyClients.length === 0
                  ? <tr><td colSpan={3} className="muted">{t("reports.noResults")}</td></tr>
                  : companyClients.map((c) => (
                    <tr key={c.id}>
                      <td>{fullName(c)}</td>
                      <td>{c.email ?? "—"}</td>
                      <td>{c.phone ?? "—"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "shipments" && (
        <div className="report-section">
          <div className="report-section-header">
            <h3>{t("reports.shipmentsTitle")}</h3>
            <CompanyBar />
          </div>
          <div className="metrics">
            <Metric value={companyShipments.length} label={t("reports.total")} />
            <Metric value={companyShipments.filter((s) => !["DELIVERED","CANCELLED"].includes(s.status)).length} label={t("reports.undelivered")} />
          </div>
          <div className="table-wrap"><table><thead>{shipmentHead}</thead><tbody><ShipmentRows shipments={companyShipments} /></tbody></table></div>
        </div>
      )}

      {tab === "byEmployee" && (
        <div className="report-section">
          <div className="report-section-header">
            <h3>{t("reports.byEmployeeTitle")}</h3>
            <label className="report-company-select">
              {t("reports.selectEmployee")}
              <select value={filterEmployeeId} onChange={(e) => setFilterEmployeeId(Number(e.target.value))}>
                {data.employees.map((e) => <option key={e.id} value={e.id}>{fullName(e)}</option>)}
              </select>
            </label>
          </div>
          {(() => {
            const rows = data.shipments.filter((s) => s.registeredByEmployeeId === Number(filterEmployeeId));
            return <>
              <div className="metrics"><Metric value={rows.length} label={t("reports.total")} /></div>
              <div className="table-wrap"><table><thead>{shipmentHead}</thead><tbody><ShipmentRows shipments={rows} /></tbody></table></div>
            </>;
          })()}
        </div>
      )}

      {tab === "undelivered" && (
        <div className="report-section">
          <div className="report-section-header">
            <h3>{t("reports.undeliveredTitle")}</h3>
            <CompanyBar />
          </div>
          {(() => {
            const rows = companyShipments.filter((s) => !["DELIVERED","CANCELLED"].includes(s.status));
            return <>
              <div className="metrics"><Metric value={rows.length} label={t("reports.undelivered")} /></div>
              <div className="table-wrap"><table><thead>{shipmentHead}</thead><tbody><ShipmentRows shipments={rows} /></tbody></table></div>
            </>;
          })()}
        </div>
      )}

      {tab === "bySender" && (
        <div className="report-section">
          <div className="report-section-header">
            <h3>{t("reports.bySenderTitle")}</h3>
            <label className="report-company-select">
              {t("reports.selectClient")}
              <select value={filterClientId} onChange={(e) => setFilterClientId(Number(e.target.value))}>
                {data.clients.map((c) => <option key={c.id} value={c.id}>{fullName(c)}</option>)}
              </select>
            </label>
          </div>
          {(() => {
            const rows = data.shipments.filter((s) => s.senderClientId === Number(filterClientId));
            return <>
              <div className="metrics"><Metric value={rows.length} label={t("reports.total")} /></div>
              <div className="table-wrap"><table><thead>{shipmentHead}</thead><tbody><ShipmentRows shipments={rows} /></tbody></table></div>
            </>;
          })()}
        </div>
      )}

      {tab === "byReceiver" && (
        <div className="report-section">
          <div className="report-section-header">
            <h3>{t("reports.byReceiverTitle")}</h3>
            <label className="report-company-select">
              {t("reports.selectClient")}
              <select value={filterClientId} onChange={(e) => setFilterClientId(Number(e.target.value))}>
                {data.clients.map((c) => <option key={c.id} value={c.id}>{fullName(c)}</option>)}
              </select>
            </label>
          </div>
          {(() => {
            const rows = data.shipments.filter((s) => s.receiverClientId === Number(filterClientId));
            return <>
              <div className="metrics"><Metric value={rows.length} label={t("reports.total")} /></div>
              <div className="table-wrap"><table><thead>{shipmentHead}</thead><tbody><ShipmentRows shipments={rows} /></tbody></table></div>
            </>;
          })()}
        </div>
      )}
    </ViewTitle>
  );
}
