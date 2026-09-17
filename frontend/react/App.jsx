/**
 * App.jsx
 * Aplicação Principal TrendCommerce AI em React 18.
 */

function App() {
    const [user, setUser] = React.useState(null);
    const [toasts, setToasts] = React.useState([]);

    React.useEffect(() => {
        const token = window.apiService.getToken();
        const storedUser = window.apiService.getUser();
        if (token && storedUser) {
            setUser(storedUser);
        }
    }, []);

    const showToast = React.useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const handleLoginSuccess = (authenticatedUser) => {
        setUser(authenticatedUser);
    };

    const handleLogout = () => {
        window.apiService.auth.logout();
        setUser(null);
        showToast('Sessão encerrada com sucesso.', 'info');
    };

    return (
        <div className="app-root">
            <BackgroundEffects />
            <ToastContainer toasts={toasts} />

            {user ? (
                <DashboardLayout
                    user={user}
                    onLogout={handleLogout}
                    showToast={showToast}
                />
            ) : (
                <AuthContainer
                    onLoginSuccess={handleLoginSuccess}
                    showToast={showToast}
                />
            )}
        </div>
    );
}
