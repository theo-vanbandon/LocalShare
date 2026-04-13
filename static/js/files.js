// -- Fichiers ----------------------------------------------------------------

import { fetchFiles, deleteFile as deleteFileApi } from "./api.js";
import { fileIcon, esc, toast } from "./ui.js";

/**
 * Récupère la liste des fichiers depuis le serveur et met à jour l'interface
 * Attache les événements de suppression sur les boutons générés
 */
export async function loadFiles() {
  const files = await fetchFiles();
  const el = document.getElementById("fileList");

  if (!files.length) {
    el.innerHTML = '<p class="empty">Aucun fichier disponible</p>';
    return;
  }

  el.innerHTML = files
    .map((f) => {
      const ic = fileIcon(f.name);
      const badge = ic.emoji
        ? `<div class="file-ext known">${ic.emoji}</div>`
        : `<div class="file-ext">${esc(ic.ext)}</div>`;
      return `
        <div class="file-item">
          ${badge}
          <div class="file-info">
            <div class="file-name">${esc(f.name)}</div>
            <div class="file-size">${f.size}</div>
          </div>
          <div class="file-btns">
            <a href="/download/${encodeURIComponent(f.name)}" class="btn btn-green btn-sm">⬇️</a>
            <button class="btn btn-red btn-sm" data-filename="${esc(f.name)}">🗑️</button>
          </div>
        </div>`;
    })
    .join("");

  // Attache les événements de suppression sur les boutons générés
  el.querySelectorAll("button[data-filename]").forEach((btn) => {
    btn.addEventListener("click", () => handleDelete(btn.dataset.filename));
  });
}

/**
 * Demande confirmation puis supprime le fichier et rafraîchit la liste
 * @param {string} name - Nom du fichier à supprimer
 */
async function handleDelete(name) {
  if (!confirm(`Supprimer "${name}" ?`)) return;
  await deleteFileApi(name);
  toast("🗑️ Supprimé", "#dc2626");
  await loadFiles();
}
