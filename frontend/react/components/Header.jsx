/**
 * Header.jsx
 * Cabeçalho com logo futurista e título da marca TrendEcommerce.
 */

function Header() {
    return (
        <header className="logo-header">
            <div className="logo-icon-wrap">
                <img src="img/logo.png" alt="TrendEcommerce Logo" className="logo-img" />
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
