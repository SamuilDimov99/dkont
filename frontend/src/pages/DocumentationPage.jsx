import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DeveloperHeader } from "../components/DeveloperHeader.jsx";
import { documentationRoutes } from "../data/documentationRoutes.js";

export function DocumentationPage() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const path = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  const activeRoute = documentationRoutes.find((route) => route.path === path) ?? documentationRoutes[0];

  return (
    <div>
      <DeveloperHeader title={t("docs.header")} />
      <main className="shell docs-shell">
        <nav className="docs-nav" aria-label="Documentation navigation">
          {documentationRoutes.map((route) => (
            <Link key={route.path} className={route.path === activeRoute.path ? "active" : ""} to={route.path}>
              {route.title}
            </Link>
          ))}
        </nav>
        <section className="docs-content">
          <h2>{activeRoute.title}</h2>
          <div className="docs-sections">
            {activeRoute.sections.map(([title, body]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
