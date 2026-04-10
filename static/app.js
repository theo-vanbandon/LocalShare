// -- Icônes par extension ----------------------------------------------------------------
const ICON_MAP = {
  // Images
  jpg: "🖼️",
  jpeg: "🖼️",
  png: "🖼️",
  gif: "🖼️",
  webp: "🖼️",
  svg: "🖼️",
  ico: "🖼️",
  // Vidéo
  mp4: "🎬",
  mov: "🎬",
  avi: "🎬",
  mkv: "🎬",
  // Audio
  mp3: "🎵",
  wav: "🎵",
  ogg: "🎵",
  // Archives
  zip: "📦",
  rar: "📦",
  "7z": "📦",
  tar: "📦",
  gz: "📦",
  // Documents bureautique
  pdf: "📄",
  doc: "📝",
  docx: "📝",
  xls: "📊",
  xlsx: "📊",
  ppt: "📽️",
  pptx: "📽️",
  // Texte / config
  txt: "📃",
  md: "📃",
  json: "📃",
  xml: "📃",
  csv: "📃",
  yaml: "📃",
  yml: "📃",
  toml: "📃",
};

/**
 * Retourne { emoji, known, ext } pour un nom de fichier.
 * Si l'extension est connue → emoji + known=true.
 * Sinon → badge texte avec l'extension brute.
 */
function fileIcon(name) {
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  return ICON_MAP[ext]
    ? { emoji: ICON_MAP[ext], known: true, ext: "" }
    : { emoji: null, known: false, ext: ext || "?" };
}

// -- Échappement HTML ----------------------------------------------------------------
function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// -- Toast ----------------------------------------------------------------
let toastTimer;

function toast(msg, color) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.style.background = color || "#10b981";
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2500);
}

// -- Info serveur ----------------------------------------------------------------
async function loadInfo() {
  const d = await fetch("/api/info").then((r) => r.json());
  document.getElementById("addr").innerHTML =
    "📍 <strong>" + d.ip + ":" + d.port + "</strong> &nbsp;•&nbsp; Wi-Fi local";
  document.getElementById("storePath").textContent = d.dir;
}

// -- Upload ----------------------------------------------------------------
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");

dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag"));
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag");
  upload(e.dataTransfer.files);
});
fileInput.addEventListener("change", () => {
  if (fileInput.files.length) upload(fileInput.files);
});

async function upload(fileList) {
  // Copie immédiate en Array avant tout reset ou opération async
  const files = Array.from(fileList);
  if (!files.length) return;

  const pw = document.getElementById("progressWrap");
  const pf = document.getElementById("progressFill");
  const pl = document.getElementById("progressLabel");
  pw.style.display = "block";

  for (let i = 0; i < files.length; i++) {
    pl.textContent = `Envoi de "${files[i].name}" (${i + 1}/${files.length})...`;
    const fd = new FormData();
    fd.append("file", files[i]);

    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          pf.style.width =
            ((i + e.loaded / e.total) / files.length) * 100 + "%";
        }
      };
      xhr.onload = resolve;
      xhr.onerror = reject;
      xhr.send(fd);
    });
  }

  pw.style.display = "none";
  pf.style.width = "0";
  fileInput.value = "";

  const n = files.length;
  toast(`✅ ${n} fichier${n > 1 ? "s" : ""} envoyé${n > 1 ? "s" : ""} !`);
  loadFiles();
}

// -- Liste des fichiers ----------------------------------------------------------------
async function loadFiles() {
  const files = await fetch("/api/files").then((r) => r.json());
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
          <button onclick="deleteFile('${esc(f.name)}')" class="btn btn-red btn-sm">🗑️</button>
        </div>
      </div>`;
    })
    .join("");
}

async function deleteFile(name) {
  if (!confirm(`Supprimer "${name}" ?`)) return;
  await fetch("/api/delete/" + encodeURIComponent(name), { method: "DELETE" });
  toast("🗑️ Supprimé", "#dc2626");
  loadFiles();
}

// -- Clipboard ----------------------------------------------------------------
let lastClip = null;

async function saveClip() {
  const text = document.getElementById("clipText").value;
  await fetch("/api/clipboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  lastClip = text;
  toast("📋 Texte envoyé !");
}

async function syncClip() {
  try {
    const d = await fetch("/api/clipboard").then((r) => r.json());
    const ta = document.getElementById("clipText");
    if (d.text !== lastClip && document.activeElement !== ta) {
      ta.value = d.text;
      lastClip = d.text;
      if (d.text) {
        const t = new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        document.getElementById("clipStatus").textContent = "Mis à jour à " + t;
      }
    }
  } catch (error) {
    console.error("Erreur lors de la synchronisation du clipboard :", error);
  }
}

function copyClip() {
  const text = document.getElementById("clipText").value;
  if (!text) {
    toast("Rien à copier", "#f59e0b");
    return;
  }

  // navigator.clipboard requiert HTTPS - indisponible sur le tel en HTTP local
  if (navigator.clipboard && globalThis.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => toast("📋 Copié !"));
  } else {
    // Fallback universel : sélection + execCommand
    const ta = document.getElementById("clipText");
    ta.select();
    ta.setSelectionRange(0, 99999); // mobile
    document.execCommand("copy"); // eslint-disable-line deprecation/deprecation -- fallback intentionnel, pas d'alternative sans HTTPS // NOSONAR
    globalThis.getSelection()?.removeAllRanges();
    toast("📋 Copié !");
  }
}

async function clearClip() {
  document.getElementById("clipText").value = "";
  lastClip = "";
  await fetch("/api/clipboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "" }),
  });
  document.getElementById("clipStatus").textContent =
    "Synchronisation automatique toutes les 3 secondes";
  toast("Presse-papier vidé", "#6b7280");
}

// -- Init ----------------------------------------------------------------
loadInfo();
loadFiles();
syncClip();
setInterval(syncClip, 3000);
setInterval(loadFiles, 5000);
