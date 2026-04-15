// -- Upload ----------------------------------------------------------------

import { uploadFile } from "./api.js";
import { toast } from "./ui.js";
import { loadFiles } from "./files.js";

/** Initialise la dropzone et les événements d'upload */
export function initUpload() {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");

  dropZone.addEventListener("click", () => fileInput.click());

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag");
    upload(e.dataTransfer.files);
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) upload(fileInput.files);
  });
}

/**
 * Envoie une liste de fichiers vers le serveur un par un
 * Met à jour la barre de progression et rafraîchit la liste à la fin
 * @param {FileList} fileList - Fichiers sélectionnés ou déposés
 */
async function upload(fileList) {
  // Copie immédiate en Array avant tout reset ou opération async
  const files = Array.from(fileList);
  if (!files.length) return; /* v8 ignore next */

  const pw = document.getElementById("progressWrap");
  const pf = document.getElementById("progressFill");
  const pl = document.getElementById("progressLabel");
  pw.style.display = "block";

  for (let i = 0; i < files.length; i++) {
    pl.textContent = `Envoi de "${files[i].name}" (${i + 1}/${files.length})...`;

    await uploadFile(files[i], (e) => {
      if (e.lengthComputable) {
        pf.style.width = ((i + e.loaded / e.total) / files.length) * 100 + "%";
      }
    });
  }

  pw.style.display = "none";
  pf.style.width = "0";
  document.getElementById("fileInput").value = "";

  const n = files.length;
  toast(`✅ ${n} fichier${n > 1 ? "s" : ""} envoyé${n > 1 ? "s" : ""} !`);
  await loadFiles();
}
