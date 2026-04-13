// -- Point d'entrée ----------------------------------------------------------------

import { fetchInfo } from "./api.js";
import { initUpload } from "./upload.js";
import { loadFiles } from "./files.js";
import { initClipboard, syncClip } from "./clipboard.js";

/**
 * Récupère les informations du serveur et met à jour l'en-tête de la page
 * Affiche l'IP locale, le port et le dossier de stockage
 */
async function loadInfo() {
  const d = await fetchInfo();
  document.getElementById("addr").innerHTML =
    "📍 <strong>" + d.ip + ":" + d.port + "</strong> &nbsp;•&nbsp; Wi-Fi local";
  document.getElementById("storePath").textContent = d.dir;
}

// -- Init ----------------------------------------------------------------
await loadInfo();
await loadFiles();
await syncClip();

initUpload();
initClipboard();

setInterval(syncClip, 3000);
setInterval(loadFiles, 5000);
