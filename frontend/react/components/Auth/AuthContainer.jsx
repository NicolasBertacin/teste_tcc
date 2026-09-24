/**
 * AuthContainer.jsx
 * Container unificado da tela de Autenticação (Login / Cadastro / Recuperação de Senha).
 */

function AuthContainer({ onLoginSuccess, showToast }) {
    const [view, setView] = React.useState('login'); // 'login' | 'register' | 'recovery-1' | 'recovery-2' | 'recovery-3'
    const [recoveryEmail, setRecoveryEmail] = React.useState('');
    const [recoveryCode, setRecoveryCode] = React.useState('');

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
