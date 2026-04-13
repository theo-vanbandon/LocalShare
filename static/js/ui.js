// -- Utilitaires UI ----------------------------------------------------------------

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
  // Texte et config
  txt: "📃",
  md: "📃",
  json: "📃",
  xml: "📃",
  csv: "📃",
  yaml: "📃",
  yml: "📃",
};

/**
 * Retourne un objet décrivant l'icône à afficher pour un fichier
 * Si l'extension est connue → emoji + known=true
 * Sinon → badge texte avec l'extension brute + known=false
 * @param {string} name - Nom du fichier
 * @returns {{ emoji: string|null, known: boolean, ext: string }}
 */
export function fileIcon(name) {
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  return ICON_MAP[ext]
    ? { emoji: ICON_MAP[ext], known: true, ext: "" }
    : { emoji: null, known: false, ext: ext || "?" };
}

/**
 * Échappe les caractères spéciaux HTML pour éviter les injections XSS
 * @param {*} s - Valeur à échapper
 * @returns {string}
 */
export function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// -- Toast ----------------------------------------------------------------
let toastTimer;

/**
 * Affiche une notification temporaire en bas de l'écran
 * @param {string} msg   - Message à afficher
 * @param {string} color - Couleur de fond (optionnel, vert par défaut)
 */
export function toast(msg, color) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.style.background = color || "#10b981";
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2500);
}
