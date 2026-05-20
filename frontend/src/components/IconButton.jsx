export function IconButton({ icon: Icon, children, ...props }) {
  return <button {...props}><Icon size={16} /> {children}</button>;
}
