import { useState } from "react";
import { useTranslation } from "react-i18next";
import { clientName, fullName } from "../../utils/logistics.js";
import { Metric } from "../Metric.jsx";
import { ViewTitle } from "../ViewTitle.jsx";

export function OfficeReports({ data, shipments }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("bySender");
  const [clientId, setClientId] = useState(data.clients[0]?.id ?? "");

  const clientSelect = (
    <label className="report-company-select">
      {t("reports.selectClient")}
      <select value={clientId} onChange={(e) => setClientId(Number(e.target.value))}>
        {data.clients.map((c) => <option key={c.id} value={c.id}>{fullName(c)}</option>)}
      </select>
    </label>
  );

  const sentRows = shipments.filter((s) => s.senderClientId === Number(clientId));
  const receivedRows = shipments.filter((s) => s.receiverClientId === Number(clientId));

  const ShipmentRows = ({ rows }) =>
    rows.length === 0 ? (
      <tr><td colSpan={6} className="muted">{t("reports.noResults")}</td></tr>
    ) : rows.map((s) => (
      <tr key={s.id}>
        <td>#{s.id}</td>
        <td>{clientName(data, s.senderClientId)}</td>
        <td>{clientName(data, s.receiverClientId)}</td>
        <td>{Number(s.price).toFixed(2)} {t("shipments.currency")}</td>
        <td><span className={`status ${s.status}`}>{t(`labels.${s.status}`)}</span></td>
        <td>{s.sentDate}</td>
      </tr>
    ));

  const thead = (
    <tr>
      <th>ID</th>
      <th>{t("reports.colSender")}</th>
      <th>{t("reports.colReceiver")}</th>
      <th>{t("reports.colPrice")}</th>
      <th>{t("reports.colStatus")}</th>
      <th>{t("reports.colDate")}</th>
    </tr>
  );

  return (
    <ViewTitle eyebrow={t("reports.eyebrow")} title={t("reports.officeReportsTitle")}>
      <nav className="report-tabs">
        <button type="button" className={tab === "bySender" ? "active" : ""} onClick={() => setTab("bySender")}>
          {t("reports.bySenderTitle")}
        </button>
        <button type="button" className={tab === "byReceiver" ? "active" : ""} onClick={() => setTab("byReceiver")}>
          {t("reports.byReceiverTitle")}
        </button>
      </nav>

      {tab === "bySender" && (
        <div className="report-section">
          <div className="report-section-header">
            <h3>{t("reports.bySenderTitle")}</h3>
            {clientSelect}
          </div>
          <div className="metrics">
            <Metric value={sentRows.length} label={t("reports.total")} />
          </div>
          <div className="table-wrap">
            <table><thead>{thead}</thead><tbody><ShipmentRows rows={sentRows} /></tbody></table>
          </div>
        </div>
      )}

      {tab === "byReceiver" && (
        <div className="report-section">
          <div className="report-section-header">
            <h3>{t("reports.byReceiverTitle")}</h3>
            {clientSelect}
          </div>
          <div className="metrics">
            <Metric value={receivedRows.length} label={t("reports.total")} />
          </div>
          <div className="table-wrap">
            <table><thead>{thead}</thead><tbody><ShipmentRows rows={receivedRows} /></tbody></table>
          </div>
        </div>
      )}
    </ViewTitle>
  );
}
