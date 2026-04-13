// -- Clipboard ----------------------------------------------------------------

import { fetchClipboard, postClipboard } from "./api.js";
import { toast } from "./ui.js";

let lastClip = null;
let isTyping = false;
let typingTimer;

/**
 * Initialise les événements du presse-papier :
 * - Détection de frappe active pour ne pas écraser le texte en cours de saisie
 * - Boutons Envoyer, Copier, Vider
 */
export function initClipboard() {
  document.getElementById("clipText").addEventListener("keydown", () => {
    isTyping = true;
    clearTimeout(typingTimer);
    // Considère l'utilisateur comme inactif après 2s sans frappe
    typingTimer = setTimeout(() => {
      isTyping = false;
    }, 2000);
  });

  document.getElementById("btnSaveClip").addEventListener("click", saveClip);
  document.getElementById("btnCopyClip").addEventListener("click", copyClip);
  document.getElementById("btnClearClip").addEventListener("click", clearClip);
}

/**
 * Synchronise le presse-papier depuis le serveur
 * Ne met pas à jour le textarea si l'utilisateur est en train de taper
 */
export async function syncClip() {
  try {
    const d = await fetchClipboard();
    const ta = document.getElementById("clipText");
    // Ne pas écraser si l'utilisateur est en train de taper activement
    if (d.text !== lastClip && !isTyping) {
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

/** Envoie le contenu du textarea vers le presse-papier partagé */
async function saveClip() {
  const text = document.getElementById("clipText").value;
  await postClipboard(text);
  lastClip = text;
  toast("📋 Texte envoyé !");
}

/**
 * Copie le contenu du textarea dans le presse-papier local de l'appareil
 * Utilise navigator.clipboard si HTTPS disponible, sinon fallback execCommand
 */
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

/** Vide le presse-papier partagé côté serveur et réinitialise l'interface */
async function clearClip() {
  document.getElementById("clipText").value = "";
  lastClip = "";
  await postClipboard("");
  document.getElementById("clipStatus").textContent =
    "Synchronisation automatique toutes les 3 secondes";
  toast("Presse-papier vidé", "#6b7280");
}
