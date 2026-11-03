@echo off
chcp 65001 >nul
title TrendCommerce AI - Inicializador do Sistema

echo =====================================================================
echo           TRENDCOMMERCE AI - SISTEMA PREDITIVO COM XGBOOST
echo =====================================================================
echo.

:: 1. Verificar se a API de Historico de Vendas está rodando na porta 8000
netstat -ano | findstr :8000 >nul
if %errorlevel% neq 0 (
    echo [!] A API de Historico de Vendas (porta 8000) nao foi detectada.
    if exist "C:\Users\Aluno\Desktop\API_Historico_Vendas\api_vendas.exe" (
        echo [*] Iniciando api_vendas.exe em segundo plano...
        start "" "C:\Users\Aluno\Desktop\API_Historico_Vendas\api_vendas.exe"
        timeout /t 3 /nobreak >nul
    ) else (
        echo [!] Atencao: Certifique-se de iniciar a API de Vendas na porta 8000.
    )
) else (
    echo [OK] API de Historico de Vendas detectada ativa na porta 8000.
)

:: 2. Abrir o navegador no Frontend
echo [*] Abrindo interface Web no navegador: http://localhost:8001/app
start http://localhost:8001/app/#/ia-preditiva

:: 3. Iniciar o Backend FastAPI na porta 8001
echo.
echo =====================================================================
echo [*] Iniciando Servidor Backend FastAPI na porta 8001...
echo     URL da API:      http://localhost:8001/docs
echo     URL do Frontend: http://localhost:8001/app
echo =====================================================================
echo.

if exist ".\.venv\Scripts\activate.bat" (
    call .\.venv\Scripts\activate.bat
    python -m uvicorn src.api.main:app --host 127.0.0.1 --port 8001 --reload
) else (
    python -m uvicorn src.api.main:app --host 127.0.0.1 --port 8001 --reload
)

pause
