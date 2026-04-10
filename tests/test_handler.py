import json
import threading
import urllib.request
import urllib.error
from http.server import HTTPServer
from unittest.mock import patch

import pytest

import api
from handler import LocalShareHandler


# -- Serveur de test -----------------------------------------------------------

@pytest.fixture(scope="module")
def server(tmp_path_factory):
    """
    Lance un vrai serveur HTTP sur un port libre pour toute la durée du module.
    Redirige UPLOAD_DIR vers un dossier temporaire.
    """
    upload_dir = tmp_path_factory.mktemp("uploads")

    with patch("api.UPLOAD_DIR", upload_dir), \
         patch("handler.UPLOAD_DIR", upload_dir):

        httpd = HTTPServer(("127.0.0.1", 0), LocalShareHandler)
        port = httpd.server_address[1]

        thread = threading.Thread(target=httpd.serve_forever)
        thread.daemon = True
        thread.start()

        yield {"port": port, "upload_dir": upload_dir}

        httpd.shutdown()


def get(server, path):
    """Effectue une requête GET et retourne (status, body)"""
    url = f"http://127.0.0.1:{server['port']}{path}"
    try:
        with urllib.request.urlopen(url) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b""


def post_json(server, path, data):
    """Effectue une requête POST avec un body JSON"""
    url = f"http://127.0.0.1:{server['port']}{path}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read()
        return e.code, json.loads(body) if body else {}


def delete(server, path):
    """Effectue une requête DELETE"""
    url = f"http://127.0.0.1:{server['port']}{path}"
    req = urllib.request.Request(url, method="DELETE")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read()
        return e.code, json.loads(body) if body else {}


# -- Routes statiques -----------------------------------------------------------

class TestStaticRoutes:
    """Tests des routes servant les fichiers statiques"""

    def test_index_html(self, server):
        status, body = get(server, "/")
        assert status == 200
        assert b"LocalShare" in body

    def test_index_html_alias(self, server):
        status, _ = get(server, "/index.html")
        assert status == 200

    def test_style_css(self, server):
        status, body = get(server, "/static/style.css")
        assert status == 200
        assert b"body" in body

    def test_app_js(self, server):
        status, body = get(server, "/static/app.js")
        assert status == 200
        assert b"function" in body

    def test_fichier_statique_inexistant(self, server):
        status, _ = get(server, "/static/inexistant.xyz")
        assert status == 404

    def test_route_inconnue(self, server):
        status, _ = get(server, "/route/qui/nexiste/pas")
        assert status == 404


# -- API info -----------------------------------------------------------

class TestApiInfo:
    """Tests de la route /api/info"""

    def test_retourne_ip_port_dir(self, server):
        status, body = get(server, "/api/info")
        data = json.loads(body)
        assert status == 200
        assert "ip" in data
        assert "port" in data
        assert "dir" in data

    def test_port_correct(self, server):
        with patch("config.PORT", server["port"]):
            _, body = get(server, "/api/info")
        data = json.loads(body)
        assert data["port"] == server["port"]


# -- API fichiers -----------------------------------------------------------

class TestApiFiles:
    """Tests des routes de gestion des fichiers"""

    def test_liste_vide(self, server):
        status, body = get(server, "/api/files")
        assert status == 200
        assert json.loads(body) == []

    def test_liste_apres_upload(self, server):
        (server["upload_dir"] / "test.txt").write_bytes(b"hello")
        _, body = get(server, "/api/files")
        files = json.loads(body)
        names = [f["name"] for f in files]
        assert "test.txt" in names

    def test_download_existant(self, server):
        (server["upload_dir"] / "dl.txt").write_bytes(b"contenu")
        status, body = get(server, "/download/dl.txt")
        assert status == 200
        assert body == b"contenu"

    def test_download_inexistant(self, server):
        status, _ = get(server, "/download/ghost.txt")
        assert status == 404

    def test_delete_existant(self, server):
        (server["upload_dir"] / "a_supprimer.txt").write_bytes(b"x")
        status, data = delete(server, "/api/delete/a_supprimer.txt")
        assert status == 200
        assert data["ok"] is True

    def test_delete_inexistant(self, server):
        status, data = delete(server, "/api/delete/ghost.txt")
        assert status == 404
        assert data["ok"] is False


# -- API clipboard -----------------------------------------------------------

