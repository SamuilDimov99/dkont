import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export function useOverlayNotification(duration = 3500) {
  const [state, setState] = useState({ message: "", type: "success" });
  const timerRef = useRef(null);

  const notify = (msg, type = "success") => {
    clearTimeout(timerRef.current);
    setState({ message: msg, type });
    if (type === "success") {
      timerRef.current = setTimeout(() => setState({ message: "", type: "success" }), duration);
    }
  };

  const dismiss = () => {
    clearTimeout(timerRef.current);
    setState({ message: "", type: "success" });
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { message: state.message, type: state.type, notify, dismiss };
}

export function OverlayNotification({ message, type = "success", onDismiss }) {
  const { t } = useTranslation();
  if (!message) return null;
  return (
    <div className="success-overlay">
      <div className={`success-popup ${type === "error" ? "error-popup" : ""}`}>
        <span>{message}</span>
        <button onClick={onDismiss}>{t("common.close")}</button>
      </div>
    </div>
  );
}
