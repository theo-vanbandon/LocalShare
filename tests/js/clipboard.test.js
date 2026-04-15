import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initClipboard, syncClip } from "../../static/js/clipboard.js";

beforeEach(() => {
  // DOM minimal requis par clipboard.js
  document.body.innerHTML = `
    <textarea id="clipText"></textarea>
    <button id="btnSaveClip"></button>
    <button id="btnCopyClip"></button>
    <button id="btnClearClip"></button>
    <span id="clipStatus">Synchronisation automatique toutes les 3 secondes</span>
    <div id="toast"></div>
  `;

  vi.stubGlobal("fetch", vi.fn());
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** Simule une réponse /api/clipboard avec le texte fourni */
function mockClipboard(text) {
  fetch.mockResolvedValue({ json: () => Promise.resolve({ text }) });
}

// -- syncClip() ----------------------------------------------------------------

describe("syncClip()", () => {
  it("met à jour le textarea si le texte a changé", async () => {
    mockClipboard("bonjour");
    await syncClip();
    expect(document.getElementById("clipText").value).toBe("bonjour");
  });

  it("ne met pas à jour si le texte est identique au dernier sync", async () => {
    mockClipboard("bonjour");
    await syncClip();

    document.getElementById("clipText").value = "modifié localement";

    await syncClip();

    expect(document.getElementById("clipText").value).toBe(
      "modifié localement",
    );
  });

  it("met à jour le statut avec l'heure si le texte n'est pas vide", async () => {
    mockClipboard("nouveau texte");
    await syncClip();
    const status = document.getElementById("clipStatus").textContent;
    expect(status).toMatch(/Mis à jour à \d{2}:\d{2}:\d{2}/);
  });

  it("ne met pas à jour le statut si le texte est vide", async () => {
    mockClipboard("");
    await syncClip();
    expect(document.getElementById("clipStatus").textContent).toBe(
      "Synchronisation automatique toutes les 3 secondes",
    );
  });

  it("ne met pas à jour le textarea si l'utilisateur est en train de taper", async () => {
    initClipboard();
    mockClipboard("texte serveur");

    document
      .getElementById("clipText")
      .dispatchEvent(new KeyboardEvent("keydown"));

    await syncClip();
    expect(document.getElementById("clipText").value).toBe("");
  });

  it("reprend la sync après 2s d'inactivité", async () => {
    initClipboard();
    mockClipboard("texte serveur");

    document
      .getElementById("clipText")
      .dispatchEvent(new KeyboardEvent("keydown"));

    vi.advanceTimersByTime(2000);

    await syncClip();
    expect(document.getElementById("clipText").value).toBe("texte serveur");
  });

  it("logue une erreur si le fetch échoue", async () => {
    fetch.mockRejectedValue(new Error("réseau indisponible"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await syncClip();
    expect(consoleSpy).toHaveBeenCalled();
  });
});

// -- initClipboard() ----------------------------------------------------------------

describe("initClipboard()", () => {
  it("attache les événements sur les boutons", () => {
    fetch.mockResolvedValue({});
    initClipboard();

    expect(() => document.getElementById("btnSaveClip").click()).not.toThrow();
    expect(() => document.getElementById("btnClearClip").click()).not.toThrow();
  });

  it("appelle fetch sur le clic Envoyer", async () => {
    fetch.mockResolvedValue({});
    initClipboard();

    document.getElementById("clipText").value = "test";
    document.getElementById("btnSaveClip").click();

    await Promise.resolve();

    expect(fetch).toHaveBeenCalledWith("/api/clipboard", expect.anything());
  });

  it("vide le textarea sur le clic Vider", async () => {
    fetch.mockResolvedValue({});
    initClipboard();

    document.getElementById("clipText").value = "du texte";
    document.getElementById("btnClearClip").click();

    await Promise.resolve();

    expect(document.getElementById("clipText").value).toBe("");
  });

  it("appelle fetch avec un texte vide sur le clic Vider", async () => {
    fetch.mockResolvedValue({});
    initClipboard();

    document.getElementById("btnClearClip").click();

    await Promise.resolve();

    expect(fetch).toHaveBeenCalledWith(
      "/api/clipboard",
      expect.objectContaining({
        body: JSON.stringify({ text: "" }),
      }),
    );
  });

  it("affiche un toast 'Rien à copier' si le textarea est vide au clic Copier", () => {
    initClipboard();

    document.getElementById("clipText").value = "";
    document.getElementById("btnCopyClip").click();

    expect(document.getElementById("toast").textContent).toBe("Rien à copier");
  });

  it("copie via le fallback execCommand si navigator.clipboard est indisponible", () => {
    initClipboard();

    document.getElementById("clipText").value = "texte à copier";

    vi.stubGlobal("navigator", { clipboard: null });

    Object.defineProperty(globalThis, "isSecureContext", {
      value: false,
      configurable: true,
    });

    globalThis.getSelection = () => ({ removeAllRanges: vi.fn() });

    document.execCommand = vi.fn();

    document.getElementById("btnCopyClip").click();

    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(document.getElementById("toast").textContent).toBe("📋 Copié !");
  });

  it("copie via navigator.clipboard si contexte sécurisé (HTTPS)", async () => {
    initClipboard();

    document.getElementById("clipText").value = "texte sécurisé";

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText: writeTextMock } });

    Object.defineProperty(globalThis, "isSecureContext", {
      value: true,
      configurable: true,
    });

    document.getElementById("btnCopyClip").click();

    await Promise.resolve();

    expect(writeTextMock).toHaveBeenCalledWith("texte sécurisé");
  });
});
