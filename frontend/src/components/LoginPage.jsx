import { useState } from "react";
import { useTranslation } from "react-i18next";
import dkontLogo from "../assets/images/dkont-logo.png";
import { OverlayNotification } from "./OverlayNotification.jsx";

export function LoginPage({ error, serverOffline, onDismissOffline, onLogin, onRegister }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState("login");

  return (
    <main className="login-screen">
      <OverlayNotification message={serverOffline ? t("auth.serverOffline") : ""} type="error" onDismiss={onDismissOffline} />
      <section className="login-panel" aria-label={mode === "login" ? t("auth.login") : t("auth.register")}>
        <img src={dkontLogo} alt="Dkont logo" className="login-logo" />
        {mode === "login" ? (
          <form className="login-card" onSubmit={onLogin}>
            {error && <div className="alert">{error}</div>}
            <label>
              {t("auth.username")}
              <input name="username" autoComplete="username" required />
            </label>
            <label>
              {t("auth.password")}
              <input name="password" type="password" autoComplete="current-password" required />
            </label>
            <button>{t("auth.login")}</button>
            <p className="login-switch">
              {t("auth.noAccount")}{" "}
              <button type="button" className="link-button" onClick={() => setMode("register")}>
                {t("auth.register")}
              </button>
            </p>
          </form>
        ) : (
          <form className="login-card" onSubmit={onRegister}>
            {error && <div className="alert">{error}</div>}
            <label>
              {t("auth.username")}
              <input name="username" autoComplete="username" required />
            </label>
            <label>
              {t("auth.password")}
              <input name="password" type="password" autoComplete="new-password" required />
            </label>
            <label>
              {t("auth.email")} ({t("common.optional")})
              <input name="email" type="email" autoComplete="email" />
            </label>
            <button>{t("auth.register")}</button>
            <p className="login-switch">
              {t("auth.hasAccount")}{" "}
              <button type="button" className="link-button" onClick={() => setMode("login")}>
                {t("auth.login")}
              </button>
            </p>
          </form>
        )}
      </section>
    </main>
  );
}
