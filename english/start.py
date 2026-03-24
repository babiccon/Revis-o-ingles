"""
Launcher - English Study Tool
Uso:
    python start.py cli     → Abre a ferramenta no terminal
    python start.py web     → Abre servidor local + navegador
    python start.py         → Menu de escolha
"""

import sys
import os

ENGLISH_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(ENGLISH_DIR)  # raiz do projeto


def start_cli():
    """Inicia a ferramenta CLI no terminal."""
    sys.path.insert(0, ENGLISH_DIR)
    from cli.main import main
    main()


def start_web():
    """Inicia um servidor HTTP local e abre o navegador."""
    import http.server
    import threading
    import webbrowser
    import functools

    port = 8080

    # Servir a partir da raiz do projeto (onde está o index.html principal)
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT_DIR)

    # Tentar portas até encontrar uma livre
    for attempt_port in range(port, port + 10):
        try:
            server = http.server.HTTPServer(("localhost", attempt_port), handler)
            port = attempt_port
            break
        except OSError:
            continue
    else:
        print(f"  Erro: Não foi possível encontrar uma porta livre entre {port} e {port + 9}.")
        return

    url = f"http://localhost:{port}/"

    print(f"\n  Servidor iniciado em: {url}")
    print(f"  Pressione Ctrl+C para parar.\n")

    # Abrir navegador em uma thread separada (com pequeno atraso)
    def open_browser():
        import time
        time.sleep(0.5)
        webbrowser.open(url)

    threading.Thread(target=open_browser, daemon=True).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Servidor parado.")
        server.shutdown()


def main():
    """Ponto de entrada principal."""
    if len(sys.argv) > 1:
        mode = sys.argv[1].lower()
        if mode == "cli":
            start_cli()
        elif mode == "web":
            start_web()
        else:
            print(f"  Modo desconhecido: '{mode}'")
            print("  Use: python start.py [cli|web]")
    else:
        print()
        print("  ╔════════════════════════════════════════════════════════╗")
        print("  ║        LinguaStudy — Alemão A1 + Inglês A2             ║")
        print("  ╚════════════════════════════════════════════════════════╝")
        print()
        print("  Como deseja estudar?")
        print()
        print("  [1] Terminal (CLI)")
        print("  [2] Navegador (Web)")
        print("  [0] Sair")
        print()

        choice = input("  Opção: ").strip()

        if choice == "1":
            start_cli()
        elif choice == "2":
            start_web()
        elif choice == "0":
            print("  Até logo!")
        else:
            print("  Opção inválida.")


if __name__ == "__main__":
    main()
