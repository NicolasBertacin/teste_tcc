/**
 * AnaliseEspecificaTab.jsx
 * Aba Análise Específica: Busca preditiva de produto e projeções com XGBoost (7/14/30 dias).
 */

function AnaliseEspecificaTab({ products, showToast }) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState([]);
    const [showDropdown, setShowDropdown] = React.useState(false);
    const [selectedProduct, setSelectedProduct] = React.useState(null);
    const [horizonDays, setHorizonDays] = React.useState(7);
    const [forecast, setForecast] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const canvasRef = React.useRef(null);
    const [tooltipPos, setTooltipPos] = React.useState({ x: 180, y: 70, label: 'AUMENTO DE 107 VENDAS' });

    React.useEffect(() => {
        if (products.length > 0 && !selectedProduct) {
            setSelectedProduct(products[0]);
        }
    }, [products]);

    React.useEffect(() => {
        if (selectedProduct) {
            runForecast(selectedProduct.id, horizonDays);
        }
    }, [selectedProduct, horizonDays]);

    React.useEffect(() => {
        let animFrame;

        const handleResize = () => {
            cancelAnimationFrame(animFrame);
            animFrame = requestAnimationFrame(() => {
                if (canvasRef.current && forecast) {
                    drawSpecificChart(forecast);
                }
            });
        };

        window.addEventListener('resize', handleResize);

        let observer = null;
        if (canvasRef.current && canvasRef.current.parentElement) {
            observer = new ResizeObserver(() => {
                handleResize();
            });
            observer.observe(canvasRef.current.parentElement);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animFrame);
            if (observer) observer.disconnect();
        };
    }, [forecast]);

    const handleSearchInput = (val) => {
        setSearchQuery(val);
        if (!val.trim()) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        const matches = products.filter((p) =>
            p.title.toLowerCase().includes(val.toLowerCase()) ||
            (p.category && p.category.toLowerCase().includes(val.toLowerCase()))
        ).slice(0, 6);

        setSearchResults(matches);
        setShowDropdown(true);
    };

    const handleSelectProduct = (prod) => {
        setSelectedProduct(prod);
        setSearchQuery(prod.title);
        setShowDropdown(false);
    };

    const runForecast = async (productId, days) => {
        setLoading(true);
        try {
            showToast('Calculando projeção com XGBoost...', 'info', 1800);
            const data = await window.apiService.forecast.predict(productId, days);
            setForecast(data);
            drawSpecificChart(data);
        } catch (err) {
            showToast('Erro na previsão: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const drawSpecificChart = (data) => {
        const canvas = canvasRef.current;
        if (!canvas || !data || !data.days || !canvas.parentElement) return;

        const parentW = canvas.parentElement.getBoundingClientRect().width || canvas.parentElement.clientWidth;
        if (!parentW || parentW <= 0) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = Math.round(parentW);
        const height = canvas.height = 300;

        ctx.clearRect(0, 0, width, height);

        const days = data.days;
        const values = days.map((d) => d.predicted_demand);
        const maxVal = Math.max(400, ...values.map((v) => v * 1.3));

        const padLeft = 45;
        const padRight = 30;
        const padTop = 40;
        const padBottom = 40;

        const chartW = width - padLeft - padRight;
        const chartH = height - padTop - padBottom;

        // Grid Horizontal
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#8da2bd';
        ctx.font = '12px Plus Jakarta Sans';
        ctx.textAlign = 'right';

        [0, 100, 200, 300, 400].forEach((lvl) => {
            const y = padTop + chartH - (lvl / maxVal) * chartH;
            ctx.beginPath();
            ctx.moveTo(padLeft, y);
            ctx.lineTo(width - padRight, y);
            ctx.stroke();
            ctx.fillText(lvl.toString(), padLeft - 10, y + 4);
        });

        // Pontos X, Y
        const points = days.map((d, i) => {
            const x = padLeft + (i / Math.max(1, days.length - 1)) * chartW;
            const y = padTop + chartH - (d.predicted_demand / maxVal) * chartH;
            return { x, y, d };
        });

        // Labels X
        ctx.textAlign = 'center';
        points.forEach((p) => {
            const label = days.length <= 7 ? p.d.day_name.substring(0, 3) : p.d.date.substring(0, 5);
            ctx.fillText(label, p.x, height - 12);
        });

        // Área Preenchida com Gradiente
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.lineTo(points[points.length - 1].x, padTop + chartH);
        ctx.lineTo(points[0].x, padTop + chartH);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
        grad.addColorStop(0, 'rgba(0, 180, 216, 0.35)');
        grad.addColorStop(1, 'rgba(0, 180, 216, 0.02)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Linha Principal
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Círculos
        points.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#00f0ff';
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#00d4ff';
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.strokeStyle = '#07172b';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        });

        const peak = points[1] || points[0];
        setTooltipPos({
            x: peak.x - 75,
            y: peak.y - 65,
            label: `AUMENTO DE ${peak.d.predicted_demand} VENDAS`
        });
    };

    return (
        <section className="dash-tab-content active">
            {/* Search Bar */}
            <div className="specific-search-wrap">
                <div className="search-input-box">
                    <input
                        type="text"
                        className="specific-search-input"
                        placeholder="Digite o produto que deseja fazer análise..."
                        value={searchQuery}
                        onChange={(e) => handleSearchInput(e.target.value)}
                    />
                    <svg className="search-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>

                {showDropdown && searchResults.length > 0 && (
                    <div className="search-results-dropdown">
                        {searchResults.map((prod) => (
                            <div
                                key={prod.id}
                                className="search-item"
                                onClick={() => handleSelectProduct(prod)}
                            >
                                <span className="search-item-title">{prod.title}</span>
                                <span className="search-item-price">
                                    R$ {prod.price ? prod.price.toFixed(2) : '0.00'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Product Detail Analysis Card */}
            <div className="dash-card specific-analysis-card">
                <div className="specific-card-header">
                    <h2 className="specific-prod-title">
                        {selectedProduct ? selectedProduct.title.toUpperCase() : 'IPHONE 15 PRO MAX'}
                    </h2>
                    <div className="specific-prod-price">
                        PREÇO: R$ {selectedProduct?.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '4.342,98'}
                    </div>
                </div>

                {/* Horizon Toggle Buttons */}
                <div className="horizon-toggle-bar">
                    <span className="horizon-label">Horizonte de Previsão IA:</span>
                    {[7, 14, 30].map((days) => (
                        <button
                            key={days}
                            type="button"
                            className={`horizon-btn ${horizonDays === days ? 'active' : ''}`}
                            onClick={() => setHorizonDays(days)}
                        >
                            {days} DIAS
                        </button>
                    ))}
                </div>

                {/* Chart Container */}
                <div className="specific-chart-wrap">
                    <canvas ref={canvasRef}></canvas>
                    <div
                        className="specific-chart-tooltip"
                        style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
                    >
                        <div className="tooltip-badge">+5%</div>
                        <div className="tooltip-main-text">{tooltipPos.label}</div>
                    </div>
                </div>

                {/* AI Confidence & Buffer Indicators */}
                <div className="kpi-grid">
                    <div className="kpi-box">
                        <span className="kpi-title">DEMANDA TOTAL PROJETADA</span>
                        <span className="kpi-val">
                            {forecast ? `${forecast.total_predicted_units} un` : '107 un'}
                        </span>
                    </div>
                    <div className="kpi-box">
                        <span className="kpi-title">FATURAMENTO ESTIMADO</span>
                        <span className="kpi-val text-cyan">
                            {forecast ? `R$ ${forecast.total_projected_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 464.698,86'}
                        </span>
                    </div>
                    <div className="kpi-box">
                        <span className="kpi-title">MÉDIA DIÁRIA PROJETADA</span>
                        <span className="kpi-val">
                            {forecast ? `${forecast.daily_average} un/dia` : '15.3 un/dia'}
                        </span>
                    </div>
                    <div className="kpi-box">
                        <span className="kpi-title">ESTOQUE DE SEGURANÇA SUGERIDO</span>
                        <span className="kpi-val text-emerald">
                            {forecast ? `${forecast.recommended_stock_buffer} un` : '135 un'}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
