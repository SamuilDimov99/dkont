import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import { fullName } from "../../utils/logistics.js";
import { IconButton } from "../IconButton.jsx";
import { Info } from "../Info.jsx";
import { Metric } from "../Metric.jsx";
import { ViewTitle } from "../ViewTitle.jsx";

export function Dashboard({ data, visibleShipments, currentClient, currentOffice, session, onRefresh }) {
  const { t } = useTranslation();
  const open = visibleShipments.filter((shipment) => !["DELIVERED", "CANCELLED"].includes(shipment.status));
  const company = data.companies[0] ?? {};
  const delivered = visibleShipments.filter((shipment) => shipment.status === "DELIVERED");

  return (
    <ViewTitle eyebrow={t("dashboard.eyebrow")} title={t("dashboard.title")} action={<IconButton onClick={onRefresh} icon={RefreshCw}>{t("common.refresh")}</IconButton>}>
      {session.role === "ADMIN" && (
        <div className="metrics">
          <Metric value={data.companies.length} label={t("dashboard.metrics.companies")} />
          <Metric value={data.offices.length} label={t("dashboard.metrics.offices")} />
          <Metric value={data.employees.length} label={t("dashboard.metrics.employees")} />
          <Metric value={data.clients.length} label={t("dashboard.metrics.clients")} />
        </div>
      )}
      {session.role === "EMPLOYEE" && session.employeeType === "OFFICE_EMPLOYEE" && (
        <>
          <div className="metrics">
            <Metric value={visibleShipments.length} label={t("dashboard.metrics.officeShipments")} />
            <Metric value={open.length} label={t("dashboard.metrics.activeRequests")} />
            <Metric value={currentOffice?.address ?? "-"} label={t("dashboard.metrics.office")} />
            <Metric value={currentOffice?.city ?? "-"} label={t("dashboard.metrics.city")} />
          </div>
          <div className="split">
            <section className="panel">
              <h3>{t("dashboard.context")}</h3>
              <Info rows={[
                [t("dashboard.infoRole"), t("labels.OFFICE_EMPLOYEE")],
                [t("dashboard.infoOffice"), currentOffice?.address ?? t("common.none")],
                [t("dashboard.infoShipments"), visibleShipments.length],
                [t("dashboard.infoActive"), open.length],
              ]} />
            </section>
            <section className="panel">
              <h3>{t("dashboard.clientDirectory")}</h3>
              {data.clients.length === 0 ? (
                <p style={{ color: "var(--muted)" }}>{t("dashboard.noClients")}</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{t("fields.name")}</th>
                        <th>{t("fields.phone")}</th>
                        <th>{t("fields.email")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.clients.map((client) => (
                        <tr key={client.id}>
                          <td>{fullName(client)}</td>
                          <td>{client.phone ?? "—"}</td>
                          <td>{client.email ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </>
      )}
      {session.role === "EMPLOYEE" && session.employeeType === "COURIER" && (
        <div className="metrics">
          <Metric value={visibleShipments.length} label={t("dashboard.metrics.assignedDeliveries")} />
          <Metric value={open.length} label={t("dashboard.metrics.toDeliver")} />
          <Metric value={delivered.length} label={t("dashboard.metrics.delivered")} />
          <Metric value={currentOffice?.city ?? "-"} label={t("dashboard.metrics.base")} />
        </div>
      )}
      {session.role === "CLIENT" && (
        <div className="metrics">
          <Metric value={visibleShipments.length} label={t("dashboard.metrics.myShipments")} />
          <Metric value={open.length} label={t("dashboard.metrics.activeShipments")} />
          <Metric value={delivered.length} label={t("dashboard.metrics.received")} />
          <Metric value={visibleShipments.at(-1)?.sentDate ?? "-"} label={t("dashboard.metrics.lastShipment")} />
        </div>
      )}
      {session.employeeType !== "OFFICE_EMPLOYEE" && (
        <div className="split">
          <section className="panel">
            <h3>{session.role === "ADMIN" ? t("dashboard.system") : t("dashboard.context")}</h3>
            <Info rows={session.role === "ADMIN"
              ? [
                  [t("fields.name"), "Dkont"],
                  [t("dashboard.purposeLabel"), t("dashboard.purpose")],
                  [t("dashboard.activeCompany"), company.name ?? "-"],
                  [t("dashboard.infoEmail"), company.email ?? "-"],
                ]
              : [
                  [t("dashboard.infoRole"), t(`labels.${session.employeeType ?? session.role}`)],
                  [t("dashboard.infoOffice"), currentOffice?.address ?? t("common.none")],
                  [t("dashboard.infoShipments"), visibleShipments.length],
                  [t("dashboard.infoActive"), open.length],
                ]} />
          </section>
          <section className="panel">
            <h3>{session.role === "CLIENT" && currentClient ? t("dashboard.panelClient", { name: fullName(currentClient) }) : t("dashboard.panelShipments")}</h3>
            <Info rows={[
              [t("dashboard.visibleShipments"), visibleShipments.length],
              [t("dashboard.activeShipments"), open.length],
              [t("dashboard.lastShipment"), visibleShipments.at(-1)?.sentDate ?? t("common.none")],
            ]} />
          </section>
        </div>
      )}
    </ViewTitle>
  );
}
