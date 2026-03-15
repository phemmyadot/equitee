// Auth route group layout — no AppShell, no Header, no Nav.
// Login and register pages render standalone full-page UIs.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
