import socket


def get_local_ip() -> str:
    """Retourne l'adresse IP locale sur le réseau (ex: 192.168.x.x)"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def format_size(size: int) -> str:
    """Convertit un nombre d'octets en chaîne lisible (Ko, Mo, Go...)"""
    for unit in ["o", "Ko", "Mo", "Go"]:
        if size < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} To"
