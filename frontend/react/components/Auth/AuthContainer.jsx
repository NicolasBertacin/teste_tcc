/**
 * AuthContainer.jsx
 * Container unificado da tela de Autenticação (Login / Cadastro / Recuperação de Senha).
 */

function AuthContainer({ onLoginSuccess, showToast, currentView, onSwitchView }) {
    const [internalView, setInternalView] = React.useState(currentView || 'login');
    const view = currentView || internalView;
    const [recoveryEmail, setRecoveryEmail] = React.useState('');
    const [recoveryCode, setRecoveryCode] = React.useState('');

    React.useEffect(() => {
        if (currentView) {
            // Se o usuário acessar recovery-2 ou recovery-3 diretamente sem ter email em memória, faz fallback seguro
            if ((currentView === 'recovery-2' || currentView === 'recovery-3') && !recoveryEmail) {
                setInternalView('recovery-1');
                if (onSwitchView) onSwitchView('recovery-1');
            } else {
                setInternalView(currentView);
            }
        }
    }, [currentView, recoveryEmail]);

    const setView = (nextView) => {
        setInternalView(nextView);
        if (onSwitchView) {
            onSwitchView(nextView);
        }
    };

    return (
        <main className="main-wrapper" id="authSection">
            <Header />

            <section className="auth-card" id="authCard">
                {/* Painel Lateral */}
                <div className="auth-side-panel" id="sidePanel">
                    {view === 'login' && (
                        <div className="side-content active">
                            <h2 className="side-title">BEM-VINDO<br />DE VOLTA!</h2>
                            <div className="side-action-wrap">
                                <p className="side-caption">Ainda não tem conta?</p>
                                <button
                                    type="button"
                                    className="btn-side"
                                    onClick={() => setView('register')}
                                >
                                    CADASTRAR
                                </button>
                            </div>
                        </div>
                    )}

                    {view === 'register' && (
                        <div className="side-content active">
                            <h2 className="side-title">ACESSE SUA<br />CONTA</h2>
                            <div className="side-action-wrap">
                                <p className="side-caption">Já possui conta?</p>
                                <button
                                    type="button"
                                    className="btn-side"
                                    onClick={() => setView('login')}
                                >
                                    ENTRAR
                                </button>
                            </div>
                        </div>
                    )}

                    {view.startsWith('recovery') && (
                        <div className="side-content active">
                            <h2 className="side-title">RECUPERE<br />SUA SENHA</h2>
                            <div className="side-action-wrap">
                                <p className="side-caption">Lembrou da senha?</p>
                                <button
                                    type="button"
                                    className="btn-side"
                                    onClick={() => setView('login')}
                                >
                                    ENTRAR
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Painel do Formulário */}
                <div className="auth-form-panel">
                    {view === 'login' && (
                        <LoginForm
                            onSwitchView={setView}
                            onLoginSuccess={onLoginSuccess}
                            showToast={showToast}
                        />
                    )}

                    {view === 'register' && (
                        <RegisterForm
                            onSwitchView={setView}
                            showToast={showToast}
                        />
                    )}

                    {view === 'recovery-1' && (
                        <RecoveryStep1
                            onNext={(email) => {
                                setRecoveryEmail(email);
                                setView('recovery-2');
                            }}
                            showToast={showToast}
                        />
                    )}

                    {view === 'recovery-2' && (
                        <RecoveryStep2
                            recoveryEmail={recoveryEmail}
                            onNext={(code) => {
                                setRecoveryCode(code);
                                setView('recovery-3');
                            }}
                            showToast={showToast}
                        />
                    )}

                    {view === 'recovery-3' && (
                        <RecoveryStep3
                            recoveryEmail={recoveryEmail}
                            recoveryCode={recoveryCode}
                            onFinish={() => setView('login')}
                            showToast={showToast}
                        />
                    )}
                </div>
            </section>
        </main>
    );
}
