/**
 * TopHeader.jsx
 * Barra superior de status do Dashboard com indicador em tempo real da IA.
 */

function TopHeader() {
    return (
        <header className="dash-top-header">
            <div className="dash-header-left">
                <span className="hud-status-dot"></span>
                <span className="hud-status-text">MOTOR PREDITIVO XGBOOST ATIVO</span>
            </div>
            <div className="dash-header-right">
                <div className="dash-brand-logo">
                    <svg className="dash-brand-svg" viewBox="0 0 100 100" fill="none">
                        <circle cx="50" cy="50" r="44" stroke="#00b4d8" strokeWidth="3" strokeDasharray="8 6" />
                        <circle cx="50" cy="50" r="32" stroke="#0077b6" strokeWidth="2" />
                        <path d="M34 34 H66 M50 34 V66" stroke="#00e5ff" strokeWidth="4.5" strokeLinecap="round" />
                        <path d="M35 62 L48 48 L58 56 L72 38" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
                    </svg>
                    <span className="dash-brand-title">
                        <span className="logo-accent">Trend</span>
                        <span className="logo-main">Ecommerce</span>
                    </span>
                </div>
            </div>
        </header>
    );
}
