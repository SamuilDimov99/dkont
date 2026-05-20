import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { createResource, createUser } from "../../api.js";
import { numericForm } from "../../utils/logistics.js";

export function AddClientModal({ onClose, onCreated }) {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const [busy, setBusy] = useState(false);

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
      const user = await createUser({
        username: values.username,
        passwordHash: values.password,
        email: values.email || null,
        firstName: values.firstName,
        lastName: values.lastName,
        role: "CLIENT",
      });
      const client = await createResource("clients", { user: { id: user.id }, phone: values.phone || null });
      onCreated(client);
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog ref={dialogRef} onClose={onClose}>
      <form className="modal-content" onSubmit={submit}>
        <h3 className="modal-title">{t("clients.addTitle")}</h3>
        <div className="form-grid" style={{ marginBottom: 0 }}>
          <label>{t("clients.firstName")}<input name="firstName" required /></label>
          <label>{t("clients.lastName")}<input name="lastName" required /></label>
          <label>{t("clients.username")}<input name="username" required autoComplete="off" /></label>
          <label>{t("clients.password")}<input name="password" type="password" required autoComplete="new-password" /></label>
          <label>{t("clients.email")}<input name="email" type="email" /></label>
          <label>{t("clients.phone")}<input name="phone" /></label>
        </div>
        <div className="modal-actions">
          <button disabled={busy}>{t("clients.save")}</button>
          <button type="button" className="secondary" onClick={onClose}>{t("common.back")}</button>
        </div>
      </form>
    </dialog>
  );
}
