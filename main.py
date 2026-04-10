from http.server import HTTPServer

from config import PORT
from handler import LocalShareHandler
from utils import get_local_ip


def print_banner(local_ip: str) -> None:
    """Affiche les informations de connexion au démarrage du serveur"""
    pad = " " * max(0, 15 - len(local_ip))
    print()
    print("  ╔══════════════════════════════════════════╗")
    print("  ║           📡  LocalShare                 ║")
    print("  ╠══════════════════════════════════════════╣")
    print(f"  ║  PC  → http://localhost:{PORT}             ║")
    print(f"  ║  Tel → http://{local_ip}:{PORT}{pad}       ║")
    print("  ║  Dossier : ...LocalShare\\files           ║")
    print("  ╚══════════════════════════════════════════╝")
    print()
    print("  Ctrl+C pour arrêter\n")


def main() -> None:
    """Point d'entrée - récupère l'IP locale, affiche le banner et démarre le serveur"""
    local_ip = get_local_ip()
    print_banner(local_ip)

    server = HTTPServer(("0.0.0.0", PORT), LocalShareHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Serveur arrêté.")


if __name__ == "__main__":
    main()
