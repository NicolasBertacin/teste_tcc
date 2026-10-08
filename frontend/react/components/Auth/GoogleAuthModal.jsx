/**
 * GoogleAuthModal.jsx
 * Modal Oficial Google Dark Mode (OAuth 2.0 & Autenticação de 2 Fatores - 2FA).
 * Reproduz fielmente a interface "Fazer Login com o Google / Escolha uma conta".
 */

function GoogleAuthModal({ isOpen, onClose, onLoginSuccess, showToast, initialEmail = '' }) {
    const [step, setStep] = React.useState('select'); // 'select' | 'custom' | '2fa'
    const [selectedAccount, setSelectedAccount] = React.useState(null);
    const [customEmail, setCustomEmail] = React.useState(initialEmail || '');
    const [customName, setCustomName] = React.useState('');
    const [otpCode, setOtpCode] = React.useState(['', '', '', '']);
    const [loading, setLoading] = React.useState(false);
    const [resendCooldown, setResendCooldown] = React.useState(0);
    const [errorMessage, setErrorMessage] = React.useState('');

    // Contas Google sugeridas conforme o protótipo real
    const defaultAccounts = React.useMemo(() => {
        const base = [
            {
                name: 'kill fn1',
                email: 'fireace151@gmail.com',
                avatarType: 'img',
                avatarSrc: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=faces'
            },
            {
                name: 'nicolas bertacin',
                email: 'niicolas.bertacin@gmail.com',
                avatarType: 'initial',
                avatarBg: '#d97706', // Laranja do protótipo
                initial: 'n'
            },
            {
                name: 'TrendCommerce AI',
                email: 'trendeccomerceai@gmail.com',
                avatarType: 'initial',
                avatarBg: '#0284c7',
                initial: 'T'
            }
        ];

        if (initialEmail && initialEmail.includes('@')) {
            const clean = initialEmail.toLowerCase().trim();
            if (!base.some(a => a.email.toLowerCase() === clean)) {
                base.unshift({
                    name: clean.split('@')[0],
                    email: clean,
                    avatarType: 'initial',
                    avatarBg: '#7c3aed',
                    initial: clean.charAt(0).toUpperCase()
                });
            }
        }
        return base;
    }, [initialEmail]);

    React.useEffect(() => {
        if (isOpen) {
            setStep('select');
            setOtpCode(['', '', '', '']);
            setErrorMessage('');
            setLoading(false);
        }
    }, [isOpen]);

    // Timer de contagem regressiva para reenvio do código 2FA
    React.useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    if (!isOpen) return null;

    const GOOGLE_CLIENT_ID = window.GOOGLE_CLIENT_ID || '33242244365-ubjiqb1h7thh0t6n5hdg3e3ugsuebm6e.apps.googleusercontent.com';

    // Iniciar fluxo nativo de popup do Google se o Google GIS estiver carregado
    const handleLaunchGoogleGIS = () => {
        if (window.google?.accounts?.oauth2) {
            try {
                const tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: GOOGLE_CLIENT_ID,
                    scope: 'email profile openid',
                    prompt: 'select_account',
                    callback: async (tokenResponse) => {
                        if (tokenResponse && tokenResponse.access_token) {
                            try {
                                setLoading(true);
                                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                                });
                                const profile = await userInfoRes.json();
                                if (profile && profile.email) {
                                    handleSelectAccountAndSend2FA({
                                        name: profile.name || profile.given_name || profile.email.split('@')[0],
                                        email: profile.email,
                                        avatarType: profile.picture ? 'img' : 'initial',
                                        avatarSrc: profile.picture,
                                        avatarBg: '#0284c7',
                                        initial: (profile.name || profile.email).charAt(0).toUpperCase()
                                    });
                                }
                            } catch (fetchErr) {
                                console.warn('[GIS Profile Error]', fetchErr);
                            } finally {
                                setLoading(false);
                            }
                        }
                    }
                });
                tokenClient.requestAccessToken({ prompt: 'select_account' });
            } catch (gisErr) {
                console.warn('[GIS Init Error]', gisErr);
            }
        } else if (window.google?.accounts?.id) {
            try {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: async (response) => {
                        if (response && response.credential) {
                            try {
                                setLoading(true);
                                const data = await window.apiService.auth.loginWithGoogle({ token: response.credential });
                                showToast(`Bem-vindo, ${data.user.email}!`, 'success');
                                onClose();
                                onLoginSuccess(data.user);
                            } catch (err) {
                                showToast(err.message || 'Falha ao autenticar com Google ID Token.', 'error');
                            } finally {
                                setLoading(false);
                            }
                        }
                    }
                });
                window.google.accounts.id.prompt();
            } catch (idErr) {
                console.warn('[GIS ID Prompt Error]', idErr);
            }
        }
    };

    // Disparar envio de código de 2 Fatores (OTP) para o e-mail
    const handleSelectAccountAndSend2FA = async (account) => {
        const targetEmail = account.email.trim().toLowerCase();
        const targetName = account.name || targetEmail.split('@')[0];

        setErrorMessage('');
        setLoading(true);
        setSelectedAccount(account);

        try {
            const resp = await window.apiService.auth.requestGoogleCode(targetEmail, targetName);
            showToast(resp.message || `Código 2FA enviado para ${targetEmail}!`, 'success');
            setStep('2fa');
            setResendCooldown(45);
        } catch (err) {
            setErrorMessage(err.message || 'Falha ao enviar código 2FA para o e-mail selecionado.');
            showToast(err.message || 'Erro no envio do código de verificação.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Submissão do código 2FA
    const handleVerify2FA = async (e) => {
        if (e) e.preventDefault();
        const code = otpCode.join('').trim();
        if (code.length < 4) {
            setErrorMessage('Digite os 4 dígitos do código recebido no seu e-mail.');
            return;
        }

        setErrorMessage('');
        setLoading(true);

        try {
            const data = await window.apiService.auth.verifyGoogleCode(
                selectedAccount.email,
                code,
                selectedAccount.name
            );
            showToast(`Autenticação de 2 fatores aprovada! Bem-vindo, ${data.user.name || data.user.email}!`, 'success');
            onClose();
            onLoginSuccess(data.user);
        } catch (err) {
            setErrorMessage(err.message || 'Código 2FA incorreto ou expirado.');
            showToast(err.message || 'Código de verificação inválido.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Gerenciador de digitação e auto-focus dos 4 dígitos
    const handleOtpChange = (index, value) => {
        const cleaned = value.replace(/\D/g, '');
        const newCode = [...otpCode];

        if (cleaned.length > 1) {
            const chars = cleaned.slice(0, 4).split('');
            for (let i = 0; i < 4; i++) {
                newCode[i] = chars[i] || '';
            }
            setOtpCode(newCode);
            const lastIdx = Math.min(chars.length - 1, 3);
            const nextInput = document.getElementById(`google-2fa-${lastIdx}`);
            if (nextInput) nextInput.focus();
            return;
        }

        newCode[index] = cleaned.slice(-1);
        setOtpCode(newCode);

        if (cleaned && index < 3) {
            const nextInput = document.getElementById(`google-2fa-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
            const prevInput = document.getElementById(`google-2fa-${index - 1}`);
            if (prevInput) {
                prevInput.focus();
                const newCode = [...otpCode];
                newCode[index - 1] = '';
                setOtpCode(newCode);
            }
        }
    };

    return (
        <div className="google-oauth-backdrop" onClick={onClose}>
            <div className="google-oauth-window" onClick={(e) => e.stopPropagation()}>
                {/* Barra Superior Oficial Google */}
                <div className="google-oauth-topbar">
                    <div className="google-topbar-brand">
                        <svg className="google-topbar-icon" viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        <span>Fazer Login com o Google</span>
                    </div>

                    <button type="button" className="google-oauth-close-btn" onClick={onClose} aria-label="Fechar">
                        <i className="ph ph-x"></i>
                    </button>
                </div>

                {/* Conteúdo Principal em 2 Colunas */}
                <div className="google-oauth-body">
                    {/* ETAPA 1: ESCOLHA UMA CONTA */}
                    {step === 'select' && (
                        <div className="google-oauth-grid">
                            {/* Coluna Esquerda: Título e App Info */}
                            <div className="google-oauth-left">
                                <div className="google-app-logo-wrap">
                                    <img src="assets/logo.png" alt="TrendCommerce Logo" onError={(e) => { e.target.style.display = 'none'; }} />
                                </div>
                                <h1 className="google-oauth-headline">Escolha uma conta</h1>
                                <p className="google-oauth-subheadline">
                                    Prosseguir para <a href="#!">TrendCommerce AI</a>
                                </p>
                            </div>

                            {/* Coluna Direita: Lista de Contas */}
                            <div className="google-oauth-right">
                                {errorMessage && (
                                    <div className="google-error-alert">
                                        <i className="ph ph-warning-circle"></i>
                                        <span>{errorMessage}</span>
                                    </div>
                                )}

                                <div className="google-account-rows">
                                    {defaultAccounts.map((acc, index) => (
                                        <div
                                            key={index}
                                            className="google-account-row"
                                            onClick={() => handleSelectAccountAndSend2FA(acc)}
                                        >
                                            {acc.avatarType === 'img' ? (
                                                <img src={acc.avatarSrc} alt={acc.name} className="google-row-avatar-img" />
                                            ) : (
                                                <div className="google-row-avatar-circle" style={{ backgroundColor: acc.avatarBg || '#1a73e8' }}>
                                                    {acc.initial}
                                                </div>
                                            )}

                                            <div className="google-row-details">
                                                <div className="google-row-name">{acc.name}</div>
                                                <div className="google-row-email">{acc.email}</div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Opção "Usar outra conta" */}
                                    <div
                                        className="google-account-row google-add-row"
                                        onClick={() => {
                                            setErrorMessage('');
                                            setStep('custom');
                                        }}
                                    >
                                        <div className="google-row-avatar-circle google-add-circle">
                                            <i className="ph ph-user-circle"></i>
                                        </div>
                                        <div className="google-row-details">
                                            <div className="google-row-name google-add-text">Usar outra conta</div>
                                        </div>
                                    </div>

                                    {/* Opção de abrir pop-up nativo do Google se o GIS estiver ativo */}
                                    {window.google?.accounts?.oauth2 && (
                                        <div
                                            className="google-account-row google-gis-native-row"
                                            onClick={handleLaunchGoogleGIS}
                                        >
                                            <div className="google-row-avatar-circle" style={{ backgroundColor: 'rgba(138, 180, 248, 0.15)', color: '#8ab4f8', border: '1px solid rgba(138, 180, 248, 0.3)' }}>
                                                <i className="ph ph-arrow-square-out" style={{ fontSize: '20px' }}></i>
                                            </div>
                                            <div className="google-row-details">
                                                <div className="google-row-name" style={{ color: '#8ab4f8' }}>Abrir pop-up nativo do Google</div>
                                                <div className="google-row-email">Selecionar perfil sincronizado no navegador</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="google-oauth-disclaimer">
                                    Consulte a <a href="#!">Política de Privacidade</a> e os <a href="#!">Termos de Serviço</a> do app TrendCommerce AI antes de usá-lo.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ETAPA 1.1: DIGITAR OUTRA CONTA GOOGLE */}
                    {step === 'custom' && (
                        <div className="google-oauth-grid">
                            <div className="google-oauth-left">
                                <div className="google-app-logo-wrap">
                                    <img src="assets/logo.png" alt="TrendCommerce Logo" onError={(e) => { e.target.style.display = 'none'; }} />
                                </div>
                                <h1 className="google-oauth-headline">Fazer Login</h1>
                                <p className="google-oauth-subheadline">
                                    Use sua Conta do Google para acessar o <a href="#!">TrendCommerce AI</a>
                                </p>
                            </div>

                            <div className="google-oauth-right">
                                {errorMessage && (
                                    <div className="google-error-alert">
                                        <i className="ph ph-warning-circle"></i>
                                        <span>{errorMessage}</span>
                                    </div>
                                )}

                                <form
                                    className="google-custom-form"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSelectAccountAndSend2FA({ email: customEmail, name: customName });
                                    }}
                                >
                                    <div className="google-material-input-group">
                                        <label>E-mail ou telefone</label>
                                        <input
                                            type="email"
                                            className="google-material-input"
                                            placeholder="Digite seu e-mail do Google..."
                                            value={customEmail}
                                            onChange={(e) => setCustomEmail(e.target.value)}
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    <div className="google-material-input-group" style={{ marginTop: '16px' }}>
                                        <label>Nome completo (opcional)</label>
                                        <input
                                            type="text"
                                            className="google-material-input"
                                            placeholder="Seu nome de exibição..."
                                            value={customName}
                                            onChange={(e) => setCustomName(e.target.value)}
                                        />
                                    </div>

                                    <div className="google-form-actions">
                                        <button
                                            type="button"
                                            className="google-btn-text"
                                            onClick={() => setStep('select')}
                                        >
                                            Voltar
                                        </button>

                                        <button
                                            type="submit"
                                            className="google-btn-primary"
                                            disabled={loading || !customEmail.includes('@')}
                                        >
                                            {loading ? <span className="login-spinner"></span> : 'Próxima'}
                                        </button>
                                    </div>
                                </form>

                                <div className="google-oauth-disclaimer">
                                    Consulte a <a href="#!">Política de Privacidade</a> e os <a href="#!">Termos de Serviço</a> do app TrendCommerce AI antes de usá-lo.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ETAPA 2: AUTENTICAÇÃO DE 2 FATORES (2FA COM CÓDIGO POR EMAIL) */}
                    {step === '2fa' && (
                        <div className="google-oauth-grid">
                            <div className="google-oauth-left">
                                <div className="google-2fa-shield-icon">
                                    <i className="ph ph-shield-check"></i>
                                </div>
                                <h1 className="google-oauth-headline">Verificação em duas etapas</h1>
                                <p className="google-oauth-subheadline">
                                    Para confirmar sua identidade, enviamos um código de 4 dígitos para:
                                </p>
                                <div className="google-2fa-badge">
                                    <i className="ph ph-envelope-simple"></i>
                                    <strong>{selectedAccount?.email}</strong>
                                </div>
                            </div>

                            <div className="google-oauth-right">
                                {errorMessage && (
                                    <div className="google-error-alert">
                                        <i className="ph ph-warning-circle"></i>
                                        <span>{errorMessage}</span>
                                    </div>
                                )}

                                <form className="google-2fa-form" onSubmit={handleVerify2FA}>
                                    <p className="google-2fa-instruction">
                                        Digite o código de 4 dígitos para concluir o login seguro com o Google:
                                    </p>

                                    <div className="codigo-container google-2fa-inputs">
                                        {otpCode.map((digit, idx) => (
                                            <input
                                                key={idx}
                                                id={`google-2fa-${idx}`}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                className="codigo-input"
                                                value={digit}
                                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                                autoFocus={idx === 0}
                                                required
                                            />
                                        ))}
                                    </div>

                                    <div className="google-2fa-resend-wrap">
                                        {resendCooldown > 0 ? (
                                            <span className="google-resend-timer">
                                                Reenviar código em <strong>{resendCooldown}s</strong>
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                className="google-resend-link"
                                                onClick={() => handleSelectAccountAndSend2FA(selectedAccount)}
                                                disabled={loading}
                                            >
                                                Não recebi o código. Reenviar agora
                                            </button>
                                        )}
                                    </div>

                                    <div className="google-form-actions">
                                        <button
                                            type="button"
                                            className="google-btn-text"
                                            onClick={() => {
                                                setStep('select');
                                                setOtpCode(['', '', '', '']);
                                                setErrorMessage('');
                                            }}
                                        >
                                            Escolher outra conta
                                        </button>

                                        <button
                                            type="submit"
                                            className="google-btn-primary"
                                            disabled={loading || otpCode.join('').length < 4}
                                        >
                                            {loading ? <span className="login-spinner"></span> : 'Confirmar'}
                                        </button>
                                    </div>
                                </form>

                                <div className="google-oauth-disclaimer">
                                    A Verificação em duas etapas do Google protege sua conta contra acessos não autorizados.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
