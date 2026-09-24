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
    const [tooltipData, setTooltipData] = React.useState({
        visible: false,
        title: '',
        price: '',
        sold: '',
        x: 0,
        y: 0
    });

    const canvasRef = React.useRef(null);
    const pointsRef = React.useRef([]);
    const hoveredIndexRef = React.useRef(null);
    const forecastRef = React.useRef(null);
    const selectedProductRef = React.useRef(null);

    React.useEffect(() => {
        if (products.length > 0 && !selectedProduct) {
            setSelectedProduct(products[0]);
            selectedProductRef.current = products[0];
        }
    }, [products]);

    React.useEffect(() => {
        selectedProductRef.current = selectedProduct;
    }, [selectedProduct]);

    React.useEffect(() => {
        forecastRef.current = forecast;
    }, [forecast]);

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
                if (canvasRef.current && forecastRef.current) {
                    drawSpecificChart(forecastRef.current, hoveredIndexRef.current, selectedProductRef.current);
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
    }, []);

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
        selectedProductRef.current = prod;
        setSearchQuery(prod.title);
        setShowDropdown(false);
    };

    const runForecast = async (productId, days) => {
        setLoading(true);
        try {
            showToast('Calculando projeção com XGBoost...', 'info', 1800);
            const data = await window.apiService.forecast.predict(productId, days);
            setForecast(data);
            forecastRef.current = data;
            hoveredIndexRef.current = null;
            setTooltipData(prev => ({ ...prev, visible: false }));
            drawSpecificChart(data, null, selectedProductRef.current);
        } catch (err) {
            showToast('Erro na previsão: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const drawSpecificChart = (
        data = forecastRef.current,
        activeHoverIdx = hoveredIndexRef.current,
        activeProd = selectedProductRef.current
    ) => {
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
        const highestVal = Math.max(10, ...values);
        const roundedMax = Math.ceil((highestVal * 1.25) / 50) * 50;
        const maxVal = Math.max(50, roundedMax);

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

        const step = maxVal / 4;
        [0, step, step * 2, step * 3, maxVal].forEach((lvl) => {
            const y = padTop + chartH - (lvl / maxVal) * chartH;
            ctx.beginPath();
            ctx.moveTo(padLeft, y);
            ctx.lineTo(width - padRight, y);
            ctx.stroke();
            ctx.fillText(Math.round(lvl).toString(), padLeft - 10, y + 4);
        });

        // Pontos X, Y
        const points = days.map((d, i) => {
            const x = padLeft + (i / Math.max(1, days.length - 1)) * chartW;
            const y = padTop + chartH - (d.predicted_demand / maxVal) * chartH;
            return { x, y, d, index: i };
        });
        pointsRef.current = points;

        // Labels X: espaçamento inteligente para 7, 14 ou 30 pontos
        ctx.textAlign = 'center';
        const totalPoints = points.length;
        points.forEach((p, i) => {
            let showLabel = true;
            if (totalPoints > 20) {
                showLabel = (i % 5 === 0) || (i === totalPoints - 1);
            } else if (totalPoints > 10) {
                showLabel = (i % 2 === 0) || (i === totalPoints - 1);
            }

            if (showLabel || activeHoverIdx === i) {
                ctx.fillStyle = (activeHoverIdx === i) ? '#00f0ff' : '#8da2bd';
                ctx.font = (activeHoverIdx === i) ? 'bold 11px Plus Jakarta Sans' : '11px Plus Jakarta Sans';
                
                let label = '';
                if (totalPoints <= 7) {
                    const rawDay = p.d.day_name || '';
                    const dayClean = rawDay.split('-')[0].substring(0, 3);
                    const dateShort = p.d.date ? p.d.date.substring(0, 5) : '';
                    label = dayClean || dateShort;
                } else {
                    label = p.d.date ? p.d.date.substring(0, 5) : `${i + 1}`;
                }
                ctx.fillText(label, p.x, height - 12);
            }
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
        grad.addColorStop(1, 'rgba(0, 180, 216, 0.01)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Linha Principal
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = totalPoints > 20 ? 2.5 : 3.5;
        ctx.stroke();

        // Linha guia vertical quando em hover
        if (activeHoverIdx !== null && points[activeHoverIdx]) {
            const hp = points[activeHoverIdx];
            ctx.save();
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.45)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(hp.x, padTop);
            ctx.lineTo(hp.x, padTop + chartH);
            ctx.stroke();
            ctx.restore();
        }

        // Círculos
        const dotRadius = totalPoints > 20 ? 3.5 : 5.5;
        const hoverRadius = totalPoints > 20 ? 5.5 : 7.5;
        const haloRadius = totalPoints > 20 ? 9 : 12;

        points.forEach((p, i) => {
            const isHovered = (activeHoverIdx === i);

            // Halo externo se hovered
            if (isHovered) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, haloRadius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
                ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, isHovered ? hoverRadius : dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = isHovered ? '#ffffff' : '#00f0ff';
            ctx.shadowBlur = isHovered ? 16 : 10;
            ctx.shadowColor = '#00d4ff';
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.strokeStyle = isHovered ? '#00f0ff' : '#07172b';
            ctx.lineWidth = isHovered ? 2.5 : 2;
            ctx.stroke();
        });
    };

    const updateHoverAt = (clientX, clientY) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;

        const points = pointsRef.current || [];
        let matchedPoint = null;
        let minDistance = 25;

        for (const p of points) {
            const dist = Math.hypot(mouseX - p.x, mouseY - p.y);
            const xDist = Math.abs(mouseX - p.x);
            const yInRange = mouseY >= 30 && mouseY <= 280;
            const effectiveDist = (points.length > 20 && yInRange) ? Math.min(dist, xDist * 1.4) : dist;

            if (effectiveDist < minDistance) {
                minDistance = effectiveDist;
                matchedPoint = p;
            }
        }

        if (matchedPoint) {
            canvas.style.cursor = 'pointer';
            if (hoveredIndexRef.current !== matchedPoint.index) {
                hoveredIndexRef.current = matchedPoint.index;
                drawSpecificChart(forecastRef.current, matchedPoint.index, selectedProductRef.current);

                const currentProd = selectedProductRef.current;
                const bubbleHalfW = 85;
                const canvasW = canvas.width || 600;
                const clampedX = Math.max(bubbleHalfW + 5, Math.min(canvasW - bubbleHalfW - 5, matchedPoint.x));

                const rawDay = matchedPoint.d.day_name || '';
                const dayAbbr = rawDay ? rawDay.split('-')[0].toUpperCase().slice(0, 3) : '';
                const dateShort = matchedPoint.d.date ? matchedPoint.d.date.slice(0, 5) : '';
                const dateInfo = dayAbbr && dateShort ? `${dayAbbr} (${dateShort})` : (dayAbbr || dateShort);
                const dateSuffix = dateInfo ? ` • ${dateInfo}` : '';

                const prodTitle = currentProd?.title || forecastRef.current?.product_title || 'PRODUTO';
                const prodPrice = currentProd?.price ?? forecastRef.current?.unit_price;

                setTooltipData({
                    visible: true,
                    title: prodTitle.toUpperCase().slice(0, 26),
                    price: prodPrice !== undefined ? `R$ ${prodPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '',
                    sold: `${matchedPoint.d.predicted_demand.toLocaleString('pt-BR')} VENDAS PREVISTAS${dateSuffix}`,
                    x: clampedX,
                    y: Math.max(65, matchedPoint.y - 12)
                });
            }
        } else {
            canvas.style.cursor = 'default';
            if (hoveredIndexRef.current !== null) {
                hoveredIndexRef.current = null;
                drawSpecificChart(forecastRef.current, null, selectedProductRef.current);
                setTooltipData(prev => ({ ...prev, visible: false }));
            }
        }
    };

    const handleMouseMove = (e) => {
        updateHoverAt(e.clientX, e.clientY);
    };

    const handleMouseLeave = () => {
        const canvas = canvasRef.current;
        if (canvas) canvas.style.cursor = 'default';
        if (hoveredIndexRef.current !== null) {
            hoveredIndexRef.current = null;
            drawSpecificChart(forecastRef.current, null, selectedProductRef.current);
        }
        setTooltipData(prev => ({ ...prev, visible: false }));
    };

    const handleTouchMove = (e) => {
        if (e.touches && e.touches[0]) {
            updateHoverAt(e.touches[0].clientX, e.touches[0].clientY);
        }
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
                    <canvas
                        ref={canvasRef}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        onTouchStart={handleTouchMove}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleMouseLeave}
                    ></canvas>
                    {tooltipData.visible && (
                        <div
                            className="chart-tooltip-bubble"
                            style={{ left: `${tooltipData.x}px`, top: `${tooltipData.y}px` }}
                        >
                            <div className="tooltip-title">{tooltipData.title}</div>
                            <div className="tooltip-price">{tooltipData.price}</div>
                            <div className="tooltip-sold">{tooltipData.sold}</div>
                        </div>
                    )}
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
