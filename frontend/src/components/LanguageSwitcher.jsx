import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const toggle = () => {
    const next = i18n.language === "bg" ? "en" : "bg";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };
  return (
    <button type="button" className="secondary" onClick={toggle}>
      {i18n.language === "bg" ? "EN" : "BG"}
    </button>
  );
}
