/**
 * IaPreditivaTab.jsx
 * Aba IA Preditiva: Gráfico de vendas, produtos mais vendidos e exportação Excel.
 */

function IaPreditivaTab({ categories, showToast }) {
    const [topProducts, setTopProducts] = React.useState([]);
    const [selectedCategory, setSelectedCategory] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const canvasRef = React.useRef(null);
    const [tooltipData, setTooltipData] = React.useState({
        title: 'IPHONE 17 PRO MAX',
        price: 'R$ 10.169,10',
        sold: '897 VENDIDOS',
        x: 150,
        y: 60
    });

    React.useEffect(() => {
        loadData();
    }, [selectedCategory]);

    React.useEffect(() => {
        let animFrame;

        const handleResize = () => {
            cancelAnimationFrame(animFrame);
            animFrame = requestAnimationFrame(() => {
                if (canvasRef.current) {
                    drawChart(topProducts);
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
    }, [topProducts]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await window.apiService.products.getTopSales(5, selectedCategory || null);
            setTopProducts(data);
            drawChart(data);
        } catch (err) {
            console.error('Erro ao carregar dados da IA Preditiva:', err);
        } finally {
            setLoading(false);
        }
    };

    const drawChart = (items) => {
        const canvas = canvasRef.current;
        if (!canvas || !canvas.parentElement) return;

        const parentW = canvas.parentElement.getBoundingClientRect().width || canvas.parentElement.clientWidth;
        if (!parentW || parentW <= 0) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = Math.round(parentW);
        const height = canvas.height = 240;

        ctx.clearRect(0, 0, width, height);

        const daysLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const values = [185, 290, 230, 80, 205, 210, 175];
        const maxVal = 400;

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

        [0, 100, 200, 300, 400].forEach(lvl => {
            const y = padTop + chartH - (lvl / maxVal) * chartH;
            ctx.beginPath();
            ctx.moveTo(padLeft, y);
            ctx.lineTo(width - padRight, y);
            ctx.stroke();
            ctx.fillText(lvl.toString(), padLeft - 10, y + 4);
        });

        // Pontos X, Y
        const points = values.map((val, i) => {
            const x = padLeft + (i / (values.length - 1)) * chartW;
            const y = padTop + chartH - (val / maxVal) * chartH;
            return { x, y, val, day: daysLabels[i] };
        });

        // Labels X
        ctx.textAlign = 'center';
        points.forEach(p => {
            ctx.fillText(p.day, p.x, height - 10);
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
        ctx.lineWidth = 3;
        ctx.stroke();

        // Círculos
        points.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#00f0ff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00d4ff';
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.strokeStyle = '#07172b';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Ponto de pico para o tooltip
        const peak = points[1] || points[0];
        const topItem = items && items[0];
        setTooltipData({
            title: topItem ? topItem.title.toUpperCase().slice(0, 22) : 'IPHONE 17 PRO MAX',
            price: topItem ? `R$ ${topItem.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 10.169,10',
            sold: topItem ? `${topItem.quantity_sold.toLocaleString('pt-BR')} VENDIDOS` : '897 VENDIDOS',
            x: peak.x - 70,
            y: peak.y - 65
        });
    };

    const handleExportExcel = async () => {
        try {
            showToast('Gerando relatório consolidado...', 'info');
            const summary = await window.apiService.forecast.summary(30);

            let csvContent = 'data:text/csv;charset=utf-8,';
            csvContent += 'ID;Produto;Categoria;Preco Unitario;Demanda 30 Dias;Faturamento Projetado;Media Diaria;Estoque Recomendado\n';

            summary.items.forEach(item => {
                const row = [
                    item.product_id,
                    `"${item.product_title.replace(/"/g, '""')}"`,
                    `"${item.category}"`,
                    item.unit_price.toFixed(2).replace('.', ','),
                    item.total_predicted_units,
                    item.total_projected_revenue.toFixed(2).replace('.', ','),
                    item.daily_average.toFixed(1).replace('.', ','),
                    item.recommended_stock_buffer
                ].join(';');
                csvContent += row + '\n';
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `trendecommerce_relatorio_30d.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast('Relatório Excel / CSV exportado com sucesso!', 'success');
        } catch (err) {
            showToast('Erro ao exportar: ' + err.message, 'error');
        }
    };

    return (
        <section className="dash-tab-content active">
            {/* Top Chart Card */}
            <div className="dash-card main-chart-card">
                <div className="chart-container-wrap">
                    <canvas ref={canvasRef}></canvas>
                    <div
                        className="chart-tooltip-bubble"
                        style={{ left: `${tooltipData.x}px`, top: `${tooltipData.y}px` }}
                    >
                        <div className="tooltip-title">{tooltipData.title}</div>
                        <div className="tooltip-price">{tooltipData.price}</div>
                        <div className="tooltip-sold">{tooltipData.sold}</div>
                    </div>
                </div>

                {/* Controles Laterais */}
                <div className="chart-controls-box">
                    <h3 className="controls-title">MAIS VENDIDOS</h3>
                    <div className="controls-dropdowns">
                        <button type="button" className="btn-dropdown-ctrl">
                            <span>FILTRAR DATAS</span>
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                        <select
                            className="select-dropdown-ctrl"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="">CATEGORIAS</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Bottom Two Cards */}
            <div className="dash-bottom-grid">
                <div className="dash-card mais-vendidos-card">
                    <h3 className="dash-card-header-title">MAIS VENDIDOS ATUALMENTE</h3>
                    <div className="ranking-rows-container">
                        {loading ? (
                            <p className="empty-msg">Carregando produtos...</p>
                        ) : (
                            topProducts.map((item) => (
                                <div key={item.id} className="ranking-row">
                                    <div className="ranking-row-left">
                                        <span className="ranking-num">{item.rank}.</span>
                                        <span className="ranking-title">{item.title}</span>
                                    </div>
                                    <div className="ranking-row-right">
                                        <span className="ranking-price">
                                            R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="ranking-sold">
                                            {item.quantity_sold.toLocaleString('pt-BR')} VENDIDOS
                                        </span>
                                    </div>
                                </div>
                            ))
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
