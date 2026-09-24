/**
 * RankingTab.jsx
 * Aba Ranking Produtos: Top 7 Produtos Próximos 30 Dias e Top 5 Produtos por Categoria.
 */

function RankingTab({ categories }) {
    const [rankingData, setRankingData] = React.useState({ top_overall: [], top_by_category: {} });
    const [selectedCategory, setSelectedCategory] = React.useState('Celulares');
    const [loading, setLoading] = React.useState(true);

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
                    <h2 className="ranking-card-title">TOP 7 PRODUTOS<br />PRÓXIMOS 30 DIAS</h2>
                    <div className="ranking-items-list">
                        {loading ? (
                            <p className="empty-msg">Processando modelo XGBoost...</p>
                        ) : (
                            rankingData.top_overall.slice(0, 7).map((item) => (
                                <div key={item.product_id} className="ranking-card-item">
                                    <div className="item-left">
                                        <span className="item-num">{item.rank}.</span>
                                        <span className="item-title">{item.title}</span>
                                    </div>
                                    <div className="item-right">
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
                    <h2 className="ranking-card-title">TOP 5 PRODUTOS<br />POR CATEGORIA</h2>
                    <div className="ranking-items-list">
                        {loading ? (
                            <p className="empty-msg">Carregando categorias...</p>
                        ) : (
                            categoryItems.slice(0, 5).map((item) => (
                                <div key={item.product_id} className="ranking-card-item">
                                    <div className="item-left">
                                        <span className="item-num">{item.rank}.</span>
                                        <span className="item-title">{item.title}</span>
                                    </div>
                                    <div className="item-right">
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
        </section>
    );
}
