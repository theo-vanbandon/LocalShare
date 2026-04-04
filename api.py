import threading
from pathlib import Path

from config import UPLOAD_DIR
from utils import format_size


# ── Clipboard ──────────────────────────────────────────────────────────────────
_clipboard_lock = threading.Lock()
_clipboard = {"text": ""}


def get_clipboard() -> str:
    """Retourne le contenu actuel du presse-papier partagé"""
    with _clipboard_lock:
        return _clipboard["text"]


def set_clipboard(text: str) -> None:
    """Remplace le contenu du presse-papier partagé par le texte fourni"""
    with _clipboard_lock:
        _clipboard["text"] = text


# ── Fichiers ───────────────────────────────────────────────────────────────────
def list_files() -> list[dict]:
    """Retourne la liste des fichiers disponibles avec leur taille formatée"""
    files = []
    for f in sorted(UPLOAD_DIR.iterdir()):
        if f.is_file():
            files.append({"name": f.name, "size": format_size(f.stat().st_size)})
    return files


def save_file(filename: str, data: bytes) -> Path:
    """
    Sauvegarde les données dans UPLOAD_DIR
    Renomme automatiquement si le fichier existe déjà (ex: fichier_1.txt)
    """
    safe_name = Path(filename).name
    dest = UPLOAD_DIR / safe_name
    counter = 1
    while dest.exists():
        stem = safe_name.rsplit(".", 1)[0] if "." in safe_name else safe_name
        ext  = ("." + safe_name.rsplit(".", 1)[1]) if "." in safe_name else ""
        dest = UPLOAD_DIR / f"{stem}_{counter}{ext}"
        counter += 1
    dest.write_bytes(data)
    return dest


def delete_file(filename: str) -> bool:
    """Supprime un fichier. Retourne True si supprimé, False s'il n'existe pas"""
    filepath = UPLOAD_DIR / Path(filename).name
    if filepath.exists() and filepath.is_file():
        filepath.unlink()
        return True
    return False


def get_file_path(filename: str) -> Path | None:
    """Retourne le Path du fichier s'il existe, sinon None"""
    filepath = UPLOAD_DIR / Path(filename).name
    return filepath if filepath.exists() and filepath.is_file() else None
