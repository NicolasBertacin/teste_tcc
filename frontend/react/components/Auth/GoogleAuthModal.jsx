/**
 * GoogleAuthModal.jsx
 * Modal oficial e funcional de Seleção de Conta Google e Validação de E-mail via Código OTP de 4 Dígitos.
 */

function GoogleAuthModal({ isOpen, onClose, onLoginSuccess, showToast, initialEmail = '' }) {
    const [step, setStep] = React.useState('select'); // 'select' | 'custom' | 'otp'
    const [selectedAccount, setSelectedAccount] = React.useState(null);
    const [customEmail, setCustomEmail] = React.useState(initialEmail || '');
    const [customName, setCustomName] = React.useState('');
    const [otpCode, setOtpCode] = React.useState(['', '', '', '']);
    const [loading, setLoading] = React.useState(false);
    const [resendCooldown, setResendCooldown] = React.useState(0);
    const [errorMessage, setErrorMessage] = React.useState('');

    // Lista de contas sugeridas/rápidas
    const defaultAccounts = React.useMemo(() => {
        const list = [
            {
                name: 'Aluno TCC',
                email: 'aluno.tcc.projeto@gmail.com',
                avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
            },
            {
                name: 'TrendCommerce Admin',
                email: 'trendeccomerceai@gmail.com',
                avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
            }
        ];
        if (initialEmail && initialEmail.includes('@') && !list.some(a => a.email.toLowerCase() === initialEmail.toLowerCase())) {
            list.unshift({
                name: initialEmail.split('@')[0],
                email: initialEmail.toLowerCase(),
                avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
            });
        }
        return list;
    }, [initialEmail]);

    React.useEffect(() => {
        if (isOpen) {
            setStep('select');
            setOtpCode(['', '', '', '']);
            setErrorMessage('');
            setLoading(false);
        }
    }, [isOpen]);

    // Timer do botão de reenvio
    React.useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    if (!isOpen) return null;

    // Enviar código para o e-mail selecionado
    const handleSendCode = async (targetEmail, targetName) => {
        const cleanEmail = targetEmail.trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@')) {
            setErrorMessage('Informe um e-mail válido da sua conta Google.');
            return;
        }

        setErrorMessage('');
        setLoading(true);
        setSelectedAccount({ email: cleanEmail, name: targetName || cleanEmail.split('@')[0] });

        try {
            const resp = await window.apiService.auth.requestGoogleCode(cleanEmail, targetName);
            showToast(resp.message || `Código enviado para ${cleanEmail}!`, 'success');
            setStep('otp');
            setResendCooldown(45);
        } catch (err) {
            setErrorMessage(err.message || 'Falha ao enviar código para o e-mail informado.');
            showToast(err.message || 'Erro no envio do código.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Submissão do código OTP digitado
    const handleVerifyOtp = async (e) => {
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
            showToast(`Conta Google (${data.user.email}) validada e conectada com sucesso!`, 'success');
            onClose();
            onLoginSuccess(data.user);
        } catch (err) {
            setErrorMessage(err.message || 'Código incorreto. Verifique seu e-mail.');
            showToast(err.message || 'Código de verificação inválido.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Gerenciador dos inputs de 4 dígitos
    const handleOtpChange = (index, value) => {
        const cleaned = value.replace(/\D/g, '');
        const newCode = [...otpCode];

        if (cleaned.length > 1) {
            // Se colou código completo
            const chars = cleaned.slice(0, 4).split('');
            for (let i = 0; i < 4; i++) {
                newCode[i] = chars[i] || '';
            }
            setOtpCode(newCode);
            const lastIdx = Math.min(chars.length - 1, 3);
            const nextInput = document.getElementById(`google-otp-${lastIdx}`);
            if (nextInput) nextInput.focus();
            return;
        }

        newCode[index] = cleaned.slice(-1);
        setOtpCode(newCode);

        if (cleaned && index < 3) {
            const nextInput = document.getElementById(`google-otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
            const prevInput = document.getElementById(`google-otp-${index - 1}`);
            if (prevInput) {
                prevInput.focus();
                const newCode = [...otpCode];
                newCode[index - 1] = '';
                setOtpCode(newCode);
            }
        }
    };

    return (
        <div className="google-modal-backdrop" onClick={onClose}>
            <div className="google-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Botão de Fechar */}
                <button type="button" className="google-modal-close" onClick={onClose} aria-label="Fechar">
                    <i className="ph ph-x"></i>
                </button>

                {/* Cabeçalho Oficial Google */}
                <div className="google-modal-header">
                    <svg className="google-svg-logo" viewBox="0 0 24 24" width="32" height="32">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>

                    <h2 className="google-modal-title">
                        {step === 'otp' ? 'Verifique seu e-mail' : 'Fazer login com o Google'}
                    </h2>
                    <p className="google-modal-subtitle">
                        {step === 'otp' ? (
                            <React.Fragment>
                                Enviamos um código de segurança de 4 dígitos para:<br />
                                <strong style={{ color: '#00f0ff' }}>{selectedAccount?.email}</strong>
                            </React.Fragment>
                        ) : (
                            'Escolha uma conta para continuar no TrendCommerce AI'
                        )}
                    </p>
                </div>

                {errorMessage && (
                    <div className="google-modal-error">
                        <i className="ph ph-warning-circle"></i>
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* ETAPA 1: Lista de Contas */}
                {step === 'select' && (
                    <div className="google-accounts-list">
                        {defaultAccounts.map((acc, idx) => (
                            <div
                                key={idx}
                                className="google-account-item"
                                onClick={() => handleSendCode(acc.email, acc.name)}
                            >
                                <div className="google-avatar-wrap">
                                    <span className="google-avatar-initial">{acc.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="google-account-info">
                                    <div className="google-account-name">{acc.name}</div>
                                    <div className="google-account-email">{acc.email}</div>
                                </div>
                                <i className="ph ph-caret-right google-account-arrow"></i>
                            </div>
                        ))}

                        {/* Opção Usar Outra Conta */}
                        <div
                            className="google-account-item google-add-account"
                            onClick={() => {
                                setErrorMessage('');
                                setStep('custom');
                            }}
                        >
                            <div className="google-avatar-wrap add-icon">
                                <i className="ph ph-user-plus"></i>
                            </div>
                            <div className="google-account-info">
                                <div className="google-account-name">Usar outra conta Google</div>
                                <div className="google-account-email">Digite qualquer endereço Gmail ou corporativo</div>
                            </div>
                            <i className="ph ph-caret-right google-account-arrow"></i>
                        </div>
                    </div>
                )}

                {/* ETAPA 1.1: Digitar Conta Personalizada */}
                {step === 'custom' && (
                    <form
                        className="google-custom-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendCode(customEmail, customName);
                        }}
                    >
                        <div className="google-input-group">
                            <label>SEU E-MAIL DO GOOGLE:</label>
                            <input
                                type="email"
                                className="login-input"
                                placeholder="exemplo@gmail.com"
                                value={customEmail}
                                onChange={(e) => setCustomEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="google-input-group" style={{ marginTop: '10px' }}>
                            <label>SEU NOME (OPCIONAL):</label>
                            <input
                                type="text"
                                className="login-input"
                                placeholder="Seu nome ou apelido..."
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                            />
                        </div>

                        <div className="google-modal-actions">
                            <button
                                type="button"
                                className="btn-google-back"
                                onClick={() => setStep('select')}
                            >
                                Voltar
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading}
                                style={{ minWidth: '140px', height: '44px' }}
                            >
                                {loading ? <span className="login-spinner"></span> : 'CONTINUAR'}
                            </button>
                        </div>
                    </form>
                )}

                {/* ETAPA 2: Digitar Código OTP */}
                {step === 'otp' && (
                    <form className="google-otp-form" onSubmit={handleVerifyOtp}>
                        <div className="codigo-container">
                            {otpCode.map((digit, idx) => (
                                <input
                                    key={idx}
                                    id={`google-otp-${idx}`}
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

                        <div className="codigo-resend">
                            {resendCooldown > 0 ? (
                                <span>Reenviar código em <strong>{resendCooldown}s</strong></span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => handleSendCode(selectedAccount.email, selectedAccount.name)}
                                    disabled={loading}
                                >
                                    Reenviar código de verificação
                                </button>
                            )}
                        </div>

                        <div className="google-modal-actions">
                            <button
                                type="button"
                                className="btn-google-back"
                                onClick={() => {
                                    setStep('select');
                                    setOtpCode(['', '', '', '']);
                                    setErrorMessage('');
                                }}
                            >
                                Trocar conta
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading || otpCode.join('').length < 4}
                                style={{ minWidth: '160px', height: '44px' }}
                            >
                                {loading ? <span className="login-spinner"></span> : 'CONFIRMAR'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="google-modal-footer">
                    <p>
                        Para continuar, o Google compartilhará seu nome e endereço de e-mail com o TrendCommerce AI.
                    </p>
                </div>
            </div>
        </div>
    );
}
