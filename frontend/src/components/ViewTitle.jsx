export function ViewTitle({ eyebrow, title, action, children }) {
  return <section><div className="section-heading"><div><h2>{title}</h2></div>{action}</div>{children}</section>;
}
