# Tests - LocalShare

## Installation des dépendances

```bash
pip install -r requirements-dev.txt
```

---

## Lancer les tests

### Tous les tests
```bash
python -m pytest --cov --cov-report=term-missing
```

### Un fichier spécifique
```bash
python -m pytest tests/test_api.py
python -m pytest tests/test_utils.py
python -m pytest tests/test_handler.py
```

### Un test spécifique
```bash
python -m pytest tests/test_api.py::TestClipboard::test_clipboard_thread_safe
```

---

## Résultats

```
Name                    Stmts   Miss  Cover   Missing
-----------------------------------------------------
api.py                     38      0   100%
config.py                   5      0   100%
handler.py                121      0   100%
tests\__init__.py           0      0   100%
tests\test_api.py         117      0   100%
tests\test_handler.py     182      0   100%
tests\test_utils.py        35      0   100%
utils.py                   16      0   100%
-----------------------------------------------------
TOTAL                     514      0   100%
```

---

## Structure des tests

```
tests/
├── __init__.py
├── test_utils.py      # format_size, get_local_ip
├── test_api.py        # clipboard, list_files, save_file, delete_file, get_file_path
└── test_handler.py    # routes HTTP (serveur réel sur port dynamique)
```

---

## Ce qui est testé

### `test_utils.py`
| Test | Description |
|------|-------------|
| `TestFormatSize` | Conversion octets → Ko / Mo / Go / To, zéro, décimales |
| `TestGetLocalIp` | Format IPv4 valide, fallback sur `127.0.0.1` si réseau indisponible |

### `test_api.py`
| Test | Description |
|------|-------------|
| `TestClipboard` | Get/set, remplacement, chaîne vide, caractères spéciaux, thread safety |
| `TestListFiles` | Dossier vide, tri alphabétique, exclusion des dossiers, taille formatée |
| `TestSaveFile` | Sauvegarde, renommage sur doublon, fichier sans extension, sanitize chemin |
| `TestDeleteFile` | Suppression existant/inexistant, refus de supprimer un dossier |
| `TestGetFilePath` | Fichier existant, inexistant, dossier refusé |

### `test_handler.py`
| Test | Description |
|------|-------------|
| `TestStaticRoutes` | `/`, `/index.html`, `/static/style.css`, `/static/app.js`, 404 |
| `TestApiInfo` | Présence des champs `ip`, `port`, `dir` - port correct |
| `TestApiFiles` | Liste vide, liste après ajout, download, download 404, delete, delete 404 |
| `TestApiClipboard` | Get vide, set + get, reset, caractères spéciaux |
| `TestRoutesInconnues` | POST et DELETE sur routes non définies |
| `TestUpload` | Upload simple, upload sans boundary |
| `TestClipboardInvalide` | POST avec JSON invalide |
| `TestUploadCasLimites` | Part sans séparateur header, filename vide |
