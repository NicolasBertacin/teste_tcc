"""Serviço de Envio de E-mails Transacionais — TrendCommerce AI.

Envia e-mails reais com códigos OTP criptografados via SMTP seguro (TLS/SSL).
Compatível com Gmail, Outlook, AWS SES, SendGrid, Mailgun e Brevo.
"""

import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid
from dotenv import load_dotenv

logger = logging.getLogger(__name__)


def send_otp_email(to_email: str, code: str) -> tuple[bool, str]:
    """Envia um e-mail HTML real com o código de recuperação de senha.
    
    Retorna:
        tuple[bool, str]: (sucesso: bool, mensagem_status: str)
    """
    load_dotenv(override=True)
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "465"))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").replace(" ", "").strip()
    from_name = os.getenv("EMAIL_FROM_NAME", "TrendCommerce AI").strip()

    if not smtp_user or not smtp_password:
        logger.warning("Credenciais de SMTP (SMTP_USER / SMTP_PASSWORD) não configuradas no .env.")
        return False, "Servidor de envio de e-mail não configurado no arquivo .env."

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🔐 {code} é o seu código de recuperação — TrendCommerce AI"
        msg["From"] = f"{from_name} <{smtp_user}>"
        msg["To"] = to_email
        msg["Date"] = formatdate(localtime=True)
        msg["Message-ID"] = make_msgid(domain=smtp_host)

        # Versão Texto Puro (para clientes de email legados)
        text_content = f"""
        TrendCommerce AI - Recuperação de Senha

        Seu código de verificação é: {code}

        Este código expira em 15 minutos.
        Se você não solicitou este código, por favor ignore este e-mail.
        """

        # Versão HTML Profissional (Design Dark/Cyan alinhado ao sistema)
        html_content = f"""
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    margin: 0;
                    padding: 0;
                    background-color: #040d1a;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                }}
                .container {{
                    max-width: 520px;
                    margin: 40px auto;
                    background: #07192e;
                    border: 1px solid #00b4d8;
                    border-radius: 16px;
                    padding: 40px 32px;
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 180, 216, 0.15);
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 28px;
                }}
                .logo-title {{
                    font-size: 26px;
                    font-weight: 800;
                    color: #ffffff;
                    letter-spacing: 0.5px;
                    margin: 0;
                }}
                .logo-accent {{
                    color: #00d4ff;
                }}
                .subtitle {{
                    font-size: 11px;
                    color: #64748b;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    margin-top: 6px;
                }}
                .card-body {{
                    background: #0a223f;
                    border: 1px solid rgba(0, 212, 255, 0.3);
                    border-radius: 12px;
                    padding: 28px 24px;
                    text-align: center;
                    margin: 24px 0;
                }}
                .instructions {{
                    color: #cbd5e1;
                    font-size: 14px;
                    line-height: 1.6;
                    margin: 0 0 16px 0;
                }}
                .otp-box {{
                    display: inline-block;
                    background: #041021;
                    border: 2px solid #00f0ff;
                    border-radius: 10px;
                    padding: 14px 28px;
                    font-size: 36px;
                    font-weight: 800;
                    letter-spacing: 10px;
                    color: #00f0ff;
                    margin: 12px 0;
                    box-shadow: 0 0 15px rgba(0, 240, 255, 0.35);
                }}
                .expiry {{
                    color: #38bdf8;
                    font-size: 12px;
                    font-weight: 600;
                    margin-top: 10px;
                }}
                .footer {{
                    text-align: center;
                    color: #64748b;
                    font-size: 12px;
                    line-height: 1.5;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                    padding-top: 20px;
                    margin-top: 24px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="logo-title"><span class="logo-accent">Trend</span>Commerce AI</h1>
                    <div class="subtitle">SISTEMA PREDITIVO DE VENDAS E DADOS</div>
                </div>

                <div class="card-body">
                    <p class="instructions">
                        Olá! Recebemos uma solicitação para redefinir a senha da sua conta.<br>
                        Utilize o código de segurança abaixo para prosseguir:
                    </p>

                    <div class="otp-box">{code}</div>

                    <div class="expiry">⏱️ Este código é válido por 15 minutos</div>
                </div>

                <div class="footer">
                    <p>Se você não solicitou a redefinição de senha, nenhuma ação é necessária. Sua conta permanece segura.</p>
                    <p>© 2026 TrendCommerce AI — Inteligência Preditiva de Mercado</p>
                </div>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        # Conectar via SSL (Porta 465) ou STARTTLS (Porta 587) com fallback automático
        if smtp_port == 465:
            import ssl
            ssl_context = ssl.create_default_context()
            with smtplib.SMTP_SSL(smtp_host, 465, context=ssl_context, timeout=12) as server:
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_user, [to_email], msg.as_string())
        else:
            try:
                with smtplib.SMTP(smtp_host, smtp_port, timeout=12) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(smtp_user, smtp_password)
                    server.sendmail(smtp_user, [to_email], msg.as_string())
            except Exception as tls_err:
                logger.warning(f"Tentando fallback para SSL Porta 465 após erro na {smtp_port}: {tls_err}")
                import ssl
                ssl_context = ssl.create_default_context()
                with smtplib.SMTP_SSL(smtp_host, 465, context=ssl_context, timeout=12) as server:
                    server.login(smtp_user, smtp_password)
                    server.sendmail(smtp_user, [to_email], msg.as_string())

        logger.info(f"E-mail com código OTP enviado com sucesso para: {to_email}")
        return True, "E-mail enviado com sucesso!"

    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"Erro de autenticação SMTP: {e}")
        return False, "Falha de autenticação no servidor de e-mail (usuário ou senha incorretos)."
    except Exception as e:
        logger.error(f"Erro ao enviar e-mail para {to_email}: {e}")
        return False, f"Erro no envio do e-mail: {str(e)}"
