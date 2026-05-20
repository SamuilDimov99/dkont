import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createResource, deleteResource } from "../../api.js";
import { numericForm } from "../../utils/logistics.js";
import { ViewTitle } from "../ViewTitle.jsx";

export function Offices({ data, selectedCompanyId, onRefresh }) {
  const { t } = useTranslation();
  const [officeCompanyId, setOfficeCompanyId] = useState(Number(selectedCompanyId) || data.companies[0]?.id || "");
  const companyOffices = data.offices.filter((office) => office.companyId === Number(officeCompanyId));

  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = numericForm(form);
    await createResource("offices", {
      company: { id: Number(officeCompanyId) },
      city: values.city,
      address: values.address,
      phone: values.phone,
    });
    form.reset();
    await onRefresh();
  };

  const remove = async (id) => {
    await deleteResource("offices", id);
    await onRefresh();
  };

  return (
    <ViewTitle eyebrow={t("offices.eyebrow")} title={t("offices.title")}>
      <div className="split">
        <form className="form-grid panel" onSubmit={submit}>
          <label>
            {t("offices.company")}
            <select name="companyId" value={officeCompanyId} onChange={(event) => setOfficeCompanyId(Number(event.target.value))} required>
              {data.companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </label>
          <label>{t("offices.city")}<input name="city" required /></label>
          <label className="wide">{t("offices.address")}<input name="address" required /></label>
          <label>{t("offices.phone")}<input name="phone" /></label>
          <button className="wide">{t("offices.add")}</button>
        </form>
        <div className="table-wrap">
          <table>
            <tbody>
              {companyOffices.map((office) => (
                <tr key={office.id}>
                  <td>{office.city}</td>
                  <td>{office.address}</td>
                  <td>{office.phone}</td>
                  <td><button className="secondary" onClick={() => remove(office.id)}>{t("common.delete")}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ViewTitle>
  );
}
