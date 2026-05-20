export function Info({ rows }) {
  return <div className="info-list">{rows.map(([key, value]) => <div key={key}><span>{key}</span><strong>{value}</strong></div>)}</div>;
}
