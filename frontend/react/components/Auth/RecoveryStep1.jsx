/**
 * RecoveryStep1.jsx
 * Solicitação de código de recuperação de senha por email.
 */

function RecoveryStep1({ onNext, showToast }) {
    const [email, setEmail] = React.useState('');
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            setError('Informe seu email cadastrado.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const res = await window.apiService.auth.forgotPassword(email.trim());
            showToast(res.message, 'success', 7000);
            onNext(email.trim());
        } catch (err) {
            setError(err.message || 'Email não encontrado.');
            showToast(err.message || 'Erro ao enviar código.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="auth-form active" onSubmit={handleSubmit} noValidate>
            <h3 className="form-banner-text">ENVIAREMOS UM CÓDIGO<br />PARA SEU EMAIL</h3>

            <div className="form-group mt-large">
                <label htmlFor="recoveryEmail" className="form-label">EMAIL:</label>
                <div className="input-wrapper">
                    <input
                        type="email"
                        id="recoveryEmail"
                        className="form-input"
                        placeholder="Digite seu email..."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />
                </div>
                {error && <span className="field-error">{error}</span>}
            </div>

            <div className="form-actions mt-xlarge">
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? <span className="btn-spinner"></span> : <span className="btn-text">ENVIAR</span>}
                </button>
            </div>
        </form>
    );
}
