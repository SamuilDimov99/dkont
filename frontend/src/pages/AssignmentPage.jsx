import { useTranslation } from "react-i18next";
import { DeveloperHeader } from "../components/DeveloperHeader.jsx";
import { ViewTitle } from "../components/ViewTitle.jsx";
import { assignmentDocuments } from "../data/assignmentDocuments.js";

export function AssignmentPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <div>
      <DeveloperHeader title={t("assignment.header")} />
      <main className="shell assignment-shell">
        <ViewTitle eyebrow={t("assignment.eyebrow")} title={t("assignment.title")}>
          <div className="assignment-docs">
            {assignmentDocuments.map((document) => (
              <article key={document.file} className="assignment-doc">
                <h2>{document.title[lang] ?? document.title.bg}</h2>
                {document.sections.map((section) => (
                  <section key={section.title.bg} className="assignment-section">
                    <h3>{section.title[lang] ?? section.title.bg}</h3>
                    {section.paragraphs?.map((paragraph) => (
                      <p key={paragraph.bg}>{paragraph[lang] ?? paragraph.bg}</p>
                    ))}
                    {section.items && (
                      <ul>
                        {section.items.map((item) => (
                          <li key={item.bg}>{item[lang] ?? item.bg}</li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </article>
            ))}
          </div>
        </ViewTitle>
      </main>
    </div>
  );
}
