/**
 * RecoveryStep3.jsx
 * Redefinição de senha com nova senha e confirmação.
 */

function RecoveryStep3({ recoveryEmail, recoveryCode, onFinish, showToast }) {
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmNewPassword, setConfirmNewPassword] = React.useState('');
    const [showNew, setShowNew] = React.useState(false);
    const [showConfirm, setShowConfirm] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        if (newPassword.length < 6) newErrors.newPassword = 'A senha deve ter no mínimo 6 caracteres.';
        if (newPassword !== confirmNewPassword) newErrors.confirmNewPassword = 'As senhas não coincidem.';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setLoading(true);

        try {
            const res = await window.apiService.auth.resetPassword(recoveryEmail, recoveryCode, newPassword);
            showToast(res.message, 'success');
            onFinish();
        } catch (err) {
            setErrors({ newPassword: err.message || 'Erro ao redefinir senha.' });
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="auth-form active" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
                <label htmlFor="newPassword" className="form-label">SENHA:</label>
                <div className="input-wrapper password-wrapper">
                    <input
                        type={showNew ? 'text' : 'password'}
                        id="newPassword"
                        className="form-input"
                        placeholder="Digite sua senha..."
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                    />
                    <button
                        type="button"
                        className="btn-toggle-pass"
                        onClick={() => setShowNew(!showNew)}
                    >
                        {showNew ? (
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
                {errors.newPassword && <span className="field-error">{errors.newPassword}</span>}
            </div>

            <div className="form-group">
                <label htmlFor="confirmNewPassword" className="form-label">SENHA:</label>
                <div className="input-wrapper password-wrapper">
                    <input
                        type={showConfirm ? 'text' : 'password'}
                        id="confirmNewPassword"
                        className="form-input"
                        placeholder="Digite sua senha..."
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                    />
                    <button
                        type="button"
                        className="btn-toggle-pass"
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
                {errors.confirmNewPassword && <span className="field-error">{errors.confirmNewPassword}</span>}
            </div>

            <div className="form-actions mt-large">
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? <span className="btn-spinner"></span> : <span className="btn-text">LOGIN</span>}
                </button>
            </div>
        </form>
    );
}
