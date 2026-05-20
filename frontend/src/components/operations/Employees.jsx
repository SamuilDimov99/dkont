import { useState } from "react";
import { useTranslation } from "react-i18next";
import { changeUserRole, createEmployee, createUser, deleteEmployee, updateEmployee, updateUser } from "../../api.js";
import { fullName, numericForm, officeName } from "../../utils/logistics.js";
import { OverlayNotification, useOverlayNotification } from "../OverlayNotification.jsx";
import { ViewTitle } from "../ViewTitle.jsx";

export function Employees({ data, selectedCompanyId, onRefresh }) {
  const { t } = useTranslation();
  const [workerCompanyId, setWorkerCompanyId] = useState(Number(selectedCompanyId) || data.companies[0]?.id || "");
  const { message: roleToast, type: roleToastType, notify: showToast, dismiss: dismissToast } = useOverlayNotification();
  const companyOffices = data.offices.filter((office) => office.companyId === Number(workerCompanyId));
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = numericForm(form);
    try {
      const user = await createUser({
        username: values.username,
        passwordHash: values.password,
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        role: "EMPLOYEE",
      });
      await createEmployee({
        company: { id: Number(workerCompanyId) },
        office: { id: values.officeId },
        user: { id: user.id },
        employeeType: values.employeeType,
      });
      form.reset();
      await onRefresh();
      showToast(t("employees.addSuccess"), "success");
    } catch (err) {
      showToast(t("employees.addError", { error: err.message }), "error");
    }
  };

  const remove = async (id) => {
    await deleteEmployee(id);
    await onRefresh();
  };

  const startEdit = (employee) => {
    const user = data.users.find((u) => u.id === employee.userId);
    setEditingId(employee.id);
    setEditValues({
      firstName: employee.firstName ?? "",
      lastName: employee.lastName ?? "",
      email: user?.email ?? "",
      officeId: employee.officeId ?? "",
      employeeType: employee.employeeType ?? "OFFICE_EMPLOYEE",
    });
  };

  const saveEdit = async (employee) => {
    try {
      await updateUser(employee.userId, {
        firstName: editValues.firstName,
        lastName: editValues.lastName,
        email: editValues.email,
      });
      await updateEmployee(employee.id, {
        company: { id: employee.companyId },
        office: { id: Number(editValues.officeId) },
        user: { id: employee.userId },
        employeeType: editValues.employeeType,
      });
      setEditingId(null);
      await onRefresh();
      showToast(t("employees.saveSuccess"), "success");
    } catch (err) {
      showToast(t("employees.saveError", { error: err.message }), "error");
    }
  };

  const selectedCompany = data.companies.find((c) => c.id === Number(workerCompanyId));
  const companyEmployees = data.employees.filter((e) => e.companyId === Number(workerCompanyId));

  return (
    <ViewTitle eyebrow={t("employees.eyebrow")} title={t("employees.title")}>
      <OverlayNotification message={roleToast} type={roleToastType} onDismiss={dismissToast} />
      <label className="company-selector">
        {t("employees.company")}
        <select value={workerCompanyId} onChange={(event) => setWorkerCompanyId(Number(event.target.value))}>
          {data.companies.map((company) => (
            <option key={company.id} value={company.id}>{company.name}</option>
          ))}
        </select>
      </label>
      <div className="split" style={{ gridTemplateColumns: "1fr" }}>
        <form className="form-grid panel" onSubmit={submit}>
          <label>{t("employees.firstName")}<input name="firstName" required /></label>
          <label>{t("employees.lastName")}<input name="lastName" required /></label>
          <label>{t("employees.username")}<input name="username" required /></label>
          <label>{t("employees.password")}<input name="password" type="password" required /></label>
          <label>{t("employees.email")}<input name="email" type="email" required /></label>
          <label>
            {t("employees.officeAddress")}
            <select name="officeId" required>
              {companyOffices.map((office) => (
                <option key={office.id} value={office.id}>{office.address}</option>
              ))}
            </select>
          </label>
          <label>
            {t("employees.type")}
            <select name="employeeType">
              <option value="OFFICE_EMPLOYEE">{t("employees.typeOffice")}</option>
              <option value="COURIER">{t("employees.typeCourier")}</option>
            </select>
          </label>
          <button className="wide">{t("employees.add")}</button>
        </form>
        <div className="employee-list-wrap">
          <h3 className="employee-list-heading">{t("employees.listTitle", { company: selectedCompany?.name ?? "" })}</h3>
          {companyEmployees.length === 0 ? (
            <p className="muted">{t("employees.noEmployees")}</p>
          ) : (
            <div className="employee-table-wrap table-wrap">
              <table>
                <tbody>
                  {companyEmployees.map((employee) => {
                    const user = data.users.find((u) => u.id === employee.userId);
                    const isEditing = editingId === employee.id;
                    const editOffices = data.offices.filter((o) => o.companyId === employee.companyId);
                    return (
                      <tr key={employee.id} className={isEditing ? "active-row" : ""}>
                        <td>
                          {isEditing ? (
                            <div className="employee-edit-name">
                              <input value={editValues.firstName} onChange={(e) => setEditValues((v) => ({ ...v, firstName: e.target.value }))} placeholder={t("employees.firstName")} />
                              <input value={editValues.lastName} onChange={(e) => setEditValues((v) => ({ ...v, lastName: e.target.value }))} placeholder={t("employees.lastName")} />
                            </div>
                          ) : fullName(employee)}
                        </td>
                        <td>
                          {isEditing ? (
                            <select value={editValues.employeeType} onChange={(e) => setEditValues((v) => ({ ...v, employeeType: e.target.value }))}>
                              <option value="OFFICE_EMPLOYEE">{t("employees.typeOffice")}</option>
                              <option value="COURIER">{t("employees.typeCourier")}</option>
                            </select>
                          ) : t(`labels.${employee.employeeType}`)}
                        </td>
                        <td>
                          {isEditing ? (
                            <select value={editValues.officeId} onChange={(e) => setEditValues((v) => ({ ...v, officeId: e.target.value }))}>
                              {editOffices.map((o) => <option key={o.id} value={o.id}>{o.address}</option>)}
                            </select>
                          ) : officeName(data, employee.officeId)}
                        </td>
                        <td>
                          {isEditing ? (
                            <input value={editValues.email} onChange={(e) => setEditValues((v) => ({ ...v, email: e.target.value }))} type="email" placeholder={t("employees.email")} />
                          ) : (
                            <select value={user?.role ?? ""} onChange={async (e) => { await changeUserRole(employee.userId, e.target.value); await onRefresh(); showToast(t("employees.roleUpdated", { name: fullName(employee) })); }}>
                              <option value="ADMIN">{t("employees.roleAdmin")}</option>
                              <option value="EMPLOYEE">{t("employees.roleEmployee")}</option>
                              <option value="CLIENT">{t("employees.roleClient")}</option>
                            </select>
                          )}
                        </td>
                        <td className="actions">
                          {isEditing ? (
                            <>
                              <button onClick={() => saveEdit(employee)}>{t("clients.save")}</button>
                              <button className="secondary" onClick={() => setEditingId(null)}>{t("common.close")}</button>
                            </>
                          ) : (
                            <>
                              <button className="secondary" onClick={() => startEdit(employee)}>{t("common.edit")}</button>
                              <button className="secondary" onClick={() => remove(employee.id)}>{t("common.delete")}</button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ViewTitle>
  );
}
