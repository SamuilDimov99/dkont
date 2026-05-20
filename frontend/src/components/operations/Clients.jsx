import { useState } from "react";
import { useTranslation } from "react-i18next";
import { deleteResource, updateClient, updateUser } from "../../api.js";
import { fullName, numericForm } from "../../utils/logistics.js";
import { OverlayNotification, useOverlayNotification } from "../OverlayNotification.jsx";
import { ViewTitle } from "../ViewTitle.jsx";
import { AddClientModal } from "./AddClientModal.jsx";

export function Clients({ data, selectedCompanyId, onRefresh }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const { message: toast, type: toastType, notify, dismiss } = useOverlayNotification();

  const handleCreated = async () => {
    setShowAdd(false);
    await onRefresh();
    notify(t("clients.addSuccess"), "success");
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    const values = numericForm(event.currentTarget);
    try {
      await updateUser(editing.userId, {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email || null,
      });
      await updateClient(editing.id, { phone: values.phone });
      setEditing(null);
      await onRefresh();
      notify(t("clients.saveSuccess"), "success");
    } catch (err) {
      notify(t("clients.saveError", { error: err.message }), "error");
    }
  };

  const remove = async (id) => {
    await deleteResource("clients", id);
    if (editing?.id === id) setEditing(null);
    await onRefresh();
  };

  return (
    <ViewTitle eyebrow={t("clients.eyebrow")} title={t("clients.title")}
      action={<button onClick={() => setShowAdd(true)}>{t("clients.add")}</button>}>
      <OverlayNotification message={toast} type={toastType} onDismiss={dismiss} />
      {showAdd && (
        <AddClientModal
          onClose={() => setShowAdd(false)}
          onCreated={handleCreated}
        />
      )}
      {editing && (
        <form key={editing.id} className="form-grid panel" style={{ marginBottom: 16 }} onSubmit={submitEdit}>
          <h4 style={{ margin: 0, gridColumn: "1 / -1" }}>{t("clients.editTitle")}</h4>
          <label>{t("clients.firstName")}<input name="firstName" defaultValue={editing.firstName} required /></label>
          <label>{t("clients.lastName")}<input name="lastName" defaultValue={editing.lastName} required /></label>
          <label>{t("clients.email")} <small style={{ fontWeight: 400 }}>({t("common.optional")})</small><input name="email" type="email" defaultValue={editing.email ?? ""} /></label>
          <label>{t("clients.phone")}<input name="phone" defaultValue={editing.phone ?? ""} required /></label>
          <button className="wide">{t("clients.save")}</button>
          <button type="button" className="wide secondary" onClick={() => setEditing(null)}>{t("common.back")}</button>
        </form>
      )}
      <div className="table-wrap">
        <table>
          <tbody>
            {data.clients.map((client) => (
              <tr key={client.id} className={editing?.id === client.id ? "active-row" : ""}>
                <td>{fullName(client)}</td>
                <td>{client.phone}</td>
                <td>{client.email}</td>
                <td className="actions">
                  <button className="secondary" onClick={() => setEditing(client)}>{t("common.edit")}</button>
                  <button className="secondary" onClick={() => remove(client.id)}>{t("common.delete")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ViewTitle>
  );
}
