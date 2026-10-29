/**
 * IaPreditivaTab.jsx
 * Aba IA Preditiva: Gráfico de vendas, produtos mais vendidos, tomada de decisão de estoque e exportação Excel.
 * Totalmente integrado ao XGBoost com snapshot determinístico diário, 3 níveis de risco e eliminação de dados mockados.
 */

function IaPreditivaTab({ categories, showToast }) {
    const [topProducts, setTopProducts] = React.useState([]);
    const [selectedCategory, setSelectedCategory] = React.useState('');
    const [selectedProduct, setSelectedProduct] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [horizonDays, setHorizonDays] = React.useState(7);
    const [dateDropdownOpen, setDateDropdownOpen] = React.useState(false);
    const [catDropdownOpen, setCatDropdownOpen] = React.useState(false);

    // Estado institucional de previsão (XGBoost real)
    const [forecastData, setForecastData] = React.useState(null);
    const [forecastLoading, setForecastLoading] = React.useState(false);
    const [forecastError, setForecastError] = React.useState(null);

    const canvasRef = React.useRef(null);
    const pointsRef = React.useRef([]);
    const topProductsRef = React.useRef([]);
    const selectedProductRef = React.useRef(null);
    const hoveredIndexRef = React.useRef(null);
    const dateDropdownRef = React.useRef(null);
    const catDropdownRef = React.useRef(null);

    const [chartData, setChartData] = React.useState({
        daysLabels: [],
        values: [],
        days: []
    });
    const currentChartDataRef = React.useRef({
        daysLabels: [],
        values: [],
        days: []
    });

    const [tooltipData, setTooltipData] = React.useState({
        visible: false,
        title: '',
        price: '',
        sold: '',
        x: 0,
        y: 0
    });

    React.useEffect(() => {
        loadData();
    }, [selectedCategory]);

    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target)) {
                setDateDropdownOpen(false);
            }
            if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
                setCatDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    React.useEffect(() => {
        let animFrame;

        const handleResize = () => {
            cancelAnimationFrame(animFrame);
            animFrame = requestAnimationFrame(() => {
                if (canvasRef.current) {
                    drawChart(currentChartDataRef.current, hoveredIndexRef.current, selectedProductRef.current);
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

    const loadForecastForProduct = async (product, horizon) => {
        if (!product || !product.id) {
            setForecastData(null);
            setChartData({ daysLabels: [], values: [], days: [] });
            currentChartDataRef.current = { daysLabels: [], values: [], days: [] };
            return;
        }

        setForecastLoading(true);
        setForecastError(null);

        try {
            if (!window.apiService || !window.apiService.forecast) {
                throw new Error('Serviço de previsão indisponível.');
            }

            const res = await window.apiService.forecast.predict(product.id, horizon);
            if (res && res.days && res.days.length > 0) {
                setForecastData(res);

                const daysLabels = res.days.map((d, i) => {
                    if (horizon <= 7) {
                        const daysMap = {
                            'Segunda-feira': 'Seg', 'Terça-feira': 'Ter', 'Quarta-feira': 'Qua',
                            'Quinta-feira': 'Qui', 'Sexta-feira': 'Sex', 'Sábado': 'Sáb', 'Domingo': 'Dom'
                        };
                        return daysMap[d.day_name] || d.day_name.substring(0, 3);
                    }
                    if (d.date && d.date.includes('/')) {
                        const parts = d.date.split('/');
                        return `${parts[0]}/${parts[1]}`;
                    }
                    if (d.date && d.date.includes('-')) {
                        const parts = d.date.split('-');
                        return `${parts[2]}/${parts[1]}`;
                    }
                    return `D${i + 1}`;
                });

                const values = res.days.map(d => Math.round(d.predicted_demand));
                const newChartData = { daysLabels, values, days: res.days };

                currentChartDataRef.current = newChartData;
                setChartData(newChartData);

                requestAnimationFrame(() => {
                    drawChart(newChartData, null, product);
                });
            } else {
                throw new Error('O modelo não retornou projeções válidas para este produto.');
            }
        } catch (err) {
            console.error('Erro ao buscar previsão XGBoost:', err);
            setForecastError(err.message || 'Falha ao conectar com o modelo preditivo.');
            setForecastData(null);
            setChartData({ daysLabels: [], values: [], days: [] });
            currentChartDataRef.current = { daysLabels: [], values: [], days: [] };
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        } finally {
            setForecastLoading(false);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await window.apiService.products.getTopSales(5, selectedCategory || null);
            setTopProducts(data || []);
            topProductsRef.current = data || [];
            const initialProduct = data && data[0] ? data[0] : null;
            setSelectedProduct(initialProduct);
            selectedProductRef.current = initialProduct;

            if (initialProduct) {
                await loadForecastForProduct(initialProduct, horizonDays);
            }
        } catch (err) {
            console.error('Erro ao carregar dados da IA Preditiva:', err);
            showToast('Erro ao carregar produtos mais vendidos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const drawChart = (chartDataParam = currentChartDataRef.current, activeHoverIdx = hoveredIndexRef.current, activeProd = selectedProductRef.current) => {
        const canvas = canvasRef.current;
        if (!canvas || !canvas.parentElement) return;

        const parentW = canvas.parentElement.getBoundingClientRect().width || canvas.parentElement.clientWidth;
        if (!parentW || parentW <= 0) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = Math.round(parentW);
        const height = canvas.height = 240;

        ctx.clearRect(0, 0, width, height);

        const daysLabels = chartDataParam?.daysLabels || [];
        const values = chartDataParam?.values || [];

        if (values.length === 0) return;

        const highestVal = Math.max(10, ...values);
        const maxVal = Math.ceil((highestVal * 1.15) / 50) * 50;

        const padLeft = 45;
        const padRight = 30;
        const padTop = 30;
        const padBottom = 35;

        const chartW = width - padLeft - padRight;
        const chartH = height - padTop - padBottom;

        // Grid Horizontal
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#8da2bd';
        ctx.font = '11px Plus Jakarta Sans';
        ctx.textAlign = 'right';

        const step = maxVal / 4;
        [0, step, step * 2, step * 3, maxVal].forEach(lvl => {
            const y = padTop + chartH - (lvl / maxVal) * chartH;
            ctx.beginPath();
            ctx.moveTo(padLeft, y);
            ctx.lineTo(width - padRight, y);
            ctx.stroke();
            ctx.fillText(Math.round(lvl).toString(), padLeft - 10, y + 4);
        });

        // Pontos X, Y
        const points = values.map((val, i) => {
            const x = padLeft + (i / Math.max(1, values.length - 1)) * chartW;
            const y = padTop + chartH - (val / maxVal) * chartH;
            return { x, y, val, day: daysLabels[i], index: i };
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
                ctx.fillText(p.day, p.x, height - 10);
            }
        });

        // Área com gradiente
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.lineTo(points[points.length - 1].x, padTop + chartH);
        ctx.lineTo(points[0].x, padTop + chartH);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
        grad.addColorStop(0, 'rgba(0, 180, 216, 0.25)');
        grad.addColorStop(1, 'rgba(0, 180, 216, 0.0)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Linha Principal
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = totalPoints > 20 ? 2 : 3;
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
        const dotRadius = totalPoints > 20 ? 3.5 : 5;
        const hoverRadius = totalPoints > 20 ? 5.5 : 7;
        const haloRadius = totalPoints > 20 ? 9 : 11;

        points.forEach((p, i) => {
            const isHovered = (activeHoverIdx === i);

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
        if (points.length === 0) return;

        let matchedPoint = null;
        let minDistance = 25;

        for (const p of points) {
            const dist = Math.hypot(mouseX - p.x, mouseY - p.y);
            const xDist = Math.abs(mouseX - p.x);
            const yInRange = mouseY >= 20 && mouseY <= 220;
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
                drawChart(currentChartDataRef.current, matchedPoint.index, selectedProductRef.current);

                const currentProd = selectedProductRef.current || (topProductsRef.current && topProductsRef.current[0]);
                const bubbleHalfW = 100;
                const canvasW = canvas.width || 600;
                const clampedX = Math.max(bubbleHalfW + 5, Math.min(canvasW - bubbleHalfW - 5, matchedPoint.x));

                const currentPrice = currentProd?.price || forecastData?.unit_price || 0;
                const dayItem = currentChartDataRef.current?.days?.[matchedPoint.index];
                const dateLabel = dayItem?.date || matchedPoint.day;
                const dateSuffix = dateLabel ? ` • ${dateLabel}` : '';

                setTooltipData({
                    visible: true,
                    title: (currentProd ? currentProd.title : 'PRODUTO').toUpperCase(),
                    price: `R$ ${currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    sold: `${matchedPoint.val.toLocaleString('pt-BR')} VENDAS PREVISTAS${dateSuffix}`,
                    x: clampedX,
                    y: Math.max(65, matchedPoint.y - 12)
                });
            }
        } else {
            canvas.style.cursor = 'default';
            if (hoveredIndexRef.current !== null) {
                hoveredIndexRef.current = null;
                drawChart(currentChartDataRef.current, null, selectedProductRef.current);
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
            drawChart(currentChartDataRef.current, null, selectedProductRef.current);
            setTooltipData(prev => ({ ...prev, visible: false }));
        }
    };

    const handleTouchMove = (e) => {
        if (e.touches && e.touches.length > 0) {
            updateHoverAt(e.touches[0].clientX, e.touches[0].clientY);
        }
    };

    const handleSelectProduct = (item) => {
        setSelectedProduct(item);
        selectedProductRef.current = item;
        loadForecastForProduct(item, horizonDays);
    };

    const handleSelectHorizon = (days) => {
        setHorizonDays(days);
        setDateDropdownOpen(false);
        const prod = selectedProductRef.current || (topProductsRef.current && topProductsRef.current[0]);
        if (prod) {
            loadForecastForProduct(prod, days);
        }
    };

    const handleExportExcel = async () => {
        try {
            showToast('Gerando relatório consolidado institucional...', 'info');
            const summary = await window.apiService.forecast.summary(horizonDays);

            let csvContent = 'data:text/csv;charset=utf-8,';
            csvContent += `ID;Produto;Categoria;Preco Unitario;Demanda ${horizonDays} Dias;Faturamento Projetado;Media Diaria;Estoque Recomendado;Cenario Conservador;Estoque com Buffer\n`;

            summary.items.forEach(item => {
                const row = [
                    item.product_id,
                    `"${item.product_title.replace(/"/g, '""')}"`,
                    `"${item.category}"`,
                    item.unit_price.toFixed(2).replace('.', ','),
                    item.total_predicted_units,
                    item.total_projected_revenue.toFixed(2).replace('.', ','),
                    item.daily_average.toFixed(1).replace('.', ','),
                    item.recommended_stock_buffer,
                    item.conservative_units || Math.round(item.total_predicted_units * 0.85),
                    item.buffer_stock_units || item.recommended_stock_buffer
                ].join(';');
                csvContent += row + '\n';
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `trendecommerce_relatorio_${horizonDays}d.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast(`Relatório Excel / CSV (${horizonDays} dias) exportado com sucesso!`, 'success');
        } catch (err) {
            showToast('Erro ao exportar: ' + err.message, 'error');
        }
    };

    const activeProd = selectedProduct || (topProducts && topProducts[0]);
    const totalPredictedUnits = forecastData ? forecastData.total_predicted_units : 0;
    const activePrice = forecastData?.unit_price ?? activeProd?.price ?? 0;
    const projectedRevenue = forecastData?.total_projected_revenue ?? (totalPredictedUnits * activePrice);


    return (
        <section className="dash-tab-content active">
            {/* Top Chart Card */}
            <div className="dash-card main-chart-card">
                <div className="chart-main-area-col" style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0, position: 'relative' }}>
                    {/* Header Limpo: Nome do Produto, Demanda e Faturamento Projetado */}
                    <div className="chart-active-prod-banner" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '16px',
                        padding: '16px 20px',
                        marginBottom: '16px',
                        background: 'rgba(0, 180, 216, 0.07)',
                        border: '1px solid rgba(0, 212, 255, 0.22)',
                        borderRadius: '12px'
                    }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', letterSpacing: '0.4px', wordBreak: 'break-word', lineHeight: '1.4' }}>
                                {activeProd ? activeProd.title.toUpperCase() : 'PROJEÇÃO DE VENDAS'}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Demanda ({horizonDays}d)
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>
                                    {forecastLoading ? 'Calculando...' : `${totalPredictedUnits.toLocaleString('pt-BR')} un`}
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Faturamento Projetado
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#00f0ff' }}>
                                    {forecastLoading ? 'Calculando...' : `R$ ${projectedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Container do Gráfico com Overlay de Carregamento e Tratamento de Erro */}
                    <div className="chart-container-wrap" style={{ position: 'relative' }}>
                        {forecastLoading && (
                            <div className="chart-loading-overlay">
                                <div className="chart-spinner"></div>
                                <span style={{ color: '#00f0ff', fontSize: '13px', fontWeight: '700' }}>
                                    Processando simulação autoregressiva XGBoost...
                                </span>
                            </div>
                        )}

                        {forecastError && !forecastLoading && (
                            <div className="chart-error-banner">
                                <i className="ph ph-warning-circle" style={{ fontSize: '20px' }}></i>
                                <span>{forecastError}</span>
                            </div>
                        )}

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

                    </div>

                {/* Controles Laterais */}
                <div className="chart-controls-box">
                    <h3 className="controls-title">MAIS VENDIDOS</h3>
                    <div className="controls-dropdowns">
                        <div className="dropdown-filter-wrap" ref={dateDropdownRef}>
                            <button
                                type="button"
                                className={`btn-dropdown-ctrl ${dateDropdownOpen ? 'active' : ''}`}
                                onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                            >
                                <span>FILTRAR DATAS</span>
                                <svg
                                    viewBox="0 0 24 24"
                                    width="14"
                                    height="14"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    style={{
                                        transform: dateDropdownOpen ? 'rotate(180deg)' : 'none',
                                        transition: 'transform 0.2s ease'
                                    }}
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            {dateDropdownOpen && (
                                <div className="dates-dropdown-menu">
                                    <button
                                        type="button"
                                        className={`dropdown-menu-item ${horizonDays === 7 ? 'active' : ''}`}
                                        onClick={() => handleSelectHorizon(7)}
                                    >
                                        PRÓXIMOS 7 DIAS
                                    </button>
                                    <button
                                        type="button"
                                        className={`dropdown-menu-item ${horizonDays === 14 ? 'active' : ''}`}
                                        onClick={() => handleSelectHorizon(14)}
                                    >
                                        PRÓXIMOS 14 DIAS
                                    </button>
                                    <button
                                        type="button"
                                        className={`dropdown-menu-item ${horizonDays === 30 ? 'active' : ''}`}
                                        onClick={() => handleSelectHorizon(30)}
                                    >
                                        PRÓXIMOS 30 DIAS
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="dropdown-filter-wrap" ref={catDropdownRef}>
                            <button
                                type="button"
                                className={`btn-dropdown-ctrl ${catDropdownOpen ? 'active' : ''}`}
                                onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                                style={{ gap: '10px', padding: '0 16px' }}
                            >
                                <span style={{ letterSpacing: '0.8px', fontWeight: '700' }}>
                                    {selectedCategory && selectedCategory !== 'GERAIS' ? selectedCategory.toUpperCase() : 'CATEGORIAS'}
                                </span>
                                <svg
                                    viewBox="0 0 24 24"
                                    width="14"
                                    height="14"
                                    fill="none"
                                    stroke="#00d4ff"
                                    strokeWidth="2.5"
                                    style={{
                                        transform: catDropdownOpen ? 'rotate(180deg)' : 'none',
                                        transition: 'transform 0.2s ease',
                                        flexShrink: 0
                                    }}
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            {catDropdownOpen && (
                                <div
                                    className="dates-dropdown-menu categories-dropdown-menu"
                                    style={{
                                        minWidth: '290px',
                                        right: '0',
                                        left: 'auto',
                                        width: 'max-content',
                                        maxWidth: '330px',
                                        top: 'calc(100% + 6px)',
                                        zIndex: 150
                                    }}
                                >
                                    <button
                                        type="button"
                                        className={`dropdown-menu-item ${!selectedCategory || selectedCategory === 'GERAIS' ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedCategory('');
                                            setCatDropdownOpen(false);
                                        }}
                                    >
                                        GERAIS
                                    </button>
                                    {categories.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            className={`dropdown-menu-item ${selectedCategory === c ? 'active' : ''}`}
                                            onClick={() => {
                                                setSelectedCategory(c);
                                                setCatDropdownOpen(false);
                                            }}
                                        >
                                            {c.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Two Cards */}
            <div className="dash-bottom-grid">
                <div className="dash-card mais-vendidos-card">
                    <h3 className="dash-card-header-title">MAIS VENDIDOS NO MÊS</h3>
                    <div className="ranking-rows-container">
                        {loading ? (
                            <p className="empty-msg">Carregando produtos...</p>
                        ) : (
                            topProducts.map((item) => {
                                const itemThumb = item.thumbnail_url || 'https://http2.mlstatic.com/D_NQ_NP_2X_841787-MLA46114829749_052021-F.webp';

                                return (
                                    <div
                                        key={item.id}
                                        className={`ranking-row ${selectedProduct?.id === item.id ? 'active-row' : ''}`}
                                        onClick={() => handleSelectProduct(item)}
                                        style={{ cursor: 'pointer', padding: '10px 14px' }}
                                        title="Clique para carregar previsão deste produto"
                                    >
                                        <div className="ranking-row-left" style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                            <span className="ranking-num">{item.rank}.</span>
                                            <img src={itemThumb} alt="" className="ranking-thumb-img" />
                                            <div style={{ minWidth: 0 }}>
                                                <span className="ranking-title" style={{ whiteSpace: 'normal', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {item.title}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ranking-row-right" style={{ flexShrink: 0, textAlign: 'right' }}>
                                            <span className="ranking-price">
                                                R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                            <span className="ranking-sold">
                                                {item.quantity_sold.toLocaleString('pt-BR')} VENDIDOS NO MÊS
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Exportar Card */}
                <div className="dash-card export-card">
                    <h3 className="dash-card-header-title">EXPORTAR<br />RELATÓRIO</h3>
                    <button
                        type="button"
                        className="btn-export-excel"
                        onClick={handleExportExcel}
                    >
                        <span>EXCEL</span>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                    </button>
                </div>
            </div>
        </section>
    );
}
