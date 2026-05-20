import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BrandHeader } from "./BrandHeader.jsx";

export function DeveloperHeader({ title }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <header className="topbar">
      <BrandHeader eyebrow="Developer area" title={title} />
      <div className="developer-actions">
        <button className="secondary" onClick={() => navigate("/checklist")}>{t("developer.tasks")}</button>
        <button className="secondary" onClick={() => navigate("/assignment")}>{t("developer.assignment")}</button>
        <button className="secondary" onClick={() => navigate("/documentation")}>{t("developer.documentation")}</button>
        <button onClick={() => navigate("/")}>{t("developer.enterApp")}</button>
      </div>
    </header>
  );
}
