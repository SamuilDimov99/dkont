import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PackagePlus } from "lucide-react";
import { cancelShipment, createShipment, deleteShipment, deliverShipment, transitShipment, updateShipment } from "../../api.js";
import { clientName, fullName, numericForm, officeName } from "../../utils/logistics.js";
import { OverlayNotification, useOverlayNotification } from "../OverlayNotification.jsx";
import { ViewTitle } from "../ViewTitle.jsx";
import { AddClientModal } from "./AddClientModal.jsx";

function ClientPicker({ name, label, clients, onRefresh }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(() => String(clients[0]?.id ?? ""));
  const [showModal, setShowModal] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(
    () => normalizedQuery
      ? clients.filter((c) => [c.phone, fullName(c), c.email].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery))
      : clients,
    [clients, normalizedQuery],
  );

  const handleCreated = async (newClient) => {
    setShowModal(false);
    setQuery("");
    setSelectedId(String(newClient.id));
    await onRefresh();
  };

  return (
    <div style={{ display: "grid", gap: "6px" }}>
      <label style={{ marginBottom: 0 }}>
        {label}
        <input
          type="search"
          placeholder={t("fields.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          name={name}
          required
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {filtered.map((c) => (
            <option key={c.id} value={c.id}>
              {fullName(c)}{c.phone ? `, ${c.phone}` : ""}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="secondary"
        style={{ justifySelf: "start", minHeight: 30, padding: "3px 10px", fontSize: 13 }}
        onClick={() => setShowModal(true)}
      >
        + {t("clients.add")}
      </button>
      {showModal && (
        <AddClientModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}

function EditShipmentModal({ shipment, data, onClose, onSaved }) {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [deliveryType, setDeliveryType] = useState(shipment.deliveryType ?? "TO_OFFICE");
  const [status, setStatus] = useState(shipment.status);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const values = numericForm(event.currentTarget);
      const payload = {
        sender: { id: values.senderClientId },
        recipient: { id: values.receiverClientId },
        deliveryType: values.deliveryType,
        weight: values.weight,
        description: values.description || null,
      };
      if (values.deliveryType === "TO_OFFICE") {
        payload.destinationOffice = { id: values.destinationOfficeId };
        payload.deliveryAddress = null;
      } else {
        payload.deliveryAddress = values.deliveryAddress;
        payload.destinationOffice = null;
      }
      await updateShipment(shipment.id, payload);

      if (status !== shipment.status) {
        if (status === "DELIVERED") await deliverShipment(shipment.id);
        else if (status === "IN_TRANSIT") await transitShipment(shipment.id);
        else if (status === "CANCELLED") await cancelShipment(shipment.id);
      }

      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog ref={dialogRef} onClose={onClose} style={{ maxWidth: 600 }}>
      <form className="modal-content" onSubmit={submit}>
        <h3 className="modal-title">{t("shipments.editTitle")} #{shipment.id}</h3>
        <div className="form-grid" style={{ marginBottom: 0 }}>
          <label>
            {t("shipments.sender")}
            <select name="senderClientId" defaultValue={shipment.senderClientId} required>
              {data.clients.map((c) => (
                <option key={c.id} value={c.id}>{fullName(c)}{c.phone ? `, ${c.phone}` : ""}</option>
              ))}
            </select>
          </label>
          <label>
            {t("shipments.receiver")}
            <select name="receiverClientId" defaultValue={shipment.receiverClientId} required>
              {data.clients.map((c) => (
                <option key={c.id} value={c.id}>{fullName(c)}{c.phone ? `, ${c.phone}` : ""}</option>
              ))}
            </select>
          </label>
          <label>
            {t("shipments.deliveryType")}
            <select name="deliveryType" value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)}>
              <option value="TO_OFFICE">{t("shipments.toOffice")}</option>
              <option value="TO_ADDRESS">{t("shipments.toAddress")}</option>
            </select>
          </label>
          {deliveryType === "TO_OFFICE" ? (
            <label>
              {t("shipments.destOffice")}
              <select name="destinationOfficeId" defaultValue={shipment.destinationOfficeId ?? ""} required>
                {data.offices.map((o) => (
                  <option key={o.id} value={o.id}>{o.address}{o.city ? `, ${o.city}` : ""}</option>
                ))}
              </select>
            </label>
          ) : (
            <label className="wide">
              {t("shipments.address")}
              <input name="deliveryAddress" defaultValue={shipment.deliveryAddress ?? ""} required />
            </label>
          )}
          <label>
            {t("shipments.weight")}
            <input name="weight" type="number" step="0.1" min="0.1" defaultValue={shipment.weight} required />
          </label>
          <label className="wide">
            {t("shipments.description")}
            <input name="description" defaultValue={shipment.description ?? ""} />
          </label>
          <label>
            {t("shipments.colStatus")}
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="REGISTERED">{t("labels.REGISTERED")}</option>
              <option value="IN_TRANSIT">{t("labels.IN_TRANSIT")}</option>
              <option value="DELIVERED">{t("labels.DELIVERED")}</option>
              <option value="CANCELLED">{t("labels.CANCELLED")}</option>
            </select>
          </label>
        </div>
        <div className="modal-actions">
          <button disabled={busy}>{t("clients.save")}</button>
          <button type="button" className="secondary" onClick={onClose}>{t("common.back")}</button>
        </div>
      </form>
    </dialog>
  );
}

function ShipmentTable({ data, shipments, role, onEdit, onDeliver, onDelete, canDeliver }) {
  const { t } = useTranslation();
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{t("shipments.colId")}</th>
            <th>{t("shipments.colSender")}</th>
            <th>{t("shipments.colReceiver")}</th>
            <th>{t("shipments.colType")}</th>
            <th>{t("shipments.colDestination")}</th>
            <th>{t("shipments.description")}</th>
            <th>{t("shipments.colPrice")}</th>
            <th>{t("shipments.colStatus")}</th>
            <th>{t("shipments.colDate")}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((shipment) => {
            const destination = shipment.deliveryType === "TO_OFFICE"
              ? officeName(data, shipment.destinationOfficeId)
              : (shipment.deliveryAddress ?? <span className="muted">—</span>);
            return (
              <tr key={shipment.id}>
                <td>{shipment.id}</td>
                <td>{clientName(data, shipment.senderClientId)}</td>
                <td>{clientName(data, shipment.receiverClientId)}</td>
                <td>{t(`labels.${shipment.deliveryType}`)}</td>
                <td className="shipment-destination">{destination}</td>
                <td className="shipment-description">{shipment.description ?? <span className="muted">—</span>}</td>
                <td>{Number(shipment.price).toFixed(2)} {t("shipments.currency")}</td>
                <td><span className={`status ${shipment.status}`}>{t(`labels.${shipment.status}`)}</span></td>
                <td>{shipment.sentDate}</td>
                <td className="actions">
                  {onEdit && <button className="secondary" onClick={() => onEdit(shipment)}>{t("common.edit")}</button>}
                  {canDeliver(shipment) && <button onClick={() => onDeliver(shipment.id)}>{t("shipments.markReceived")}</button>}
                  {role !== "CLIENT" && <button className="secondary" onClick={() => onDelete(shipment.id)}>{t("common.delete")}</button>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Shipments({ data, shipments, role, session, currentOffice, onRefresh }) {
  const { t } = useTranslation();
  const isAdmin = role === "ADMIN";
  const canCreateShipment = isAdmin || (role === "EMPLOYEE" && session?.employeeType === "OFFICE_EMPLOYEE");
  const [deliveryType, setDeliveryType] = useState("TO_OFFICE");
  const [filterOfficeId, setFilterOfficeId] = useState("");
  const [searchId, setSearchId] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const [editingShipment, setEditingShipment] = useState(null);
  const { message: toast, type: toastType, notify, dismiss } = useOverlayNotification();

  const registeringEmployee = data.employees.find((e) => e.id === Number(session.employeeId));
  const companyId = registeringEmployee?.companyId ?? data.companies[0]?.id;
  const companyOffices = useMemo(
    () => isAdmin ? data.offices : data.offices.filter((o) => o.companyId === companyId),
    [data.offices, companyId, isAdmin]
  );

  const saveShipment = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = numericForm(form);
    const registeredById = isAdmin ? values.registeredByEmployeeId : Number(session.employeeId);
    const payload = {
      company: { id: companyId },
      sender: { id: values.senderClientId },
      recipient: { id: values.receiverClientId },
      registeredBy: { id: registeredById },
      deliveryType: values.deliveryType,
      weight: values.weight,
      description: values.description || null,
    };
    if (values.deliveryType === "TO_OFFICE") {
      payload.destinationOffice = { id: values.destinationOfficeId };
    } else {
      payload.deliveryAddress = values.deliveryAddress;
    }
    try {
      await createShipment(payload);
      form.reset();
      setDeliveryType("TO_OFFICE");
      await onRefresh();
      notify(t("shipments.addSuccess"), "success");
    } catch (err) {
      notify(t("shipments.addError", { error: err.message }), "error");
    }
  };

  const handleEditSaved = async () => {
    setEditingShipment(null);
    await onRefresh();
    notify(t("shipments.saveSuccess"), "success");
  };

  const filteredShipments = useMemo(() => {
    let result = shipments;
    if (filterOfficeId) {
      const oid = Number(filterOfficeId);
      result = result.filter((s) => s.destinationOfficeId === oid || s.registeredByEmployeeId != null && data.employees.find((e) => e.id === s.registeredByEmployeeId)?.officeId === oid);
    }
    if (searchId.trim()) {
      result = result.filter((s) => String(s.id).includes(searchId.trim()));
    }
    if (sortField) {
      result = [...result].sort((a, b) => {
        let av, bv;
        if (sortField === "id") { av = a.id; bv = b.id; }
        else if (sortField === "sender") { av = clientName(data, a.senderClientId); bv = clientName(data, b.senderClientId); }
        else if (sortField === "receiver") { av = clientName(data, a.receiverClientId); bv = clientName(data, b.receiverClientId); }
        else if (sortField === "price") { av = Number(a.price); bv = Number(b.price); }
        else if (sortField === "weight") { av = Number(a.weight); bv = Number(b.weight); }
        else if (sortField === "status") { av = a.status; bv = b.status; }
        else if (sortField === "date") { av = a.sentDate; bv = b.sentDate; }
        else if (sortField === "type") { av = a.deliveryType; bv = b.deliveryType; }
        if (av == null) av = ""; if (bv == null) bv = "";
        const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [shipments, filterOfficeId, searchId, sortField, sortDir, data.employees, data.clients]);

  const canDeliver = (shipment) => {
    if (shipment.status === "DELIVERED" || shipment.status === "CANCELLED") return false;
    if (role === "CLIENT") return false;
    if (role === "ADMIN") return true;
    if (session?.employeeType === "OFFICE_EMPLOYEE") {
      return shipment.deliveryType === "TO_OFFICE" && shipment.destinationOfficeId === currentOffice?.id;
    }
    if (session?.employeeType === "COURIER") {
      return shipment.deliveryType === "TO_ADDRESS";
    }
    return false;
  };

  const deliver = async (id) => {
    await deliverShipment(id);
    await onRefresh();
  };

  const remove = async (id) => {
    await deleteShipment(id);
    await onRefresh();
  };

  return (
    <ViewTitle eyebrow={t("shipments.eyebrow")} title={t("shipments.title")}>
      <OverlayNotification message={toast} type={toastType} onDismiss={dismiss} />
      {editingShipment && (
        <EditShipmentModal
          shipment={editingShipment}
          data={data}
          onClose={() => setEditingShipment(null)}
          onSaved={handleEditSaved}
        />
      )}
      {canCreateShipment && currentOffice && (
        <div className="office-context-badge">
          <span className="office-context-label">{t("dashboard.infoOffice")}</span>
          <span className="office-context-value">{currentOffice.address}{currentOffice.city ? `, ${currentOffice.city}` : ""}</span>
          {currentOffice.phone && <span className="office-context-phone">{currentOffice.phone}</span>}
        </div>
      )}
      {canCreateShipment && (
        <form className="form-grid panel" onSubmit={saveShipment}>
          <ClientPicker name="senderClientId" label={t("shipments.sender")} clients={data.clients} onRefresh={onRefresh} />
          <ClientPicker name="receiverClientId" label={t("shipments.receiver")} clients={data.clients} onRefresh={onRefresh} />
          {isAdmin && (
            <label>
              {t("shipments.registeredBy")}
              <select name="registeredByEmployeeId" required>
                {data.employees.map((e) => (
                  <option key={e.id} value={e.id}>{fullName(e)}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            {t("shipments.deliveryType")}
            <select name="deliveryType" value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)}>
              <option value="TO_OFFICE">{t("shipments.toOffice")}</option>
              <option value="TO_ADDRESS">{t("shipments.toAddress")}</option>
            </select>
          </label>
          {deliveryType === "TO_OFFICE" ? (
            <label>
              {t("shipments.destOffice")}
              <select name="destinationOfficeId" required>
                {companyOffices.map((office) => (
                  <option key={office.id} value={office.id}>{office.address}{office.city ? `, ${office.city}` : ""}</option>
                ))}
              </select>
            </label>
          ) : (
            <label className="wide">{t("shipments.address")}<input name="deliveryAddress" required /></label>
          )}
          <label>{t("shipments.weight")}<input name="weight" type="number" step="0.1" min="0.1" defaultValue="1.0" /></label>
          <label className="wide">{t("shipments.description")}<input name="description" /></label>
          <button className="wide"><PackagePlus size={16} /> {t("shipments.add")}</button>
        </form>
      )}
      <div className="shipment-filters">
        <label className="shipment-filter-label">
          {t("shipments.filterOffice")}
          <select value={filterOfficeId} onChange={(e) => setFilterOfficeId(e.target.value)}>
            <option value="">{t("shipments.filterAllOffices")}</option>
            {data.offices.map((office) => (
              <option key={office.id} value={office.id}>{office.address}, {office.city}</option>
            ))}
          </select>
        </label>
        <label className="shipment-filter-label">
          {t("shipments.searchId")}
          <input
            type="search"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="#"
          />
        </label>
        <label className="shipment-filter-label">
          {t("shipments.sortBy")}
          <select value={sortField} onChange={(e) => setSortField(e.target.value)}>
            <option value="">{t("shipments.sortNone")}</option>
            <option value="id">{t("shipments.colId")}</option>
            <option value="sender">{t("shipments.colSender")}</option>
            <option value="receiver">{t("shipments.colReceiver")}</option>
            <option value="type">{t("shipments.colType")}</option>
            <option value="price">{t("shipments.colPrice")}</option>
            <option value="weight">{t("shipments.weight")}</option>
            <option value="status">{t("shipments.colStatus")}</option>
            <option value="date">{t("shipments.colDate")}</option>
          </select>
        </label>
        {sortField && (
          <label className="shipment-filter-label">
            <span>&nbsp;</span>
            <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
              <option value="asc">{t("shipments.sortAsc")}</option>
              <option value="desc">{t("shipments.sortDesc")}</option>
            </select>
          </label>
        )}
      </div>
      <ShipmentTable
        data={data}
        shipments={filteredShipments}
        role={role}
        onEdit={canCreateShipment ? setEditingShipment : null}
        onDeliver={deliver}
        onDelete={remove}
        canDeliver={canDeliver}
      />
    </ViewTitle>
  );
}
