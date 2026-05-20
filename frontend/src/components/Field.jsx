import { useTranslation } from "react-i18next";

export function Field({ field }) {
  const { t } = useTranslation();
  if (field === "employeeType") {
    return (
      <label>
        {t("fields.type")}
        <select name="employeeType">
          <option value="OFFICE_EMPLOYEE">{t("fields.employeeTypeOffice")}</option>
          <option value="COURIER">{t("fields.employeeTypeCourier")}</option>
        </select>
      </label>
    );
  }
  const labelsByField = {
    firstName: t("fields.firstName"),
    lastName: t("fields.lastName"),
    phone: t("fields.phone"),
    email: t("fields.email"),
    address: t("fields.address"),
    userId: t("fields.userId"),
    officeId: t("fields.officeId"),
    name: t("fields.name"),
    city: t("fields.city"),
    basePricePerKg: t("fields.basePricePerKg"),
    addressSurcharge: t("fields.addressSurcharge"),
  };
  const numericFields = new Set(["basePricePerKg", "addressSurcharge"]);
  const type = field.endsWith("Id") || numericFields.has(field) ? "number" : field === "email" ? "email" : "text";
  const extraProps = numericFields.has(field) ? { step: "0.01", min: "0" } : {};
  return <label>{labelsByField[field] ?? field}<input name={field} type={type} required {...extraProps} /></label>;
}
