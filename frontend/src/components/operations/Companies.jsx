import { useTranslation } from "react-i18next";
import { createResource, deleteResource } from "../../api.js";
import { numericForm } from "../../utils/logistics.js";
import { Field } from "../Field.jsx";
import { OverlayNotification, useOverlayNotification } from "../OverlayNotification.jsx";
import { ViewTitle } from "../ViewTitle.jsx";

function CrudView({ eyebrow, title, endpoint, fields, data, renderRow, onRefresh, extra = {}, addLabel, stacked = false, onNotify, addSuccess, addError }) {
  const { t } = useTranslation();
  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await createResource(endpoint, { ...extra, ...numericForm(form) });
      form.reset();
      await onRefresh();
      onNotify?.(addSuccess, "success");
    } catch (err) {
      onNotify?.(addError ? addError(err) : err.message, "error");
    }
  };
  const remove = async (id) => {
    await deleteResource(endpoint, id);
    await onRefresh();
  };
  return (
    <ViewTitle eyebrow={eyebrow} title={title}>
      <div className="split" style={stacked ? { gridTemplateColumns: "1fr" } : undefined}>
        <form className="form-grid panel" onSubmit={submit}>
          {fields.map((field) => <Field key={field} field={field} />)}
          <button className="wide">{addLabel ?? t("common.add")}</button>
        </form>
        <div className="table-wrap">
          <table>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  {renderRow(item).map((cell, index) => <td key={index}>{cell}</td>)}
                  <td><button className="secondary" onClick={() => remove(item.id)}>{t("common.delete")}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ViewTitle>
  );
}

export function Companies({ data, onRefresh }) {
  const { t } = useTranslation();
  const { message: toast, type: toastType, notify, dismiss } = useOverlayNotification();
  return (
    <>
      <OverlayNotification message={toast} type={toastType} onDismiss={dismiss} />
      <CrudView
        eyebrow={t("companies.eyebrow")}
        title={t("companies.title")}
        endpoint="companies"
        fields={["name", "basePricePerKg", "addressSurcharge"]}
        data={data.companies}
        onRefresh={onRefresh}
        renderRow={(company) => [company.name, `${Number(company.basePricePerKg).toFixed(2)} лв./кг`, `${Number(company.addressSurcharge).toFixed(2)} лв.`]}
        addLabel={t("companies.add")}
        addSuccess={t("companies.addSuccess")}
        addError={(err) => t("companies.addError", { error: err.message })}
        onNotify={notify}
        stacked
      />
    </>
  );
}
