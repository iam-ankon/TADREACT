import { useNavigate } from "react-router-dom";
import logo from "../../assets/texweave_Logo_1.png";
import React, { useEffect, useRef, useState } from "react";
import {
  FiAlertCircle, FiArrowRight, FiCheckCircle, FiEye, FiEyeOff, FiHash, FiLock, FiShield, FiUser,
} from "react-icons/fi";
import { loginUser, debugAuth } from "../../api/employeeApi";
import { homePath } from "../../utils/routeAccess";

const FIELDS = [
  { id: "employee_id", label: "Employee ID", icon: FiHash, autoComplete: "off" },
  { id: "username", label: "Username", icon: FiUser, autoComplete: "username" },
  { id: "password", label: "Password", icon: FiLock, autoComplete: "current-password" },
];

const dhakaNow = () => {
  const now = new Date();
  const opts = { timeZone: "Asia/Dhaka" };
  return {
    time: now.toLocaleTimeString("en-US", { ...opts, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }),
    date: now.toLocaleDateString("en-GB", { ...opts, weekday: "long", day: "numeric", month: "long", year: "numeric" }),
  };
};

const LoginPage = () => {
  const [form, setForm] = useState({ employee_id: "", username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clock, setClock] = useState(dhakaNow);
  const rootRef = useRef(null);
  const cardRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Already logged in → same home page as the URL guard.
    if (localStorage.getItem("token")) navigate(homePath());
  }, [navigate]);

  useEffect(() => {
    const t = setInterval(() => setClock(dhakaNow()), 1000);
    return () => clearInterval(t);
  }, []);

  // Spotlight + card tilt follow the pointer (CSS variables, no re-render).
  const onPointerMove = (e) => {
    const root = rootRef.current;
    if (!root) return;
    root.style.setProperty("--mx", `${e.clientX}px`);
    root.style.setProperty("--my", `${e.clientY}px`);
    const card = cardRef.current;
    if (card) {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--rx", `${(-y * 4).toFixed(2)}deg`);
      card.style.setProperty("--ry", `${(x * 6).toFixed(2)}deg`);
      card.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(1)}%`);
      card.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(1)}%`);
    }
  };

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const missing = FIELDS.find((f) => !form[f.id].trim());
    if (missing) {
      setError(`${missing.label} is required`);
      return;
    }
    setError("");
    setLoading(true);
    try {
      await loginUser({
        username: form.username.trim(),
        password: form.password.trim(),
        employee_id: form.employee_id.trim(),
        designation: "",
        department: "",
        email: "",
      });
      debugAuth();
      if (!localStorage.getItem("employee_id") || !localStorage.getItem("employee_name")) {
        throw new Error("User data not properly stored after login");
      }
      setSuccess(true);
      setTimeout(() => navigate(homePath()), 900);
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="fx-root" ref={rootRef} onPointerMove={onPointerMove}>
      <style>{CSS}</style>

      {/* Background layers */}
      <div className="fx-aurora" aria-hidden="true">
        <span className="a1" /><span className="a2" /><span className="a3" />
      </div>
      <div className="fx-grid" aria-hidden="true" />
      <div className="fx-spot" aria-hidden="true" />
      <div className="fx-noise" aria-hidden="true" />

      <div className="fx-layout">
        <section className="fx-hero">
          <img src={logo} alt="TAD Group" className="fx-logo" />
          <div className="fx-status"><span className="fx-pulse" /> Secure portal · online</div>
          <h1>
            Welcome back to<br />
            <span className="fx-gradient">TAD Group</span>
          </h1>
          <p className="fx-lead">Sign in with your employee account to continue where you left off.</p>
          <div className="fx-clock">
            <span className="fx-time">{clock.time}</span>
            <span className="fx-date">{clock.date} · Dhaka</span>
          </div>
        </section>

        <section className={`fx-card ${success ? "is-success" : ""} ${error ? "is-error" : ""}`} ref={cardRef}>
          <div className="fx-card-glow" aria-hidden="true" />
          <div className="fx-card-body">
            <img src={logo} alt="TAD Group" className="fx-logo-mobile" />
            <div className="fx-card-head">
              <span className="fx-badge"><FiShield /></span>
              <div>
                <h2>Sign in</h2>
                <p>Authorized personnel only</p>
              </div>
            </div>

            {error && (
              <div className="fx-alert error" role="alert" key={error}>
                <FiAlertCircle /> <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="fx-alert success" role="status">
                <FiCheckCircle /> <span>Access granted. Redirecting…</span>
              </div>
            )}

            <form onSubmit={handleLogin} noValidate>
              {FIELDS.map(({ id, label, icon: Icon, autoComplete }, i) => {
                const isPassword = id === "password";
                return (
                  <div className="fx-field" key={id}>
                    <Icon className="fx-icon" />
                    <input
                      id={id}
                      type={isPassword && !showPassword ? "password" : "text"}
                      value={form[id]}
                      onChange={(e) => set(id, e.target.value)}
                      placeholder=" "
                      autoComplete={autoComplete}
                      disabled={loading || success}
                      autoFocus={i === 0}
                    />
                    <label htmlFor={id}>{label}</label>
                    <span className="fx-underline" />
                    {isPassword && (
                      <button
                        type="button"
                        className="fx-eye"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        tabIndex={-1}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    )}
                  </div>
                );
              })}

              <button type="submit" className="fx-submit" disabled={loading || success}>
                <span className="fx-submit-inner">
                  {success ? (
                    <><FiCheckCircle /> Signed in</>
                  ) : loading ? (
                    <><span className="fx-spinner" /> Verifying…</>
                  ) : (
                    <>Sign in <FiArrowRight className="fx-arrow" /></>
                  )}
                </span>
              </button>
            </form>

            <p className="fx-help">Trouble signing in? Contact the Software Development team.</p>
          </div>
        </section>
      </div>

      <footer className="fx-foot">
        <span>© {new Date().getFullYear()} TEXWEAVE. All rights reserved.</span>
        <span className="fx-disclaimer">
          Transactions over the internet may be subject to interruption or delayed transmission.
          TEXWEAVE cannot assume responsibility for malfunctions in communications facilities not under its control.
        </span>
      </footer>
    </div>
  );
};

