# Tests - LocalShare

Le projet dispose de deux suites de tests indépendantes : une pour le code Python, une pour le code JavaScript.

---

## Tests Python

### Installation des dépendances

```bash
pip install -r requirements-dev.txt
```

### Lancer les tests

#### Tous les tests
```bash
python -m pytest --cov --cov-report=term-missing
```

#### Un fichier spécifique
```bash
python -m pytest tests/test_api.py
python -m pytest tests/test_utils.py
python -m pytest tests/test_handler.py
```

#### Un test spécifique
```bash
python -m pytest tests/test_api.py::TestClipboard::test_clipboard_thread_safe
```

### Résultats

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

### Structure des tests Python

```
tests/
├── __init__.py
├── test_utils.py      # format_size, get_local_ip
├── test_api.py        # clipboard, list_files, save_file, delete_file, get_file_path
└── test_handler.py    # routes HTTP (serveur réel sur port dynamique)
```

### Ce qui est testé

#### `test_utils.py`
| Test | Description |
|------|-------------|
| `TestFormatSize` | Conversion octets -> Ko / Mo / Go / To, zéro, décimales |
| `TestGetLocalIp` | Format IPv4 valide, fallback sur `127.0.0.1` si réseau indisponible |

#### `test_api.py`
| Test | Description |
|------|-------------|
| `TestClipboard` | Get/set, remplacement, chaîne vide, caractères spéciaux, thread safety |
| `TestListFiles` | Dossier vide, tri alphabétique, exclusion des dossiers, taille formatée |
| `TestSaveFile` | Sauvegarde, renommage sur doublon, fichier sans extension, sanitize chemin |
| `TestDeleteFile` | Suppression existant/inexistant, refus de supprimer un dossier |
| `TestGetFilePath` | Fichier existant, inexistant, dossier refusé |

#### `test_handler.py`
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

---

## Tests JavaScript

### Installation des dépendances

```bash
npm install
```

### Lancer les tests

#### Tous les tests avec couverture
```bash
npm run test:coverage
```

#### Tous les tests sans couverture
```bash
npm test
```

#### Mode watch (relance automatiquement à chaque modification)
```bash
npm run test:watch
```

### Résultats

```
✓ tests/js/api.test.js (11)
✓ tests/js/clipboard.test.js (14)
✓ tests/js/files.test.js (11)
✓ tests/js/ui.test.js (22)
✓ tests/js/upload.test.js (9)

Test Files  5 passed (5)
     Tests  67 passed (67)
Duration  3.11s 

% Coverage report from v8
--------------|---------|----------|---------|---------|-------------------
File          | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
--------------|---------|----------|---------|---------|-------------------
All files     |     100 |      100 |     100 |     100 |                   
 api.js       |     100 |      100 |     100 |     100 |                  
 clipboard.js |     100 |      100 |     100 |     100 |                  
 files.js     |     100 |      100 |     100 |     100 |                  
 ui.js        |     100 |      100 |     100 |     100 |                  
 upload.js    |     100 |      100 |     100 |     100 |                  
--------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 100% ( 352/352 )
Branches     : 100% ( 63/63 )
Functions    : 100% ( 18/18 )
Lines        : 100% ( 352/352 )
================================================================================
```

### Structure des tests JavaScript

```
tests/js/
├── api.test.js        # fetchInfo, fetchFiles, fetchClipboard, postClipboard, deleteFile, uploadFile
├── ui.test.js         # esc, fileIcon, toast
├── upload.test.js     # initUpload, dropzone, barre de progression
├── files.test.js      # loadFiles, rendu DOM, suppression
└── clipboard.test.js  # syncClip, initClipboard, copyClip, saveClip, clearClip
```

### Ce qui est testé

#### `api.test.js`
| Test | Description |
|------|-------------|
| `fetchInfo` | Appel vers `/api/info`, retour des champs ip/port/dir |
| `fetchFiles` | Liste de fichiers, liste vide |
| `fetchClipboard` | Texte présent, texte vide |
| `postClipboard` | Body JSON correct, chaîne vide |
| `deleteFile` | URL encodée, caractères spéciaux |
| `uploadFile` | Envoi XHR, callback onProgress, erreur réseau |

#### `ui.test.js`
| Test | Description |
|------|-------------|
| `esc` | Esperluette, chevrons, guillemets, combinaisons, valeurs non-string |
| `fileIcon` | Extensions connues (image/vidéo/audio/archive/doc/texte), inconnues, sans extension, casse |
| `toast` | Message, couleur par défaut, couleur custom, classe show, retrait après 2500ms |

#### `upload.test.js`
| Test | Description |
|------|-------------|
| `initUpload` | Click dropzone, drag/dragleave/drop, barre de progression, onProgress, liste vide |

#### `files.test.js`
| Test | Description |
|------|-------------|
| `loadFiles` | Liste vide, affichage nom/taille, emoji, badge texte, plusieurs fichiers, XSS, lien téléchargement, bouton suppression, confirmation/annulation |

#### `clipboard.test.js`
| Test | Description |
|------|-------------|
| `syncClip` | Mise à jour textarea, anti-écrasement pendant frappe, timeout 2s, statut horodaté, erreur réseau |
| `initClipboard` | Boutons Envoyer/Copier/Vider, fallback execCommand (HTTP), navigator.clipboard (HTTPS) |
