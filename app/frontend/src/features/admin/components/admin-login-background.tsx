export function AdminLoginBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="admin-login-surface absolute inset-0" />
      <div className="admin-login-orb admin-login-orb-a" />
      <div className="admin-login-orb admin-login-orb-b" />
      <div className="admin-login-orb admin-login-orb-c" />
      <div className="admin-login-vignette absolute inset-0" />
    </div>
  );
}
