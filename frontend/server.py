#!/usr/bin/env python3
"""
TrendEcommerce AI - Frontend Local Server
Executa um servidor HTTP local para testar a interface de autenticação.
"""

import http.server
import socketserver
import os
import sys
import webbrowser

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        print(f"[TrendEcommerce Server] {self.address_string()} - {format % args}")

def run_server():
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print("=" * 60)
        print("🚀 TrendEcommerce AI - Frontend Server Iniciado")
        print(f"📡 Acesse: {url}")
        print("=" * 60)
        print("Pressione Ctrl+C para encerrar o servidor.\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Servidor encerrado.")

if __name__ == "__main__":
    run_server()
