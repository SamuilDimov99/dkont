import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import { getGpsPositions } from "../../api.js";
import { clientName, fullName, officeName } from "../../utils/logistics.js";
import { IconButton } from "../IconButton.jsx";
import { ViewTitle } from "../ViewTitle.jsx";

const ACTIVE_STATUSES = new Set(["REGISTERED", "IN_TRANSIT"]);
const DONE_STATUSES = new Set(["DELIVERED", "CANCELLED"]);
const STATUS_STEPS = ["REGISTERED", "IN_TRANSIT", "DELIVERED"];

export function ClientDeliveries({ data, shipments, session, onRefresh }) {
  const { t } = useTranslation();
  const [gpsPositions, setGpsPositions] = useState({});

  const incoming = useMemo(
    () => shipments.filter((s) => s.receiverClientId === session.clientId),
    [shipments, session.clientId]
  );
  const awaiting = useMemo(() => incoming.filter((s) => ACTIVE_STATUSES.has(s.status)), [incoming]);
  const history = useMemo(() => incoming.filter((s) => DONE_STATUSES.has(s.status)), [incoming]);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const positions = await getGpsPositions();
        if (!cancelled) {
          const map = {};
          for (const p of positions) map[p.employeeId] = p;
          setGpsPositions(map);
        }
      } catch {}
    };
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  const courierFor = (shipment) => {
    const employee = data.employees.find((e) => e.employeeType === "COURIER" && gpsPositions[e.id]);
    if (!employee) return null;
    const pos = gpsPositions[employee.id];
    return { name: fullName(employee), lat: pos.lat, lng: pos.lng };
  };

  return (
    <ViewTitle eyebrow={t("deliveries.eyebrow")} title={t("deliveries.title")} action={<IconButton onClick={onRefresh} icon={RefreshCw}>{t("common.refresh")}</IconButton>}>
      <h3 className="section-label">{t("deliveries.awaiting")}</h3>
      {awaiting.length === 0 ? (
        <p className="muted">{t("deliveries.noAwaiting")}</p>
      ) : (
        <div className="delivery-cards">
          {awaiting.map((shipment) => {
            const stepIndex = STATUS_STEPS.indexOf(shipment.status);
            const courier = courierFor(shipment);
            return (
              <div key={shipment.id} className="delivery-card panel">
                <div className="delivery-card-header">
                  <span className="delivery-id">#{shipment.id}</span>
                  <span className={`status ${shipment.status}`}>{t(`labels.${shipment.status}`)}</span>
                </div>
                <div className="delivery-meta">
                  <span>{t("deliveries.from")}: <strong>{clientName(data, shipment.senderClientId)}</strong></span>
                  {shipment.deliveryType === "TO_ADDRESS" && shipment.deliveryAddress && (
                    <span>{t("deliveries.destination")}: <strong>{shipment.deliveryAddress}</strong></span>
                  )}
                  {shipment.deliveryType === "TO_OFFICE" && shipment.destinationOfficeId && (
                    <span>{t("deliveries.destination")}: <strong>{officeName(data, shipment.destinationOfficeId)}</strong></span>
                  )}
                  <span>{t("shipments.colDate")}: <strong>{shipment.sentDate}</strong></span>
                </div>
                <div className="status-stepper">
                  {STATUS_STEPS.map((step, i) => {
                    const labelKey = { REGISTERED: "stepRegistered", IN_TRANSIT: "stepTransit", DELIVERED: "stepDelivered" }[step];
                    return (
                      <div key={step} className={`step ${i <= stepIndex ? "done" : ""} ${i === stepIndex ? "active" : ""}`}>
                        <div className="step-dot" />
                        {i < STATUS_STEPS.length - 1 && <div className="step-line" />}
                        <span className="step-label">{t(`deliveries.${labelKey}`)}</span>
                      </div>
                    );
                  })}
                </div>
                {shipment.status === "IN_TRANSIT" && (
                  <div className="courier-info">
                    {courier ? (
                      <span>{t("deliveries.courierAt")}: <strong>{courier.name}</strong> ({courier.lat.toFixed(4)}, {courier.lng.toFixed(4)})</span>
                    ) : (
                      <span className="muted">{t("deliveries.courierUnknown")}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <h3 className="section-label" style={{ marginTop: "2rem" }}>{t("deliveries.history")}</h3>
      {history.length === 0 ? (
        <p className="muted">{t("deliveries.noHistory")}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("deliveries.colId")}</th>
                <th>{t("deliveries.colFrom")}</th>
                <th>{t("deliveries.colStatus")}</th>
                <th>{t("deliveries.colDate")}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((shipment) => (
                <tr key={shipment.id}>
                  <td>#{shipment.id}</td>
                  <td>{clientName(data, shipment.senderClientId)}</td>
                  <td><span className={`status ${shipment.status}`}>{t(`labels.${shipment.status}`)}</span></td>
                  <td>{shipment.sentDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ViewTitle>
  );
}
