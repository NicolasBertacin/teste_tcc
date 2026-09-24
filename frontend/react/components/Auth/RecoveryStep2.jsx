/**
 * RecoveryStep2.jsx
 * Entrada de 4 dígitos (código OTP de recuperação).
 */

function RecoveryStep2({ recoveryEmail, onNext, showToast }) {
    const [otp, setOtp] = React.useState(['', '', '', '']);
    const [error, setError] = React.useState('');
    const inputRefs = [React.useRef(null), React.useRef(null), React.useRef(null), React.useRef(null)];

    React.useEffect(() => {
        if (inputRefs[0].current) {
            inputRefs[0].current.focus();
        }
    }, []);

    const handleChange = (index, value) => {
        const cleanVal = value.replace(/\D/g, '');
        const newOtp = [...otp];
        newOtp[index] = cleanVal ? cleanVal[0] : '';
        setOtp(newOtp);

        if (cleanVal && index < 3) {
            inputRefs[index + 1].current.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs[index - 1].current.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
        if (pasted) {
            const newOtp = [...otp];
            for (let i = 0; i < pasted.length; i++) {
                newOtp[i] = pasted[i];
            }
            setOtp(newOtp);
            const nextIdx = Math.min(pasted.length, 3);
            inputRefs[nextIdx].current.focus();
        }
    };

    const handleResend = async () => {
        try {
            const res = await window.apiService.auth.forgotPassword(recoveryEmail);
            showToast(res.message, 'info', 7000);
            setOtp(['', '', '', '']);
            inputRefs[0].current.focus();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 4) {
            setError('Digite os 4 dígitos do código de verificação.');
            return;
        }

        setError('');
        showToast('Código confirmado! Defina sua nova senha.', 'success');
        onNext(code);
    };

    return (
        <form className="auth-form active" onSubmit={handleSubmit} noValidate>
            <h3 className="form-banner-text-subtle">DIGITE SEU CÓDIGO:</h3>

            <div className="otp-container">
                {otp.map((digit, idx) => (
                    <input
                        key={idx}
                        ref={inputRefs[idx]}
                        type="text"
                        maxLength="1"
                        inputMode="numeric"
                        className="otp-input"
                        value={digit}
                        onChange={(e) => handleChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        onPaste={handlePaste}
                        autoComplete="off"
                    />
                ))}
            </div>

            {error && <span className="field-error text-center">{error}</span>}

            <div className="otp-resend">
                <span className="otp-info">Não recebeu o código? </span>
                <button type="button" className="btn-link" onClick={handleResend}>
                    Reenviar código
                </button>
            </div>

            <div className="form-actions mt-large">
                <button type="submit" className="btn-primary">
                    <span className="btn-text">ENVIAR</span>
                </button>
            </div>
        </form>
    );
}
