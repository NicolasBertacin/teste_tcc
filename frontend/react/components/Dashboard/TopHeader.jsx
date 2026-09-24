/**
 * TopHeader.jsx
 * Barra superior de status do Dashboard com indicador em tempo real da IA.
 */

function TopHeader({ isSidebarOpen = true, onToggleSidebar }) {
    return (
        <header className="dash-top-header">
            <div className="dash-header-left">
                <button
                    type="button"
                    className="sidebar-toggle-btn"
                    onClick={onToggleSidebar}
                    title={isSidebarOpen ? "Fechar menu lateral" : "Abrir menu lateral"}
                    aria-label={isSidebarOpen ? "Fechar menu lateral" : "Abrir menu lateral"}
                >
                    <span className="toggle-dot"></span>
                    <span className="toggle-dot"></span>
                    <span className="toggle-dot"></span>
                </button>
                <div className="hud-status-wrapper">
                    <span className="hud-status-dot"></span>
                    <span className="hud-status-text">MOTOR PREDITIVO XGBOOST ATIVO</span>
                </div>
            </div>
            <div className="dash-header-right">
                <div className="dash-brand-logo">
                    <img src="img/logo.png" alt="TrendEcommerce Logo" className="dash-brand-img" />
                    <span className="dash-brand-title">
                        <span className="logo-accent">Trend</span>
                        <span className="logo-main">Ecommerce</span>
                    </span>
                </div>
            </div>
        </header>
    );
}
