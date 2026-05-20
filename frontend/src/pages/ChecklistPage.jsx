import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { checklistTasks } from "../data/checklistTasks.js";
import { DeveloperHeader } from "../components/DeveloperHeader.jsx";
import { Metric } from "../components/Metric.jsx";
import { ViewTitle } from "../components/ViewTitle.jsx";

const readState = () => fetch("/task-state.json").then((r) => (r.ok ? r.json() : {}));
const writeState = (state) =>
  fetch("/task-state.json", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  }).then((r) => r.json());

export function ChecklistPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const importRef = useRef(null);
  const [completed, setCompleted] = useState({});
  const [message, setMessage] = useState(() => t("checklist.loading"));

  useEffect(() => {
    readState()
      .then((state) => {
        setCompleted(state);
        setMessage(t("checklist.loaded"));
      })
      .catch((error) => setMessage(error.message));
  }, []);

  const toggle = (id) => {
    setCompleted((current) => {
      const next = { ...current };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      saveState(next);
      return next;
    });
  };

  const saveState = async (state) => {
    try {
      const saved = await writeState(state);
      setCompleted(saved);
      setMessage(t("checklist.saved"));
    } catch (error) {
      setMessage(error.message);
    }
  };

  const exportState = () => {
    const blob = new Blob([`${JSON.stringify(completed, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "task-state.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importState = async (event) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    try {
      const state = JSON.parse(await file.text());
      await saveState(state);
      setMessage(t("checklist.imported"));
    } catch (error) {
      setMessage(t("checklist.invalidJson", { error: error.message }));
    } finally {
      event.currentTarget.value = "";
    }
  };

  const doneCount = checklistTasks.filter((task) => completed[task.id]).length;
  const byOwner = ["Daniel Georgiev", "Stati Kosev", "Samuil Dimov"].map((owner) => {
    const ownerTasks = checklistTasks.filter((task) => task.owner === owner);
    const ownerDone = ownerTasks.filter((task) => completed[task.id]).length;
    return { owner, done: ownerDone, total: ownerTasks.length };
  });

  return (
    <div>
      <DeveloperHeader title={t("checklist.header")} />
      <main className="shell checklist-shell">
        <ViewTitle
          eyebrow={t("checklist.eyebrow")}
          title={t("checklist.title")}
          action={
            <div className="developer-actions">
              <button type="button" className="secondary" onClick={exportState}>{t("checklist.export")}</button>
              <button type="button" onClick={() => importRef.current?.click()}>{t("checklist.import")}</button>
              <input ref={importRef} className="hidden-file" type="file" accept="application/json,.json" onChange={importState} />
            </div>
          }
        >
          <div className="alert">{message}</div>
          <div className="metrics">
            <Metric value={`${doneCount}/${checklistTasks.length}`} label={t("checklist.completed")} />
            {byOwner.map((item) => (
              <Metric key={item.owner} value={`${item.done}/${item.total}`} label={item.owner} />
            ))}
          </div>
          <div className="checklist-table">
            <table>
              <thead>
                <tr>
                  <th>{t("checklist.colStatus")}</th>
                  <th>{t("checklist.colTask")}</th>
                  <th>{t("checklist.colArea")}</th>
                  <th>{t("checklist.colDev")}</th>
                </tr>
              </thead>
              <tbody>
                {checklistTasks.map((task) => (
                  <tr key={task.id} className={completed[task.id] ? "completed-row" : ""}>
                    <td>
                      <label className="check-toggle">
                        <input type="checkbox" checked={Boolean(completed[task.id])} onChange={() => toggle(task.id)} />
                        <span>{completed[task.id] ? t("checklist.done") : t("checklist.notDone")}</span>
                      </label>
                    </td>
                    <td>{task.title[lang] ?? task.title.bg}</td>
                    <td>{task.area[lang] ?? task.area.bg}</td>
                    <td>{task.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ViewTitle>
      </main>
    </div>
  );
}
