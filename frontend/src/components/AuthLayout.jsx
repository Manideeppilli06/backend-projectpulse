import './AuthLayout.css';

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="auth">
      <aside className="auth-brand">
        <div className="auth-logo">
          <span className="auth-logo-mark">P</span>
          ProjectPulse
        </div>

        <div>
          <h2>Plan work. Track progress. Together.</h2>
          <p>
            A calm workspace for your team's boards, tasks and conversations,
            with everyone in sync.
          </p>
        </div>

        <small>Real-time project monitoring and collaboration</small>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
          <p className="auth-footer muted">{footer}</p>
        </div>
      </main>
    </div>
  );
}