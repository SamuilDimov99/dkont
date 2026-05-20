import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, RefreshCw } from "lucide-react";
import { clientName, fullName, officeName } from "../../utils/logistics.js";
import { IconButton } from "../IconButton.jsx";
import { ViewTitle } from "../ViewTitle.jsx";

export function OfficeOverview({ data, shipments, onRefresh }) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState(null);

  const activeShipments = useMemo(
    () => shipments.filter((s) => !["DELIVERED", "CANCELLED"].includes(s.status)),
    [shipments]
  );

  const employeeById = useMemo(() => {
    const map = {};
    for (const e of data.employees) map[e.id] = e;
    return map;
  }, [data.employees]);

  return (
    <ViewTitle eyebrow={t("officeOverview.eyebrow")} title={t("officeOverview.title")} action={<IconButton onClick={onRefresh} icon={RefreshCw}>{t("common.refresh")}</IconButton>}>
      <div className="office-overview">
        {data.offices.map((office) => {
          const incoming = activeShipments.filter((s) => s.destinationOfficeId === office.id);
          const officeEmployeeIds = new Set(
            data.employees.filter((e) => e.officeId === office.id).map((e) => e.id)
          );
          const outgoing = activeShipments.filter(
            (s) => officeEmployeeIds.has(s.registeredByEmployeeId) && s.destinationOfficeId !== office.id
          );
          const couriers = data.employees.filter(
            (e) => e.officeId === office.id && e.employeeType === "COURIER"
          );
          const isExpanded = expandedId === office.id;
          const allActive = [...incoming, ...outgoing];

          return (
            <div key={office.id} className="office-overview-row">
              <button
                type="button"
                className="office-overview-header"
                onClick={() => setExpandedId(isExpanded ? null : office.id)}
              >
                <span className="office-overview-address">{office.address}<span className="office-overview-city">{office.city}</span></span>
                <div className="office-overview-counts">
                  <span className="oo-badge incoming">↓ {incoming.length} {t("officeOverview.toReceive")}</span>
                  <span className="oo-badge outgoing">↑ {outgoing.length} {t("officeOverview.toSend")}</span>
                </div>
                <ChevronDown size={16} className={`oo-chevron ${isExpanded ? "expanded" : ""}`} />
              </button>

              {isExpanded && (
                <div className="office-overview-detail">
                  {allActive.length === 0 ? (
                    <p className="muted">{t("officeOverview.noShipments")}</p>
                  ) : (
                    <table className="oo-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th></th>
                          <th>{t("shipments.colSender")}</th>
                          <th>{t("shipments.colReceiver")}</th>
                          <th>{t("shipments.colStatus")}</th>
                          <th>{t("officeOverview.registeredBy")}</th>
                          <th>{t("officeOverview.courier")}</th>
                          <th>{t("officeOverview.weight")}</th>
                          <th>{t("officeOverview.price")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incoming.map((s) => {
                          const reg = employeeById[s.registeredByEmployeeId];
                          return (
                            <tr key={`in-${s.id}`}>
                              <td className="oo-id">#{s.id}</td>
                              <td><span className="oo-dir incoming">↓</span></td>
                              <td>{clientName(data, s.senderClientId)}</td>
                              <td>{clientName(data, s.receiverClientId)}</td>
                              <td><span className={`status ${s.status}`}>{t(`labels.${s.status}`)}</span></td>
                              <td>{reg ? fullName(reg) : "—"}</td>
                              <td>{couriers.length > 0 ? couriers.map(fullName).join(", ") : <span className="muted">{t("officeOverview.unassigned")}</span>}</td>
                              <td>{s.weight} кг</td>
                              <td>{Number(s.price).toFixed(2)} {t("shipments.currency")}</td>
                            </tr>
                          );
                        })}
                        {outgoing.map((s) => {
                          const reg = employeeById[s.registeredByEmployeeId];
                          const destOfficeId = s.destinationOfficeId;
                          const destCouriers = destOfficeId
                            ? data.employees.filter((e) => e.officeId === destOfficeId && e.employeeType === "COURIER")
                            : [];
                          return (
                            <tr key={`out-${s.id}`}>
                              <td className="oo-id">#{s.id}</td>
                              <td><span className="oo-dir outgoing">↑</span></td>
                              <td>{clientName(data, s.senderClientId)}</td>
                              <td>{clientName(data, s.receiverClientId)}</td>
                              <td><span className={`status ${s.status}`}>{t(`labels.${s.status}`)}</span></td>
                              <td>{reg ? fullName(reg) : "—"}</td>
                              <td>{destCouriers.length > 0 ? destCouriers.map(fullName).join(", ") : <span className="muted">{t("officeOverview.unassigned")}</span>}</td>
                              <td>{s.weight} кг</td>
                              <td>{Number(s.price).toFixed(2)} {t("shipments.currency")}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ViewTitle>
  );
}
