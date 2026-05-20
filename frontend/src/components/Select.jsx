import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export function Select({ name, label, items, render }) {
  return <label>{label}<select name={name}>{items.map((item) => <option key={item.id} value={item.id}>{render(item)}</option>)}</select></label>;
}

export function SearchableSelect({ name, label, items, render, searchText }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    if (!normalizedQuery) return items;
    return items.filter((item) => searchText(item).toLowerCase().includes(normalizedQuery));
  }, [items, normalizedQuery, searchText]);

  return (
    <label>
      {label}
      <input
        type="search"
        placeholder={t("fields.search")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <select name={name} required>
        {filteredItems.map((item) => (
          <option key={item.id} value={item.id}>{render(item)}</option>
        ))}
      </select>
    </label>
  );
}
