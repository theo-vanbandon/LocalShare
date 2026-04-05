import threading
from pathlib import Path
from unittest.mock import patch

import pytest

import api


@pytest.fixture(autouse=True)
def reset_clipboard():
    """Remet le clipboard à zéro avant chaque test"""
    api.set_clipboard("")
    yield
    api.set_clipboard("")


@pytest.fixture()
def tmp_upload_dir(tmp_path, monkeypatch):
    """Redirige UPLOAD_DIR vers un dossier temporaire isolé"""
    monkeypatch.setattr(api, "_clipboard", {"text": ""})
    monkeypatch.setattr("api.UPLOAD_DIR", tmp_path)
    return tmp_path


# -- Clipboard ------------------------------------------------------------------

class TestClipboard:
    """Tests du presse-papier partagé"""

    def test_get_clipboard_vide_par_defaut(self):
        assert api.get_clipboard() == ""

    def test_set_et_get_clipboard(self):
        api.set_clipboard("bonjour")
        assert api.get_clipboard() == "bonjour"

    def test_set_clipboard_remplace_valeur(self):
        api.set_clipboard("premier")
        api.set_clipboard("second")
        assert api.get_clipboard() == "second"

    def test_set_clipboard_chaine_vide(self):
        api.set_clipboard("texte")
        api.set_clipboard("")
        assert api.get_clipboard() == ""

    def test_set_clipboard_caracteres_speciaux(self):
        texte = "héllo wörld 🎉\nnewline\ttab"
        api.set_clipboard(texte)
        assert api.get_clipboard() == texte

    def test_clipboard_thread_safe(self):
        """Vérifie qu'aucune race condition ne survient avec 50 threads simultanés"""
        errors = []

        def worker(i):
            try:
                api.set_clipboard(f"thread-{i}")
                _ = api.get_clipboard()
            except Exception as e:  # pragma: no cover
                errors.append(e)

        threads = [threading.Thread(target=worker, args=(i,)) for i in range(50)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert errors == []


# -- Fichiers ------------------------------------------------------------------

class TestListFiles:
    """Tests du listing de fichiers"""

    def test_dossier_vide(self, tmp_upload_dir):
        assert api.list_files() == []

    def test_un_fichier(self, tmp_upload_dir):
        (tmp_upload_dir / "test.txt").write_bytes(b"hello")
        files = api.list_files()
        assert len(files) == 1
        assert files[0]["name"] == "test.txt"
        assert "size" in files[0]

    def test_plusieurs_fichiers_tries(self, tmp_upload_dir):
        (tmp_upload_dir / "b.txt").write_bytes(b"b")
        (tmp_upload_dir / "a.txt").write_bytes(b"a")
        names = [f["name"] for f in api.list_files()]
        assert names == ["a.txt", "b.txt"]

    def test_ignore_les_dossiers(self, tmp_upload_dir):
        (tmp_upload_dir / "sous_dossier").mkdir()
        (tmp_upload_dir / "fichier.txt").write_bytes(b"x")
        files = api.list_files()
        assert len(files) == 1
        assert files[0]["name"] == "fichier.txt"

    def test_taille_formatee(self, tmp_upload_dir):
        (tmp_upload_dir / "fichier.txt").write_bytes(b"x" * 1024)
        files = api.list_files()
        assert files[0]["size"] == "1.0 Ko"


class TestSaveFile:
    """Tests de la sauvegarde de fichiers"""

    def test_sauvegarde_simple(self, tmp_upload_dir):
        dest = api.save_file("test.txt", b"contenu")
        assert dest.exists()
        assert dest.read_bytes() == b"contenu"

    def test_renommage_si_doublon(self, tmp_upload_dir):
        api.save_file("test.txt", b"v1")
        dest2 = api.save_file("test.txt", b"v2")
        assert dest2.name == "test_1.txt"
        assert dest2.read_bytes() == b"v2"

    def test_renommage_multiple(self, tmp_upload_dir):
        api.save_file("test.txt", b"v1")
        api.save_file("test.txt", b"v2")
        dest3 = api.save_file("test.txt", b"v3")
        assert dest3.name == "test_2.txt"

    def test_fichier_sans_extension(self, tmp_upload_dir):
        dest = api.save_file("Makefile", b"contenu")
        assert dest.name == "Makefile"

    def test_doublon_sans_extension(self, tmp_upload_dir):
        api.save_file("Makefile", b"v1")
        dest2 = api.save_file("Makefile", b"v2")
        assert dest2.name == "Makefile_1"

    def test_sanitize_nom_avec_chemin(self, tmp_upload_dir):
        """Un nom de fichier avec des séparateurs de chemin ne doit pas échapper au dossier"""
        dest = api.save_file("../../evil.txt", b"hack")
        assert dest.parent == tmp_upload_dir


class TestDeleteFile:
    """Tests de la suppression de fichiers"""

    def test_suppression_existant(self, tmp_upload_dir):
        (tmp_upload_dir / "a.txt").write_bytes(b"x")
        assert api.delete_file("a.txt") is True
        assert not (tmp_upload_dir / "a.txt").exists()

    def test_suppression_inexistant(self, tmp_upload_dir):
        assert api.delete_file("nope.txt") is False

    def test_suppression_dossier_refuse(self, tmp_upload_dir):
        (tmp_upload_dir / "sous_dossier").mkdir()
        assert api.delete_file("sous_dossier") is False


class TestGetFilePath:
    """Tests de la récupération du chemin d'un fichier"""

    def test_fichier_existant(self, tmp_upload_dir):
        (tmp_upload_dir / "img.png").write_bytes(b"data")
        result = api.get_file_path("img.png")
        assert result is not None
        assert result.name == "img.png"

    def test_fichier_inexistant(self, tmp_upload_dir):
        assert api.get_file_path("ghost.png") is None

    def test_dossier_refuse(self, tmp_upload_dir):
        (tmp_upload_dir / "sous_dossier").mkdir()
        assert api.get_file_path("sous_dossier") is None
