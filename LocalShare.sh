#!/bin/bash
cd "$(dirname "$0")"

# Vérifie que Python est installé
if ! command -v python3 &> /dev/null; then
    echo "Python est introuvable sur cette machine."
    echo "Installe-le depuis https://python.org"
    exit 1
fi

# Ouvre le navigateur après 2s (laisse le temps au serveur de démarrer)
(sleep 2 && open "http://localhost:5000" 2>/dev/null || xdg-open "http://localhost:5000" 2>/dev/null) &

# Lance le serveur
python3 main.py
