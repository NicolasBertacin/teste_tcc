/**
 * DashboardLayout.jsx
 * Layout principal do Dashboard TrendCommerce AI em React.
 */

function DashboardLayout({ user, onLogout, showToast }) {
    const [activeTab, setActiveTab] = React.useState('ia-preditiva');
    const [categories, setCategories] = React.useState([]);
    const [products, setProducts] = React.useState([]);

    React.useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [cats, prods] = await Promise.all([
                window.apiService.products.getCategories(),
                window.apiService.products.list({ limit: 100 })
            ]);
            setCategories(cats || []);
            setProducts(prods?.items || []);
        } catch (err) {
            console.error('Erro ao carregar dados do dashboard:', err);
        }
    };

    return (
        <div className="dashboard-layout" id="dashboardSection">
            <Sidebar
                user={user}
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                onLogout={onLogout}
            />

            <div className="dash-main-area">
                <TopHeader />

                {activeTab === 'ia-preditiva' && (
                    <IaPreditivaTab
                        categories={categories}
                        showToast={showToast}
                    />
                )}

                {activeTab === 'ranking' && (
                    <RankingTab
                        categories={categories}
                    />
                )}

                {activeTab === 'analise-especifica' && (
                    <AnaliseEspecificaTab
                        products={products}
                        showToast={showToast}
                    />
                )}
            </div>
        </div>
    );
}
