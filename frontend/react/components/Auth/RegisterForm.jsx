/**
 * RegisterForm.jsx
 * Formulário de Cadastro de Novo Usuário em React.
 */

function RegisterForm({ onSwitchView, showToast }) {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirm, setShowConfirm] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!email.trim()) newErrors.email = 'Informe um email válido.';
        if (password.length < 6) newErrors.password = 'A senha deve ter no mínimo 6 caracteres.';
        if (password !== confirmPassword) newErrors.confirmPassword = 'As senhas não coincidem.';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setLoading(true);

        try {
            await window.apiService.auth.register(email.trim(), password);
            showToast('Cadastro realizado com sucesso! Faça login para continuar.', 'success');
            onSwitchView('login');
        } catch (err) {
            setErrors({ email: err.message || 'Erro ao realizar cadastro.' });
            showToast(err.message || 'Erro ao cadastrar.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="auth-form active" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
                <label htmlFor="registerEmail" className="form-label">EMAIL:</label>
                <div className="input-wrapper">
                    <input
                        type="email"
                        id="registerEmail"
                        className="form-input"
                        placeholder="Digite seu email..."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />
                </div>
                {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
                <label htmlFor="registerPassword" className="form-label">SENHA:</label>
                <div className="input-wrapper password-wrapper">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        id="registerPassword"
                        className="form-input"
                        placeholder="Digite sua senha..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                    />
                    <button
                        type="button"
                        className="btn-toggle-pass"
                        aria-label="Mostrar ou ocultar senha"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? (
                            <svg className="eye-off-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                            </svg>
                        ) : (
                            <svg className="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        )}
                    </button>
                </div>
                {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-group">
                <label htmlFor="registerConfirmPassword" className="form-label">SENHA:</label>
                <div className="input-wrapper password-wrapper">
                    <input
                        type={showConfirm ? 'text' : 'password'}
                        id="registerConfirmPassword"
                        className="form-input"
                        placeholder="Digite sua senha..."
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                    />
                    <button
                        type="button"
                        className="btn-toggle-pass"
                        aria-label="Mostrar ou ocultar senha"
                        onClick={() => setShowConfirm(!showConfirm)}
                    >
                        {showConfirm ? (
                            <svg className="eye-off-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                            </svg>
                        ) : (
                            <svg className="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        )}
                    </button>
                </div>
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
            </div>

            <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? <span className="btn-spinner"></span> : <span className="btn-text">CADASTRAR</span>}
                </button>
            </div>
        </form>
    );
}
