// -- Requêtes serveur ----------------------------------------------------------------

/** Récupère les informations du serveur (IP, port, dossier de stockage) */
export async function fetchInfo() {
  return fetch("/api/info").then((r) => r.json());
}

/** Récupère la liste des fichiers disponibles dans le dossier de stockage */
export async function fetchFiles() {
  return fetch("/api/files").then((r) => r.json());
}

/** Récupère le contenu actuel du presse-papier partagé */
export async function fetchClipboard() {
  return fetch("/api/clipboard").then((r) => r.json());
}

/** Envoie un texte vers le presse-papier partagé */
export async function postClipboard(text) {
  return fetch("/api/clipboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

/** Supprime un fichier du dossier de stockage par son nom */
export async function deleteFile(name) {
  return fetch("/api/delete/" + encodeURIComponent(name), { method: "DELETE" });
}

/**
 * Envoie un fichier vers le serveur via une requête multipart
 * @param {File} file - Le fichier à envoyer
 * @param {function} onProgress - Callback appelé à chaque progression (ProgressEvent)
 */
export async function uploadFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = onProgress;
    xhr.onload = resolve;
    xhr.onerror = reject;
    xhr.send(fd);
  });
}
