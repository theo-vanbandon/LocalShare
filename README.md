# 📡 LocalShare

Outil léger de transfert de fichiers et de texte entre appareils sur un réseau Wi-Fi local.  
Aucune installation sur le téléphone, aucune connexion internet - tout passe en local via un navigateur.

---

## Fonctionnalités

- **Envoyer** - envoie un ou plusieurs fichiers depuis n'importe quel appareil vers le dossier de stockage
- **Recevoir** - liste les fichiers disponibles et permet de les télécharger sur n'importe quel appareil
- **Presse-papier partagé** - synchronise du texte entre les appareils toutes les 3 secondes
- Renommage automatique en cas de doublon (`fichier_1.txt`, `fichier_2.txt`...)
- Affichage du dossier de stockage en temps réel dans l'interface

---

## Prérequis

- Python 3.10+ (aucune dépendance externe)
- PC et téléphone connectés au **même réseau Wi-Fi**

---

## Installation

1. Clone ou télécharge le projet
2. Copie `config.py.example` en `config.py` :
```bash
cp config.py.example config.py
```
3. Ouvre `config.py` et ajuste les paramètres selon ta machine :
```python
PORT = 5000
UPLOAD_DIR = Path(r"C:\chemin\vers\ton\dossier\files")
```
4. Le dossier `files/` est créé automatiquement au premier lancement

---

## Lancement

```bash
python main.py
```

Le terminal affiche l'adresse à ouvrir sur le téléphone :

```
╔══════════════════════════════════════════╗
║           📡  LocalShare                 ║
╠══════════════════════════════════════════╣
║  PC  → http://localhost:5000             ║
║  Tel → http://192.168.x.x:5000           ║
║  Dossier : ...LocalShare\files           ║
╚══════════════════════════════════════════╝
```

Des scripts de lancement sont aussi disponibles selon ton OS — ils vérifient que Python est installé et ouvrent le navigateur automatiquement :

| OS | Script | Commande |
|----|--------|----------|
| Windows | `LocalShare.bat` | Double-clic |
| Linux / macOS | `LocalShare.sh` | `chmod +x LocalShare.sh && ./LocalShare.sh` |

> **Linux/macOS** : le `chmod +x` n'est nécessaire qu'une seule fois pour rendre le script exécutable.

---

## Structure du projet

```
LocalShare/
├── main.py              # Point d'entrée - lance le serveur HTTP
├── config.py            # Configuration personnelle (ignoré par Git)
├── config.py.example    # Template de configuration à copier
├── api.py               # Logique métier : gestion des fichiers et du clipboard
├── handler.py           # Routing HTTP - dispatch les requêtes vers api.py
├── utils.py             # Fonctions utilitaires (IP locale, formatage taille)
├── LocalShare-icon.ico  # Icône de l'application
├── LocalShare.bat       # Lanceur Windows
├── LocalShare.sh        # Lanceur Linux/macOS
├── files/               # Dossier de stockage des fichiers transférés (ignoré par Git)
└── static/
    ├── index.html       # Structure HTML de l'interface
    ├── style.css        # Styles de l'interface
    └── app.js           # Logique front-end (upload, clipboard, rafraîchissement)
```

---

## Configuration

Tout se passe dans `config.py` (copié depuis `config.py.example`) :

| Variable     | Description                                     | Défaut                             |
|--------------|-------------------------------------------------|------------------------------------|
| `PORT`       | Port d'écoute du serveur                        | `5000`                             |
| `UPLOAD_DIR` | Dossier où sont stockés les fichiers transférés | `...LocalShare\files`              |
| `STATIC_DIR` | Dossier contenant les fichiers de l'interface   | `static/` (relatif à `config.py`) |

---

## Utilisation

### Envoyer un fichier (depuis n'importe quel appareil)
1. Ouvre l'interface dans un navigateur
2. Section **⬆️ Envoyer** → appuie sur la zone ou glisse un fichier
3. Le fichier est déposé dans `UPLOAD_DIR`

### Recevoir un fichier (depuis n'importe quel appareil)
1. Section **⬇️ Recevoir** → les fichiers présents dans `UPLOAD_DIR` sont listés
2. Clique sur **⬇️** pour télécharger

### Presse-papier partagé
1. Section **📋 Presse-papier** → écris ou colle du texte
2. Clique **Envoyer** pour le partager
3. L'autre appareil reçoit le texte automatiquement dans les 3 secondes

---

## Notes

- Le serveur est accessible uniquement sur le réseau local - aucune donnée ne transite par internet
- Sur Windows, le pare-feu peut demander une autorisation lors du premier lancement : autorise Python sur les réseaux privés
- Le presse-papier partagé est en mémoire uniquement - il est effacé à chaque redémarrage du serveur
- `config.py` et `files/` sont dans le `.gitignore` - tes chemins personnels et fichiers transférés ne seront jamais poussés sur GitHub