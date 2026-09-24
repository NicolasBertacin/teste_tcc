/**
 * Header.jsx
 * Cabeçalho com logo futurista e título da marca TrendEcommerce.
 */

function Header() {
    return (
        <header className="logo-header">
            <div className="logo-icon-wrap">
                <svg className="logo-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="44" stroke="#00b4d8" strokeWidth="2" strokeDasharray="8 6" opacity="0.75" />
                    <circle cx="50" cy="50" r="36" stroke="#0077b6" strokeWidth="1.5" opacity="0.6" />
                    <circle cx="50" cy="28" r="1.5" fill="#00d4ff" />
                    <circle cx="20" cy="50" r="3.5" fill="#00d4ff" />
                    <circle cx="80" cy="50" r="3.5" fill="#00d4ff" />
                    <circle cx="50" cy="14" r="2.5" fill="#48cae4" />
                    <circle cx="50" cy="86" r="2.5" fill="#48cae4" />
                    <line x1="23" y1="50" x2="33" y2="50" stroke="#00b4d8" strokeWidth="1.8" />
                    <line x1="67" y1="50" x2="77" y2="50" stroke="#00b4d8" strokeWidth="1.8" />
                    <path d="M34 33 H66 M50 33 V67" stroke="#00e5ff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M35 62 L48 48 L58 56 L72 38" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M64 38 H72 V46" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="35" cy="62" r="3" fill="#38bdf8" />
                    <circle cx="48" cy="48" r="3" fill="#38bdf8" />
                    <circle cx="58" cy="56" r="3" fill="#38bdf8" />
                    <circle cx="72" cy="38" r="3.5" fill="#00f0ff" />
                </svg>
            </div>
            <div className="logo-text-wrap">
                <h1 className="logo-title">
                    <span className="logo-accent">Trend</span>
                    <span className="logo-main">Ecommerce</span>
                </h1>
                <p className="logo-subtitle">SISTEMA PREDITIVO DE VENDAS E INTELIGÊNCIA DE DADOS</p>
            </div>
        </header>
    );
}
