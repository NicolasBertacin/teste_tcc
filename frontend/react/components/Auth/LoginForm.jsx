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
    const [coldStartNotice, setColdStartNotice] = React.useState(false);

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
        setColdStartNotice(false);

        // Alerta de Cold Start caso a API na nuvem demore mais de 3.5s para responder
        const coldStartTimer = setTimeout(() => {
            setColdStartNotice(true);
        }, 3500);

        try {
            const data = await window.apiService.auth.login(email.trim(), password);
            clearTimeout(coldStartTimer);
            showToast(`Bem-vindo, ${data.user.email}!`, 'success');
            onLoginSuccess(data.user);
        } catch (err) {
            clearTimeout(coldStartTimer);
            setErrors({ password: err.message || 'Email ou senha incorretos.' });
            showToast(err.message || 'Falha ao autenticar.', 'error');
        } finally {
            clearTimeout(coldStartTimer);
            setLoading(false);
            setColdStartNotice(false);
        }
    };

    return (
        <form className="login-form-content" onSubmit={handleSubmit} noValidate>
            <h1>EMAIL:</h1>
            <input
                type="email"
                className="login-input"
                placeholder="Digite seu email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
            />
            {errors.email && <span className="login-field-error">{errors.email}</span>}

            <h1>SENHA:</h1>
            <div className="password-container">
                <input
                    type={showPassword ? 'text' : 'password'}
                    id="senha"
                    className="login-input"
                    placeholder="Digite sua senha..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                />
                <button
                    type="button"
                    id="toggleSenha"
                    aria-label="Mostrar ou ocultar senha"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    <i className={showPassword ? "ph ph-eye-slash" : "ph ph-eye"}></i>
                </button>
            </div>
            {errors.password && <span className="login-field-error">{errors.password}</span>}

            <button type="submit" className="button-right" disabled={loading}>
                {loading ? <span className="login-spinner"></span> : 'ENTRAR'}
            </button>

            {coldStartNotice && (
                <div style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    background: 'rgba(0, 240, 255, 0.08)',
                    border: '1px solid rgba(0, 240, 255, 0.25)',
                    borderRadius: '8px',
                    color: '#00f0ff',
                    fontSize: '11px',
                    lineHeight: '1.4',
                    textAlign: 'center'
                }}>
                    <i className="ph ph-lightning" style={{ marginRight: '4px' }}></i>
                    Conectando ao servidor em nuvem... Isso pode levar alguns instantes na primeira inicialização.
                </div>
            )}

            <span
                className="login-span"
                onClick={() => onSwitchView('recovery-1')}
            >
                Esqueceu sua senha?<br />Clique aqui.
            </span>
        </form>
    );
}
