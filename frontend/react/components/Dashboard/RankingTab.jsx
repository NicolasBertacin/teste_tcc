/**
 * RankingTab.jsx
 * Aba Ranking Produtos: Top 7 Produtos Próximos 30 Dias e Top 5 Produtos por Categoria
 * com Explicabilidade IA integrada (Explicação de por que está no topo e como vai vender).
 * Exibe foto real do produto, badge de marketplace e link direto oficial para o anúncio.
 */

function RankingTab({ categories }) {
    const [rankingData, setRankingData] = React.useState({ top_overall: [], top_by_category: {} });
    const [selectedCategory, setSelectedCategory] = React.useState('GERAIS');
    const [loading, setLoading] = React.useState(true);
    const [syncing, setSyncing] = React.useState(false);
    const [syncStatusMsg, setSyncStatusMsg] = React.useState('');
    const [lastSyncedAt, setLastSyncedAt] = React.useState(() => {
        return localStorage.getItem('trendcommerce_last_rank_sync') || 'Hoje (Tempo Real Ativo)';
    });
    const [selectedItemModal, setSelectedItemModal] = React.useState(null);
    const [catDropdownOpen, setCatDropdownOpen] = React.useState(false);
    const catDropdownRef = React.useRef(null);

    React.useEffect(() => {
        loadRanking();
    }, []);

    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
                setCatDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadRanking = async () => {
        setLoading(true);
        try {
            const data = await window.apiService.forecast.ranking(30);
            setRankingData(data);
        } catch (err) {
            console.error('Erro ao carregar ranking:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSyncLiveMarket = async () => {
        setSyncing(true);
        setSyncStatusMsg('Consultando APIs do Mercado Livre e Amazon para os produtos mais vendidos...');
        try {
            const res = await window.apiService.forecast.syncLiveRanking(selectedCategory !== 'GERAIS' ? selectedCategory : null);
            const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const syncLabel = `Hoje às ${nowTime}`;
            setLastSyncedAt(syncLabel);
            localStorage.setItem('trendcommerce_last_rank_sync', syncLabel);
            setSyncStatusMsg(`✓ ${res.message || 'Catálogo atualizado com sucesso com os produtos mais vendidos!'}`);
            await loadRanking();
        } catch (err) {
            console.error('Erro na sincronização:', err);
            setSyncStatusMsg('Aviso: Utilizando base de produtos em cache local.');
        } finally {
            setSyncing(false);
            setTimeout(() => setSyncStatusMsg(''), 6000);
        }
    };

    const categoryItems = (rankingData.top_by_category && rankingData.top_by_category[selectedCategory])
        ? rankingData.top_by_category[selectedCategory]
        : (selectedCategory === 'GERAIS' && rankingData.top_overall)
            ? rankingData.top_overall.slice(0, 5)
            : (Object.values(rankingData.top_by_category || {})[0] || []);

    const defaultImg = 'https://http2.mlstatic.com/D_NQ_NP_2X_841787-MLA46114829749_052021-F.webp';

    return (
        <section className="dash-tab-content active">
            {/* Barra de Inteligência e Sincronização em Tempo Real com Mercado Livre & Amazon */}
            <div className="ranking-sync-bar" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px',
                padding: '12px 18px',
                background: 'linear-gradient(90deg, rgba(16, 26, 43, 0.9) 0%, rgba(20, 36, 62, 0.9) 100%)',
                border: '1px solid rgba(0, 240, 255, 0.25)',
                borderRadius: '10px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'rgba(0, 240, 255, 0.12)',
                        border: '1px solid rgba(0, 240, 255, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#00f0ff',
                        flexShrink: 0
                    }}>
                        <i className="ph ph-globe" style={{ fontSize: '20px' }}></i>
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', letterSpacing: '0.5px' }}>
                                RADAR GLOBAL DE MERCADO
                            </span>
                            <span style={{ fontSize: '11px', color: '#8da2bd', marginLeft: '6px' }}>
                                • Sincronização: <strong style={{ color: '#00f0ff' }}>{lastSyncedAt}</strong>
                            </span>
                        </div>
                        <div style={{ fontSize: '11px', color: syncStatusMsg.startsWith('✓') ? '#10b981' : '#8da2bd', marginTop: '3px' }}>
                            {syncStatusMsg || 'O ranking computa projeções XGBoost para os produtos líderes de vendas de cada categoria nos marketplaces.'}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <button
                        type="button"
                        className="btn-sync-market"
                        onClick={handleSyncLiveMarket}
                        disabled={syncing || loading}
                        title="Varrer as categorias do Mercado Livre e Amazon e atualizar os líderes de venda ao vivo"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '9px 18px',
                            background: syncing ? 'rgba(0, 240, 255, 0.15)' : 'linear-gradient(135deg, #00f0ff 0%, #0077ff 100%)',
                            color: syncing ? '#00f0ff' : '#0a101d',
                            border: '1px solid rgba(0, 240, 255, 0.4)',
                            borderRadius: '8px',
                            fontWeight: '700',
                            fontSize: '12px',
                            cursor: syncing ? 'not-allowed' : 'pointer',
                            boxShadow: syncing ? 'none' : '0 2px 12px rgba(0, 240, 255, 0.3)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <i className={`ph ${syncing ? 'ph-spinner ph-spin' : 'ph-arrows-clockwise'}`} style={{ fontSize: '15px' }}></i>
                        <span>{syncing ? 'Varrendo Marketplaces...' : 'Sincronizar Mais Vendidos ao Vivo'}</span>
                    </button>
                </div>
            </div>

            <div className="ranking-two-col-grid">
                {/* Coluna Esquerda: Top 7 Próximos 30 Dias */}
                <div className="dash-card ranking-col-card">
                    <div className="ranking-header-wrap">
                        <h2 className="ranking-card-title">TOP 7 PRODUTOS<br />PRÓXIMOS 30 DIAS</h2>
                    </div>
                    
                    <div className="ranking-items-list">
                        {loading ? (
                            <p className="empty-msg">Processando modelo XGBoost...</p>
                        ) : (
                            rankingData.top_overall.slice(0, 7).map((item) => {
                                const thumb = item.thumbnail_url || defaultImg;

                                return (
                                    <div
                                        key={item.product_id}
                                        className={`ranking-card-item clickable ${selectedItemModal?.product_id === item.product_id ? 'active-item' : ''}`}
                                        onClick={() => setSelectedItemModal(item)}
                                        title="Clique para ver detalhes do produto e análise explicativa da IA"
                                        style={{ padding: '10px 14px' }}
                                    >
                                        <div className="item-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                            <span className="item-num">{item.rank}.</span>
                                            <img src={thumb} alt="" className="ranking-thumb-img" />
                                            <div className="item-info" style={{ minWidth: 0, flex: 1 }}>
                                                <span className="item-title" style={{ whiteSpace: 'normal', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {item.title}
                                                </span>
                                                {item.key_driver && (
                                                    <span className="item-driver-pill" style={{ marginTop: '4px' }}>
                                                        <i className="ph ph-lightning" style={{ fontSize: '11px', color: '#00f0ff' }}></i> {item.key_driver}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="item-right" style={{ flexShrink: 0, textAlign: 'right' }}>
                                            <span className="item-units">{item.projected_units} un</span>
                                            <span className="item-price">
                                                R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Coluna Direita: Top 5 por Categoria */}
                <div className="dash-card ranking-col-card">
                    <div className="ranking-header-wrap">
                        <h2 className="ranking-card-title">TOP 5 PRODUTOS<br />POR CATEGORIA</h2>
                    </div>

                    <div className="ranking-items-list">
                        {loading ? (
                            <p className="empty-msg">Carregando categorias...</p>
                        ) : (
                            categoryItems.slice(0, 5).map((item) => {
                                const thumb = item.thumbnail_url || defaultImg;

                                return (
                                    <div
                                        key={item.product_id}
                                        className={`ranking-card-item clickable ${selectedItemModal?.product_id === item.product_id ? 'active-item' : ''}`}
                                        onClick={() => setSelectedItemModal(item)}
                                        title="Clique para ver detalhes do produto e análise explicativa da IA"
                                        style={{ padding: '10px 14px' }}
                                    >
                                        <div className="item-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                            <span className="item-num">{item.rank}.</span>
                                            <img src={thumb} alt="" className="ranking-thumb-img" />
                                            <div className="item-info" style={{ minWidth: 0, flex: 1 }}>
                                                <span className="item-title" style={{ whiteSpace: 'normal', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {item.title}
                                                </span>
                                                {item.key_driver && (
                                                    <span className="item-driver-pill" style={{ marginTop: '4px' }}>
                                                        <i className="ph ph-lightning" style={{ fontSize: '11px', color: '#00f0ff' }}></i> {item.key_driver}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="item-right" style={{ flexShrink: 0, textAlign: 'right' }}>
                                            <span className="item-units">{item.projected_units} un</span>
                                            <span className="item-price">
                                                R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <div className="ranking-cat-btn-wrap" ref={catDropdownRef} style={{ position: 'relative' }}>
                        <button
                            type="button"
                            className={`btn-category-select ${catDropdownOpen ? 'active' : ''}`}
                            onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                minWidth: '200px',
                                padding: '0 20px',
                                height: '42px',
                                cursor: 'pointer'
                            }}
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
                                    minWidth: '295px',
                                    width: 'max-content',
                                    maxWidth: '330px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    top: 'calc(100% + 8px)',
                                    zIndex: 150
                                }}
                            >
                                <button
                                    type="button"
                                    className={`dropdown-menu-item ${selectedCategory === 'GERAIS' ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedCategory('GERAIS');
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

            {/* Modal de Explicabilidade de Ranking IA */}
            {selectedItemModal && (
                <div className="ranking-modal-overlay" onClick={() => setSelectedItemModal(null)}>
                    <div className="ranking-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="ranking-modal-header">
                            <div className="modal-badge-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span className="modal-rank-badge">
                                    <i className="ph ph-trophy" style={{ fontSize: '13px', marginRight: '4px' }}></i> #{selectedItemModal.rank} NO RANKING
                                </span>
                                <span className="modal-category-badge">{selectedItemModal.category}</span>
                                {selectedItemModal.product_url && (
                                    <a
                                        href={selectedItemModal.product_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-view-ad"
                                        title="Ver anúncio oficial no marketplace"
                                    >
                                        <span>Ver Anúncio Original</span>
                                        <i className="ph ph-arrow-square-out"></i>
                                    </a>
                                )}
                            </div>
                            <button
                                type="button"
                                className="modal-close-btn"
                                onClick={() => setSelectedItemModal(null)}
                            >
                                <i className="ph ph-x" style={{ fontSize: '18px' }}></i>
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '14px 0' }}>
                            <img
                                src={selectedItemModal.thumbnail_url || defaultImg}
                                alt=""
                                className="product-thumbnail-large"
                            />
                            <div>
                                <h2 className="modal-prod-title" style={{ margin: 0, fontSize: '16px', wordBreak: 'break-word', lineHeight: '1.3' }}>
                                    {selectedItemModal.title}
                                </h2>
                                <div style={{ fontSize: '12px', color: '#8da2bd', marginTop: '4px' }}>
                                    Preço de Mercado: <strong style={{ color: '#00f0ff' }}>R$ {selectedItemModal.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                </div>
                            </div>
                        </div>

                        {/* Rationale Banner */}
                        <div className="modal-reason-box">
                            <div className="reason-label">
                                <i className="ph ph-target" style={{ fontSize: '13px', marginRight: '4px' }}></i> MOTIVO DE ESTAR NO TOP RANKING:
                            </div>
                            <p className="reason-text">
                                {selectedItemModal.rank_reason || `Produto classificado na posição ${selectedItemModal.rank} com alta probabilidade de conversão e forte tração de mercado nos próximos 30 dias.`}
                            </p>
                        </div>

                        {/* Key Metrics Grid */}
                        <div className="modal-metrics-grid">
                            <div className="modal-metric-card">
                                <span className="m-label">VENDAS PROJETADAS (30D)</span>
                                <span className="m-val text-cyan">{selectedItemModal.projected_units} unidades</span>
                            </div>
                            <div className="modal-metric-card">
                                <span className="m-label">RECEITA ESTIMADA</span>
                                <span className="m-val text-emerald">
                                    R$ {selectedItemModal.projected_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="modal-metric-card">
                                <span className="m-label">PREÇO UNITÁRIO</span>
                                <span className="m-val">
                                    R$ {selectedItemModal.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="modal-metric-card">
                                <span className="m-label">FATOR DOMINANTE</span>
                                <span className="m-val text-accent">{selectedItemModal.key_driver || 'Sazonalidade & Momentum'}</span>
                            </div>
                        </div>

                        {/* Explicação de Dinâmica Preditiva */}
                        <div className="modal-dynamics-box">
                            <h4 className="dynamics-title">
                                <i className="ph ph-chart-bar" style={{ fontSize: '15px', marginRight: '5px' }}></i> Dinâmica de Vendas Prevista pelo Modelo IA:
                            </h4>
                            <p className="dynamics-desc">
                                A projeção considera uma média diária consistente de {(selectedItemModal.projected_units / 30).toFixed(1)} un/dia, com picos impulsionados por {selectedItemModal.key_driver?.toLowerCase() || 'tendência orgânica'}. A recomendação é manter estoque de segurança calibrado em pelo menos {Math.round(selectedItemModal.projected_units * 1.25)} unidades para evitar ruptura.
                            </p>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn-modal-close"
                                onClick={() => setSelectedItemModal(null)}
                            >
                                Fechar Explicação
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
