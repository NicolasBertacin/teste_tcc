/**
 * LoginForm.jsx
 * Formulário de Login de Usuário integrado com a API REST FastAPI.
 */

function LoginForm({ onSwitchView, onLoginSuccess, showToast }) {
    const [email, setEmail] = React.useState('admin@trendecommerce.com');
    const [password, setPassword] = React.useState('admin123');
    const [showPassword, setShowPassword] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!email.trim()) newErrors.email = 'Informe seu email.';
        if (!password) newErrors.password = 'Informe sua senha.';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setLoading(true);

        try {
            const data = await window.apiService.auth.login(email.trim(), password);
            showToast(`Bem-vindo, ${data.user.email}!`, 'success');
            onLoginSuccess(data.user);
        } catch (err) {
            setErrors({ password: err.message || 'Email ou senha incorretos.' });
            showToast(err.message || 'Falha ao autenticar.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="auth-form active" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
                <label htmlFor="loginEmail" className="form-label">EMAIL:</label>
                <div className="input-wrapper">
                    <input
                        type="email"
                        id="loginEmail"
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
                <label htmlFor="loginPassword" className="form-label">SENHA:</label>
                <div className="input-wrapper password-wrapper">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        id="loginPassword"
                        className="form-input"
                        placeholder="Digite sua senha..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
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

            <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? <span className="btn-spinner"></span> : <span className="btn-text">ENTRAR</span>}
                </button>
            </div>

            <div className="form-footer">
                <p className="forgot-text">
                    Esqueceu a senha?<br />
                    <button
                        type="button"
                        className="btn-link"
                        onClick={() => onSwitchView('recovery-1')}
                    >
                        Clique aqui.
                    </button>
                </p>
            </div>
        </form>
    );
}
