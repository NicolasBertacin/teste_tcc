/**
 * RankingTab.jsx
 * Aba Ranking Produtos: Top 7 Produtos Próximos 30 Dias e Top 5 Produtos por Categoria
 * com Explicabilidade IA integrada (Explicação de por que está no topo e como vai vender).
 */

function RankingTab({ categories }) {
    const [rankingData, setRankingData] = React.useState({ top_overall: [], top_by_category: {} });
    const [selectedCategory, setSelectedCategory] = React.useState('Celulares');
    const [loading, setLoading] = React.useState(true);
    const [selectedItemModal, setSelectedItemModal] = React.useState(null);

    React.useEffect(() => {
        loadRanking();
    }, []);

    const loadRanking = async () => {
        setLoading(true);
        try {
            const data = await window.apiService.forecast.ranking(30);
            setRankingData(data);
            if (categories.length > 0 && !data.top_by_category[selectedCategory]) {
                const firstAvailable = Object.keys(data.top_by_category)[0];
                if (firstAvailable) setSelectedCategory(firstAvailable);
            }
        } catch (err) {
            console.error('Erro ao carregar ranking:', err);
        } finally {
            setLoading(false);
        }
    };

    const categoryItems = (rankingData.top_by_category && rankingData.top_by_category[selectedCategory])
        ? rankingData.top_by_category[selectedCategory]
        : (Object.values(rankingData.top_by_category || {})[0] || []);

    return (
        <section className="dash-tab-content active">
            <div className="ranking-two-col-grid">
                {/* Coluna Esquerda: Top 7 Próximos 30 Dias */}
                <div className="dash-card ranking-col-card">
                    <div className="ranking-header-wrap">
                        <h2 className="ranking-card-title">TOP 7 PRODUTOS<br />PRÓXIMOS 30 DIAS</h2>
                        <span className="ranking-hint-badge">💡 Clique em um produto para ver a explicação da IA</span>
                    </div>
                    
                    <div className="ranking-items-list">
                        {loading ? (
                            <p className="empty-msg">Processando modelo XGBoost...</p>
                        ) : (
                            rankingData.top_overall.slice(0, 7).map((item) => (
                                <div
                                    key={item.product_id}
                                    className={`ranking-card-item clickable ${selectedItemModal?.product_id === item.product_id ? 'active-item' : ''}`}
                                    onClick={() => setSelectedItemModal(item)}
                                    title="Clique para ver por que este produto está no ranking e como vai vender"
                                >
                                    <div className="item-left">
                                        <span className="item-num">{item.rank}.</span>
                                        <div className="item-info">
                                            <span className="item-title">{item.title}</span>
                                            {item.key_driver && (
                                                <span className="item-driver-pill">⚡ {item.key_driver}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="item-right">
                                        <span className="item-units">{item.predicted_units} un</span>
                                        <span className="item-price">
                                            R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Coluna Direita: Top 5 por Categoria */}
                <div className="dash-card ranking-col-card">
                    <div className="ranking-header-wrap">
                        <h2 className="ranking-card-title">TOP 5 PRODUTOS<br />POR CATEGORIA</h2>
                        <span className="ranking-hint-badge">💡 Clique para ver o motivo da IA</span>
                    </div>

                    <div className="ranking-items-list">
                        {loading ? (
                            <p className="empty-msg">Carregando categorias...</p>
                        ) : (
                            categoryItems.slice(0, 5).map((item) => (
                                <div
                                    key={item.product_id}
                                    className={`ranking-card-item clickable ${selectedItemModal?.product_id === item.product_id ? 'active-item' : ''}`}
                                    onClick={() => setSelectedItemModal(item)}
                                    title="Clique para ver por que este produto está no ranking e como vai vender"
                                >
                                    <div className="item-left">
                                        <span className="item-num">{item.rank}.</span>
                                        <div className="item-info">
                                            <span className="item-title">{item.title}</span>
                                            {item.key_driver && (
                                                <span className="item-driver-pill">⚡ {item.key_driver}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="item-right">
                                        <span className="item-units">{item.predicted_units} un</span>
                                        <span className="item-price">
                                            R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="ranking-cat-btn-wrap">
                        <select
                            className="btn-category-select"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            {categories.map((c) => (
                                <option key={c} value={c}>{c.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Modal de Explicabilidade de Ranking IA */}
            {selectedItemModal && (
                <div className="ranking-modal-overlay" onClick={() => setSelectedItemModal(null)}>
                    <div className="ranking-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="ranking-modal-header">
                            <div className="modal-badge-row">
                                <span className="modal-rank-badge">#{selectedItemModal.rank} NO RANKING</span>
                                <span className="modal-category-badge">{selectedItemModal.category}</span>
                            </div>
                            <button
                                type="button"
                                className="modal-close-btn"
                                onClick={() => setSelectedItemModal(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <h2 className="modal-prod-title">{selectedItemModal.title}</h2>

                        {/* Rationale Banner */}
                        <div className="modal-reason-box">
                            <div className="reason-label">🎯 MOTIVO DE ESTAR NO TOP RANKING:</div>
                            <p className="reason-text">
                                {selectedItemModal.rank_reason || `Produto classificado na posição ${selectedItemModal.rank} com alta probabilidade de conversão e forte tração de mercado nos próximos 30 dias.`}
                            </p>
                        </div>

                        {/* Key Metrics Grid */}
                        <div className="modal-metrics-grid">
                            <div className="modal-metric-card">
                                <span className="m-label">VENDAS PROJETADAS (30D)</span>
                                <span className="m-val text-cyan">{selectedItemModal.predicted_units} unidades</span>
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
                            <h4 className="dynamics-title">📊 Dinâmica de Vendas Prevista pelo Modelo IA:</h4>
                            <p className="dynamics-desc">
                                A projeção considera uma média diária consistente de {(selectedItemModal.predicted_units / 30).toFixed(1)} un/dia, com picos impulsionados por {selectedItemModal.key_driver?.toLowerCase() || 'tendência orgânica'}. A recomendação é manter estoque de segurança calibrado em pelo menos {Math.round(selectedItemModal.predicted_units * 1.25)} unidades para evitar ruptura.
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
