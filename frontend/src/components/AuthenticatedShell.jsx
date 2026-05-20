import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { fullName } from "../utils/logistics.js";
import { BrandHeader } from "./BrandHeader.jsx";
import { LanguageSwitcher } from "./LanguageSwitcher.jsx";

export function AuthenticatedShell({ active, children, currentClient, currentEmployee, currentOffice, error, extraTabs, onLogout, session, setActive, setLoginSuccess, tabs, loginSuccess, logoutMessage }) {
  const { t } = useTranslation();
  return (
    <div>
      <AnimatePresence>
        {(loginSuccess || logoutMessage) && (
          <motion.div
            className="success-overlay"
            role="status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="success-popup"
              initial={{ opacity: 0, x: 48, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 48, scale: 0.98 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <span>{logoutMessage ? t("auth.loggedOut") : t("auth.loginSuccess")}</span>
              {!logoutMessage && <button type="button" aria-label={t("common.close")} onClick={() => setLoginSuccess(false)}>X</button>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <header className="topbar">
        <BrandHeader title="Dkont" />
        <div className="session-badge">
          <span>{t(`labels.${session.role}`)}</span>
          {currentEmployee && <span>{t(`labels.${currentEmployee.employeeType}`)}</span>}
          {currentOffice && <span>{currentOffice.address}</span>}
          <strong>{session.username}</strong>
          <LanguageSwitcher />
          <button type="button" className="logout-button" onClick={onLogout}>{t("common.logout")}</button>
        </div>
      </header>

      <main className="shell">
        {error && <div className="alert">{error}</div>}
        <section className="controls">
          <nav className="tabs" aria-label={t("nav.navigation")}>
            {tabs.map(([key, label, Icon]) => (
              <button key={key} className={active === key ? "active" : ""} onClick={() => setActive(key)}>
                <Icon size={16} /> {label}
              </button>
            ))}
            {extraTabs}
          </nav>
          {currentClient && <div className="role-controls"><strong>{fullName(currentClient)}</strong></div>}
        </section>
        {children}
      </main>
    </div>
  );
}
