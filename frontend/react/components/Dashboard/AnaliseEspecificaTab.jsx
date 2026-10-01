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

    const [discovering, setDiscovering] = React.useState(false);

    const handleSearchInput = (val) => {
        setSearchQuery(val);
        if (!val.trim()) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        const rawTokens = val.toLowerCase().trim().split(/\s+/).filter((t) => t.length >= 2);

        const scoredMatches = (products || []).map((p) => {
            const titleLower = p.title.toLowerCase();
            const catLower = (p.category || '').toLowerCase();
            let score = 0;

            if (titleLower.includes(val.toLowerCase().trim())) {
                score += 10;
            }

            rawTokens.forEach((token) => {
                if (titleLower.includes(token)) score += 3;
                if (catLower.includes(token)) score += 1;
            });

            return { product: p, score };
        }).filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((item) => item.product)
          .slice(0, 6);

        setSearchResults(scoredMatches);
        setShowDropdown(true);
    };

    const handleSelectProduct = (prod) => {
        setSelectedProduct(prod);
        setSearchQuery(prod.title);
        setShowDropdown(false);
    };

    const handleLiveDiscovery = async (term) => {
        const q = term || searchQuery;
        if (!q || !q.trim()) return;

        setDiscovering(true);
        showToast(`Buscando "${q.trim()}" em tempo real na Amazon e Mercado Livre...`, 'info', 4000);
        try {
            const res = await window.apiService.products.discoverLive(q.trim(), 5);
            if (res && res.products && res.products.length > 0) {
                const first = res.products[0];
                setSelectedProduct(first);
                setSearchQuery(first.title);
                setShowDropdown(false);
                showToast(`${res.total_found} produto(s) sincronizados com sucesso!`, 'success', 5000);
                runForecast(first.id, horizonDays);
            } else {
                showToast('Nenhum produto novo encontrado para este termo.', 'warning');
            }
        } catch (err) {
            showToast('Erro na busca em tempo real: ' + err.message, 'error');
        } finally {
            setDiscovering(false);
        }
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
                        placeholder="Digite qualquer produto do mercado (ex: RTX 4070, Air Fryer, Kindle, Tênis Nike)..."
                        value={searchQuery}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleLiveDiscovery(searchQuery);
                            }
                        }}
                    />
                    <button
                        type="button"
                        className="btn-live-search"
                        onClick={() => handleLiveDiscovery(searchQuery)}
                        title="Buscar produto em tempo real na Amazon & Mercado Livre"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 8px', display: 'flex', alignItems: 'center' }}
                    >
                        <svg className="search-icon-svg" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>
                </div>

                {showDropdown && (
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
                        {searchQuery.trim().length > 0 && (
                            <div
                                className="search-item-live-sync"
                                onClick={() => handleLiveDiscovery(searchQuery)}
                                style={{
                                    padding: '12px 16px',
                                    borderTop: '1px solid rgba(0, 212, 255, 0.25)',
                                    background: 'linear-gradient(90deg, rgba(0, 212, 255, 0.12), rgba(0, 114, 255, 0.08))',
                                    color: '#00f0ff',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                            >
                                <span>⚡</span>
                                <span>{discovering ? 'Buscando nas APIs...' : `Buscar "${searchQuery}" em tempo real na Amazon & Mercado Livre`}</span>
                            </div>
                        )}
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

                {/* AI Explainability Section (Por que vai vender essa quantidade?) */}
                {forecast && forecast.explanation && (
                    <div className="ai-explainability-card">
                        <div className="ai-explain-header">
                            <div className="ai-badge-group">
                                <span className="ai-badge-robot">🤖 IA EXPLICABILIDADE</span>
                                <span className="ai-badge-driver">Fator Principal: {forecast.explanation.primary_driver}</span>
                            </div>
                            <h3 className="ai-explain-title">Por que este produto vai vender {forecast.total_predicted_units} unidades nos próximos {horizonDays} dias?</h3>
                        </div>

                        <p className="ai-explain-summary">
                            {forecast.explanation.summary}
                        </p>

                        <div className="ai-factors-grid">
                            {forecast.explanation.factors && forecast.explanation.factors.map((factor, idx) => (
                                <div key={idx} className="ai-factor-card">
                                    <div className="ai-factor-header">
                                        <span className="ai-factor-name">{factor.name}</span>
                                        <span className={`ai-factor-impact impact-${factor.impact}`}>
                                            {factor.impact.toUpperCase()} ({factor.weight_pct}%)
                                        </span>
                                    </div>
                                    <div className="ai-factor-bar-bg">
                                        <div
                                            className={`ai-factor-bar-fill fill-${factor.impact}`}
                                            style={{ width: `${factor.weight_pct}%` }}
                                        ></div>
                                    </div>
                                    <p className="ai-factor-desc">{factor.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Comparador Preditivo de Produtos (Recurso 4) */}
            <PredictiveComparator products={products} showToast={showToast} />
        </section>
    );
}

/**
 * Subcomponente: Comparador Preditivo de Produtos (A vs B)
 */
function PredictiveComparator({ products, showToast }) {
    const [productAId, setProductAId] = React.useState('');
    const [productBId, setProductBId] = React.useState('');
    const [compareHorizon, setCompareHorizon] = React.useState(30);
    const [comparing, setComparing] = React.useState(false);
    const [compareResult, setCompareResult] = React.useState(null);

    React.useEffect(() => {
        if (products && products.length >= 2 && !productAId && !productBId) {
            setProductAId(products[0].id.toString());
            setProductBId(products[1].id.toString());
        }
    }, [products]);

    const handleCompare = async () => {
        if (!productAId || !productBId) {
            showToast('Selecione dois produtos para comparar.', 'warning');
            return;
        }
        if (productAId === productBId) {
            showToast('Selecione dois produtos diferentes para a comparação.', 'warning');
            return;
        }

        setComparing(true);
        try {
            showToast('Calculando projeção comparativa com IA...', 'info', 2000);
            const data = await window.apiService.forecast.compare(productAId, productBId, compareHorizon);
            setCompareResult(data);
            showToast('Comparação preditiva concluída!', 'success');
        } catch (err) {
            showToast('Erro ao comparar: ' + err.message, 'error');
        } finally {
            setComparing(false);
        }
    };

    return (
        <div className="dash-card comparator-card" style={{ marginTop: '24px' }}>
            <div className="comparator-header">
                <div className="comparator-badge">⚡ RECURSO PREDITIVO</div>
                <h2 className="comparator-title">COMPARADOR PREDITIVO DE PRODUTOS (A vs B)</h2>
                <p className="comparator-subtitle">
                    Compare projeções de demanda e receita lado a lado para tomar decisões estratégicas de estoque e compra.
                </p>
            </div>

            <div className="comparator-selectors-grid">
                <div className="comparator-select-box">
                    <label className="comparator-label">PRODUTO A:</label>
                    <select
                        className="comparator-select"
                        value={productAId}
                        onChange={(e) => setProductAId(e.target.value)}
                    >
                        {(products || []).map((p) => (
                            <option key={`a-${p.id}`} value={p.id}>
                                {p.title} - R$ {p.price.toFixed(2)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="comparator-vs-badge">VS</div>

                <div className="comparator-select-box">
                    <label className="comparator-label">PRODUTO B:</label>
                    <select
                        className="comparator-select"
                        value={productBId}
                        onChange={(e) => setProductBId(e.target.value)}
                    >
                        {(products || []).map((p) => (
                            <option key={`b-${p.id}`} value={p.id}>
                                {p.title} - R$ {p.price.toFixed(2)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="comparator-action-box">
                    <div className="comparator-horizon-btns">
                        {[7, 14, 30].map((d) => (
                            <button
                                key={d}
                                type="button"
                                className={`comparator-hbtn ${compareHorizon === d ? 'active' : ''}`}
                                onClick={() => setCompareHorizon(d)}
                            >
                                {d}d
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        className="btn-run-compare"
                        onClick={handleCompare}
                        disabled={comparing}
                    >
                        {comparing ? 'Analisando...' : 'Comparar com IA'}
                    </button>
                </div>
            </div>

            {compareResult && (
                <div className="compare-results-area">
                    {/* Verdict Banner */}
                    <div className="compare-verdict-banner">
                        <span className="verdict-icon">🏆</span>
                        <div className="verdict-text">
                            <strong>Veredito da IA ({compareResult.horizon_days} dias):</strong> {compareResult.verdict}
                        </div>
                    </div>

                    {/* Side-by-side Cards */}
                    <div className="compare-side-by-side">
                        {/* Product A */}
                        <div className={`compare-prod-card ${compareResult.product_a.is_volume_leader ? 'is-winner' : ''}`}>
                            {compareResult.product_a.is_volume_leader && (
                                <div className="winner-tag">👑 Maior Volume</div>
                            )}
                            <h3 className="compare-prod-title">{compareResult.product_a.title}</h3>
                            <div className="compare-prod-category">{compareResult.product_a.category}</div>

                            <div className="compare-metrics-list">
                                <div className="compare-metric">
                                    <span className="c-label">Preço Unitário:</span>
                                    <span className="c-val">R$ {compareResult.product_a.price.toFixed(2)}</span>
                                </div>
                                <div className="compare-metric highlight">
                                    <span className="c-label">Demanda Prevista:</span>
                                    <span className="c-val text-cyan">{compareResult.product_a.predicted_units} un</span>
                                </div>
                                <div className="compare-metric highlight">
                                    <span className="c-label">Faturamento Projetado:</span>
                                    <span className="c-val text-emerald">
                                        R$ {compareResult.product_a.projected_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="compare-metric">
                                    <span className="c-label">Média Diária:</span>
                                    <span className="c-val">{compareResult.product_a.daily_average} un/dia</span>
                                </div>
                            </div>
                        </div>

                        {/* Product B */}
                        <div className={`compare-prod-card ${compareResult.product_b.is_volume_leader ? 'is-winner' : ''}`}>
                            {compareResult.product_b.is_volume_leader && (
                                <div className="winner-tag">👑 Maior Volume</div>
                            )}
                            <h3 className="compare-prod-title">{compareResult.product_b.title}</h3>
                            <div className="compare-prod-category">{compareResult.product_b.category}</div>

                            <div className="compare-metrics-list">
                                <div className="compare-metric">
                                    <span className="c-label">Preço Unitário:</span>
                                    <span className="c-val">R$ {compareResult.product_b.price.toFixed(2)}</span>
                                </div>
                                <div className="compare-metric highlight">
                                    <span className="c-label">Demanda Prevista:</span>
                                    <span className="c-val text-cyan">{compareResult.product_b.predicted_units} un</span>
                                </div>
                                <div className="compare-metric highlight">
                                    <span className="c-label">Faturamento Projetado:</span>
                                    <span className="c-val text-emerald">
                                        R$ {compareResult.product_b.projected_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="compare-metric">
                                    <span className="c-label">Média Diária:</span>
                                    <span className="c-val">{compareResult.product_b.daily_average} un/dia</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
