import json
import mimetypes
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, unquote

import api
from config import STATIC_DIR, UPLOAD_DIR
from utils import format_size, get_local_ip

from pathlib import Path
from config import PORT

# Types MIME explicites pour les fichiers statiques
STATIC_MIME = {
    ".html": "text/html; charset=utf-8",
    ".css":  "text/css; charset=utf-8",
    ".js":   "application/javascript; charset=utf-8",
}


class LocalShareHandler(BaseHTTPRequestHandler):

    # -- Logging ----------------------------------------------------------------

    def log_message(self, fmt, *args):
        """Affiche chaque requête avec l'IP source dans le terminal"""
        print(f"  [{self.client_address[0]}] {fmt % args}")

    # -- Helpers ----------------------------------------------------------------

    def send_json(self, data: dict, status: int = 200) -> None:
        """Sérialise data en JSON et envoie la réponse avec le bon Content-Type"""
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def not_found(self) -> None:
        """Envoie une réponse 404 vide"""
        self.send_response(404)
        self.end_headers()

    def read_body(self) -> bytes:
        """Lit et retourne le corps de la requête en entier"""
        length = int(self.headers.get("Content-Length", 0))
        return self.rfile.read(length)

    # -- Routing ----------------------------------------------------------------

    def do_GET(self):
        """Dispatch les requêtes GET vers le bon handler"""
        path = urlparse(self.path).path

        match path:
            case "/" | "/index.html":
                self._serve_static("index.html")
            case "/favicon.ico":
                self._serve_favicon()
            case "/api/info":
                self._route_info()
            case "/api/files":
                self.send_json(api.list_files())
            case "/api/clipboard":
                self.send_json({"text": api.get_clipboard()})
            case _ if path.startswith("/static/"):
                self._serve_static(path[len("/static/"):])
            case _ if path.startswith("/download/"):
                self._route_download(unquote(path[len("/download/"):]))
            case _:
                self.not_found()

    def do_POST(self):
        """Dispatch les requêtes POST vers le bon handler"""
        path = urlparse(self.path).path

        match path:
            case "/api/clipboard":
                self._route_clipboard_set()
            case "/api/upload":
                self._route_upload()
            case _:
                self.not_found()

    def do_DELETE(self):
        """Dispatch les requêtes DELETE vers le bon handler"""
        path = urlparse(self.path).path

        if path.startswith("/api/delete/"):
            name = unquote(path[len("/api/delete/"):])
            if api.delete_file(name):
                self.send_json({"ok": True})
            else:
                self.send_json({"ok": False}, 404)
        else:
            self.not_found()

    # -- Handlers ----------------------------------------------------------------

    def _serve_static(self, filename: str) -> None:
        """Sert un fichier depuis le dossier static/ avec le bon Content-Type"""
        filepath = STATIC_DIR / filename
        if not filepath.exists() or not filepath.is_file():
            self.not_found()
            return
        suffix = filepath.suffix.lower()
        content_type = STATIC_MIME.get(suffix, "application/octet-stream")
        body = filepath.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def _serve_favicon(self) -> None:
        """Sert l'icône de l'application depuis la racine du projet"""
        filepath = Path(__file__).parent / "LocalShare-icon.ico"
        if not filepath.exists():
            self.not_found()
            return
        body = filepath.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "image/x-icon")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def _route_info(self) -> None:
        """Retourne l'IP locale, le port et le dossier de stockage"""
        self.send_json({
            "ip":   get_local_ip(),
            "port": PORT,
            "dir":  str(UPLOAD_DIR),
        })

    def _route_download(self, filename: str) -> None:
        """Envoie le fichier demandé en pièce jointe pour le téléchargement"""
        filepath = api.get_file_path(filename)
        if filepath is None:
            self.not_found()
            return
        mime, _ = mimetypes.guess_type(str(filepath))
        mime = mime or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", filepath.stat().st_size)
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.end_headers()
        with open(filepath, "rb") as f:
            while chunk := f.read(65536):
                self.wfile.write(chunk)

    def _route_clipboard_set(self) -> None:
        """Met à jour le presse-papier partagé avec le texte reçu en JSON"""
        try:
            data = json.loads(self.read_body())
            api.set_clipboard(data.get("text", ""))
            self.send_json({"ok": True})
        except Exception as e:
            self.send_json({"error": str(e)}, 400)

    def _route_upload(self) -> None:
        """Parse le multipart/form-data reçu et sauvegarde chaque fichier"""
        content_type = self.headers.get("Content-Type", "")
        if "boundary=" not in content_type:
            self.send_json({"error": "Content-Type invalide"}, 400)
            return

        boundary = content_type.split("boundary=")[1].strip().encode()
        body = self.read_body()

        for part in body.split(b"--" + boundary):
            if b'filename="' not in part:
                continue
            header_end = part.find(b"\r\n\r\n")
            if header_end == -1:
                continue

            header      = part[:header_end].decode(errors="ignore")
            fname_start = header.find('filename="') + len('filename="')
            fname_end   = header.find('"', fname_start)
            filename    = header[fname_start:fname_end]
            if not filename:
                continue

            file_data = part[header_end + 4:]
            if file_data.endswith(b"\r\n"):
                file_data = file_data[:-2]

            dest = api.save_file(filename, file_data)
            print(f" 📁 Reçu : {dest.name} ({format_size(len(file_data))})")

        self.send_json({"ok": True})