const CSS = `
.fx-root {
  --bg: #050a14; --ink: #e6edf7; --muted: #8b9bb4; --line: rgba(148,163,184,.16);
  --c1: #3b82f6; --c2: #22d3ee; --c3: #8b5cf6;
  --mx: 50vw; --my: 40vh;
  position: relative; min-height: 100vh; overflow: hidden; color: var(--ink); background: var(--bg);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex; flex-direction: column;
}
.fx-root *, .fx-root *::before, .fx-root *::after { box-sizing: border-box; }

/* ---------- background ---------- */
.fx-aurora { position: absolute; inset: -20%; filter: blur(80px); opacity: .55; pointer-events: none; }
.fx-aurora span { position: absolute; border-radius: 50%; mix-blend-mode: screen; }
.fx-aurora .a1 { width: 46vw; height: 46vw; left: 4%; top: 6%; background: radial-gradient(circle, var(--c1), transparent 65%); animation: fx-drift1 22s ease-in-out infinite alternate; }
.fx-aurora .a2 { width: 40vw; height: 40vw; right: 2%; top: 22%; background: radial-gradient(circle, var(--c3), transparent 65%); animation: fx-drift2 26s ease-in-out infinite alternate; }
.fx-aurora .a3 { width: 36vw; height: 36vw; left: 34%; bottom: 0; background: radial-gradient(circle, var(--c2), transparent 65%); opacity: .7; animation: fx-drift3 30s ease-in-out infinite alternate; }
@keyframes fx-drift1 { to { transform: translate(12vw, 10vh) scale(1.15); } }
@keyframes fx-drift2 { to { transform: translate(-14vw, 8vh) scale(.9); } }
@keyframes fx-drift3 { to { transform: translate(8vw, -14vh) scale(1.1); } }

.fx-grid {
  position: absolute; left: -50%; right: -50%; bottom: -10%; height: 70%; pointer-events: none;
  background-image: linear-gradient(rgba(96,165,250,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,.22) 1px, transparent 1px);
  background-size: 64px 64px;
  transform: perspective(700px) rotateX(62deg); transform-origin: center top;
  mask-image: linear-gradient(to top, rgba(0,0,0,.9), transparent 85%);
  -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,.9), transparent 85%);
  animation: fx-grid 14s linear infinite;
}
@keyframes fx-grid { to { background-position: 0 64px, 0 0; } }
.fx-spot { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(520px circle at var(--mx) var(--my), rgba(56,189,248,.12), transparent 60%); transition: background .08s; }
.fx-noise { position: absolute; inset: 0; pointer-events: none; opacity: .05; background-image: radial-gradient(rgba(255,255,255,.8) 1px, transparent 1px); background-size: 3px 3px; }

/* ---------- layout ---------- */
.fx-layout { position: relative; z-index: 1; flex: 1; width: 100%; max-width: 1180px; margin: 0 auto; padding: 48px 32px 24px;
  display: grid; grid-template-columns: 1.1fr 440px; gap: 64px; align-items: center; }

.fx-hero { animation: fx-rise .8s cubic-bezier(.2,.7,.2,1) both; }
.fx-logo { width: 140px; margin-bottom: 40px; filter: drop-shadow(0 4px 24px rgba(59,130,246,.35)); }
.fx-status { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 500; letter-spacing: .02em;
  color: #a5f3fc; background: rgba(34,211,238,.08); border: 1px solid rgba(34,211,238,.25); margin-bottom: 22px; }
.fx-pulse { width: 8px; height: 8px; border-radius: 50%; background: #22d3ee; box-shadow: 0 0 0 0 rgba(34,211,238,.6); animation: fx-pulse 2s infinite; }
@keyframes fx-pulse { 70% { box-shadow: 0 0 0 10px rgba(34,211,238,0); } 100% { box-shadow: 0 0 0 0 rgba(34,211,238,0); } }
.fx-hero h1 { font-size: clamp(34px, 4.2vw, 52px); line-height: 1.08; font-weight: 700; letter-spacing: -.03em; margin: 0 0 18px; }
.fx-gradient { background: linear-gradient(90deg, #60a5fa, #22d3ee 45%, #a78bfa 90%); background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text; color: transparent; animation: fx-shine 6s linear infinite; }
@keyframes fx-shine { to { background-position: 200% center; } }
.fx-lead { font-size: 16px; line-height: 1.6; color: var(--muted); max-width: 440px; margin: 0 0 40px; }
.fx-clock { display: inline-flex; flex-direction: column; gap: 4px; padding: 16px 20px; border-radius: 14px;
  background: rgba(15,23,42,.45); border: 1px solid var(--line); backdrop-filter: blur(8px); }
.fx-time { font-size: 30px; font-weight: 600; letter-spacing: .04em; font-variant-numeric: tabular-nums; }
.fx-date { font-size: 12.5px; color: var(--muted); }

/* ---------- card ---------- */
.fx-card { position: relative; border-radius: 22px; padding: 1px;
  background: linear-gradient(140deg, rgba(96,165,250,.55), rgba(148,163,184,.12) 40%, rgba(167,139,250,.5));
  transform: perspective(1200px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  transition: transform .25s ease-out, box-shadow .3s;
  box-shadow: 0 30px 80px -20px rgba(2,6,23,.9), 0 0 60px -20px rgba(59,130,246,.45);
  animation: fx-rise .8s .12s cubic-bezier(.2,.7,.2,1) both; }
.fx-card.is-error { animation: fx-shake .4s; }
.fx-card.is-success { box-shadow: 0 30px 80px -20px rgba(2,6,23,.9), 0 0 70px -10px rgba(34,197,94,.55); }
@keyframes fx-shake { 20%, 60% { translate: -6px 0; } 40%, 80% { translate: 6px 0; } }
.fx-card-glow { position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: radial-gradient(360px circle at var(--gx, 50%) var(--gy, 0%), rgba(96,165,250,.25), transparent 60%); }
.fx-card-body { position: relative; border-radius: 21px; padding: 34px 32px 26px;
  background: linear-gradient(180deg, rgba(15,23,42,.82), rgba(10,15,30,.9)); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
.fx-logo-mobile { display: none; }
.fx-card-head { display: flex; align-items: center; gap: 14px; margin-bottom: 26px; }
.fx-badge { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; font-size: 20px; color: #bfdbfe;
  background: linear-gradient(140deg, rgba(59,130,246,.35), rgba(139,92,246,.25)); border: 1px solid rgba(147,197,253,.3); }
.fx-card-head h2 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -.01em; }
.fx-card-head p { margin: 2px 0 0; font-size: 12.5px; color: var(--muted); }

.fx-alert { display: flex; gap: 8px; align-items: flex-start; padding: 10px 12px; border-radius: 10px; font-size: 13px; line-height: 1.4; margin-bottom: 18px; border: 1px solid; animation: fx-rise .3s both; }
.fx-alert svg { flex-shrink: 0; margin-top: 2px; }
.fx-alert.error { color: #fecaca; background: rgba(239,68,68,.12); border-color: rgba(248,113,113,.35); }
.fx-alert.success { color: #bbf7d0; background: rgba(34,197,94,.12); border-color: rgba(74,222,128,.35); }

/* floating-label fields */
.fx-field { position: relative; margin-bottom: 16px; }
.fx-field input { width: 100%; height: 54px; padding: 20px 44px 6px 44px; border-radius: 12px; outline: none;
  font: inherit; font-size: 14.5px; color: var(--ink); background: rgba(2,6,23,.55); border: 1px solid var(--line);
  transition: border-color .2s, background .2s, box-shadow .2s; }
.fx-field input:hover:not(:disabled) { border-color: rgba(148,163,184,.32); }
/* !important: merchandiser pages inject a global input:focus rule (light focus ring, !important). */
.fx-field input:focus { border-color: rgba(96,165,250,.8) !important; background: rgba(2,6,23,.75) !important;
  box-shadow: 0 0 0 4px rgba(59,130,246,.15), 0 0 24px -6px rgba(59,130,246,.6) !important; }
.fx-field input:disabled { opacity: .6; }
/* Chrome autofill / suggestion preview paints the field white — keep it dark. */
.fx-field input:-webkit-autofill, .fx-field input:-webkit-autofill:hover, .fx-field input:-webkit-autofill:focus, .fx-field input:autofill {
  -webkit-text-fill-color: var(--ink) !important; caret-color: var(--ink);
  -webkit-box-shadow: 0 0 0 1000px #0b1324 inset !important; box-shadow: 0 0 0 1000px #0b1324 inset !important;
  transition: background-color 99999s ease-out 0s; }
.fx-field input:-webkit-autofill:focus { box-shadow: 0 0 0 1000px #0b1324 inset, 0 0 0 4px rgba(59,130,246,.15) !important; }
.fx-field label { position: absolute; left: 44px; top: 50%; transform: translateY(-50%); font-size: 14px; color: var(--muted);
  pointer-events: none; transition: top .18s, font-size .18s, color .18s, transform .18s; }
.fx-field input:focus + label, .fx-field input:not(:placeholder-shown) + label, .fx-field input:-webkit-autofill + label {
  top: 15px; transform: none; font-size: 11px; letter-spacing: .04em; text-transform: uppercase; color: #93c5fd; }
.fx-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); font-size: 16px; color: #64748b; transition: color .2s; z-index: 1; }
.fx-field:focus-within .fx-icon { color: #60a5fa; }
.fx-underline { position: absolute; left: 14px; right: 14px; bottom: 0; height: 2px; border-radius: 2px; transform: scaleX(0);
  background: linear-gradient(90deg, var(--c1), var(--c2), var(--c3)); transition: transform .3s; }
.fx-field:focus-within .fx-underline { transform: scaleX(1); }
.fx-eye { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 34px; height: 34px; display: grid; place-items: center;
  border: none; border-radius: 9px; background: none; color: var(--muted); font-size: 16px; cursor: pointer; }
.fx-eye:hover { color: var(--ink); background: rgba(148,163,184,.12); }

.fx-submit { position: relative; width: 100%; height: 52px; margin-top: 8px; padding: 0; border: none; border-radius: 12px; cursor: pointer; overflow: hidden;
  font: inherit; font-size: 15px; font-weight: 600; color: #fff;
  background: linear-gradient(100deg, #2563eb, #0891b2 55%, #7c3aed); background-size: 180% 100%;
  box-shadow: 0 10px 30px -10px rgba(37,99,235,.8); transition: background-position .5s, box-shadow .3s, transform .08s; }
.fx-submit::after { content: ""; position: absolute; top: 0; bottom: 0; width: 40%; left: -60%;
  background: linear-gradient(100deg, transparent, rgba(255,255,255,.35), transparent); transform: skewX(-20deg); }
.fx-submit:hover:not(:disabled) { background-position: 100% 0; box-shadow: 0 14px 36px -10px rgba(124,58,237,.8); }
.fx-submit:hover:not(:disabled)::after { animation: fx-sheen .9s; }
.fx-submit:active:not(:disabled) { transform: translateY(1px); }
.fx-submit:disabled { cursor: default; opacity: .9; }
.fx-root .fx-card.is-success .fx-submit { background: linear-gradient(100deg, #16a34a, #059669); }
@keyframes fx-sheen { to { left: 130%; } }
.fx-submit-inner { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 8px; }
.fx-arrow { transition: transform .2s; }
.fx-submit:hover .fx-arrow { transform: translateX(4px); }
.fx-spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; animation: fx-spin .7s linear infinite; }
@keyframes fx-spin { to { transform: rotate(360deg); } }
.fx-help { margin: 18px 0 0; text-align: center; font-size: 12px; color: #64748b; }

@keyframes fx-rise { from { opacity: 0; transform: translateY(16px); } }

/* ---------- footer ---------- */
.fx-foot { position: relative; z-index: 1; display: flex; justify-content: space-between; gap: 24px; flex-wrap: wrap;
  max-width: 1180px; width: 100%; margin: 0 auto; padding: 16px 32px 22px; font-size: 11px; color: #5b6b84; border-top: 1px solid rgba(148,163,184,.08); }
.fx-disclaimer { max-width: 620px; text-align: right; line-height: 1.5; }

@media (max-width: 980px) {
  .fx-layout { grid-template-columns: 1fr; gap: 32px; padding: 28px 18px 16px; max-width: 480px; }
  .fx-hero { display: none; }
  .fx-logo-mobile { display: block; width: 110px; margin: 0 auto 22px; }
  .fx-card { transform: none; }
  .fx-foot { flex-direction: column; text-align: center; padding: 14px 18px 18px; }
  .fx-disclaimer { text-align: center; }
}
@media (prefers-reduced-motion: reduce) {
  .fx-root *, .fx-root *::before, .fx-root *::after { animation: none !important; transition: none !important; }
  .fx-card { transform: none; }
}
`;

export default LoginPage;