class TestApiClipboard:
    """Tests des routes du presse-papier partagé"""

    def setup_method(self):
        api.set_clipboard("")

    def test_get_clipboard_vide(self, server):
        status, body = get(server, "/api/clipboard")
        assert status == 200
        assert json.loads(body) == {"text": ""}

    def test_set_et_get_clipboard(self, server):
        post_json(server, "/api/clipboard", {"text": "bonjour"})
        _, body = get(server, "/api/clipboard")
        assert json.loads(body)["text"] == "bonjour"

    def test_set_clipboard_vide(self, server):
        post_json(server, "/api/clipboard", {"text": "quelque chose"})
        post_json(server, "/api/clipboard", {"text": ""})
        _, body = get(server, "/api/clipboard")
        assert json.loads(body)["text"] == ""

    def test_set_clipboard_caracteres_speciaux(self, server):
        texte = "héllo 🎉\nnewline"
        post_json(server, "/api/clipboard", {"text": texte})
        _, body = get(server, "/api/clipboard")
        assert json.loads(body)["text"] == texte

# -- Routes inconnues -----------------------------------------------------------

class TestRoutesInconnues:
    """Tests des routes non définies"""

    def test_post_route_inconnue(self, server):
        status, _ = post_json(server, "/api/route_inconnue", {"x": 1})
        assert status == 404

    def test_delete_route_inconnue(self, server):
        status, _ = delete(server, "/api/route_inconnue")
        assert status == 404


# -- Upload -----------------------------------------------------------

class TestUpload:
    """Tests de la route d'upload multipart"""

    def _make_multipart(self, filename: str, content: bytes):
        """Construit un body multipart/form-data minimal"""
        boundary = b"testboundary123"
        body = (
            b"--" + boundary + b"\r\n"
            b'Content-Disposition: form-data; name="file"; filename="' + filename.encode() + b'"\r\n'
            b"Content-Type: application/octet-stream\r\n\r\n"
            + content +
            b"\r\n--" + boundary + b"--\r\n"
        )
        return body, "multipart/form-data; boundary=testboundary123"

    def test_upload_simple(self, server):
        body, content_type = self._make_multipart("upload_test.txt", b"contenu test")
        url = f"http://127.0.0.1:{server['port']}/api/upload"
        req = urllib.request.Request(url, data=body,
                                     headers={"Content-Type": content_type})
        with urllib.request.urlopen(req) as r:
            data = json.loads(r.read())
        assert data["ok"] is True
        assert (server["upload_dir"] / "upload_test.txt").exists()

    def test_upload_sans_boundary(self, server):
        url = f"http://127.0.0.1:{server['port']}/api/upload"
        req = urllib.request.Request(url, data=b"data",
                                     headers={"Content-Type": "multipart/form-data"})
        try:
            urllib.request.urlopen(req)
        except urllib.error.HTTPError as e:
            assert e.code == 400


# -- Clipboard JSON invalide -----------------------------------------------------------

class TestClipboardInvalide:
    """Tests d'erreur sur le presse-papier"""

    def test_post_clipboard_json_invalide(self, server):
        url = f"http://127.0.0.1:{server['port']}/api/clipboard"
        req = urllib.request.Request(url, data=b"ceci_nest_pas_du_json",
                                     headers={"Content-Type": "application/json"})
        try:
            urllib.request.urlopen(req)
        except urllib.error.HTTPError as e:
            assert e.code == 400


# -- Upload cas limites -----------------------------------------------------------

class TestUploadCasLimites:
    """Tests des branches défensives du parsing multipart"""

    def _upload_raw(self, server, body: bytes, boundary: str):
        url = f"http://127.0.0.1:{server['port']}/api/upload"
        req = urllib.request.Request(
            url, data=body,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
        )
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())

    def test_part_sans_separateur_header(self, server):
        """Part avec filename= mais sans \\r\\n\\r\\n → ligne 161 (continue)"""
        boundary = "boundary161"
        body = (
            b"--boundary161\r\n"
            b'Content-Disposition: form-data; name="file"; filename="test.txt"'
            # pas de \r\n\r\n volontairement
            b"\r\n--boundary161--\r\n"
        )
        data = self._upload_raw(server, body, boundary)
        assert data["ok"] is True

    def test_part_avec_filename_vide(self, server):
        """Part avec filename="" → ligne 168 (continue)"""
        boundary = "boundary168"
        body = (
            b"--boundary168\r\n"
            b'Content-Disposition: form-data; name="file"; filename=""\r\n'
            b"Content-Type: application/octet-stream\r\n\r\n"
            b"contenu\r\n"
            b"--boundary168--\r\n"
        )
        data = self._upload_raw(server, body, boundary)
        assert data["ok"] is True
