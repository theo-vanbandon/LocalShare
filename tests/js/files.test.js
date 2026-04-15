import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadFiles } from "../../static/js/files.js";

/** Setup DOM minimal pour les tests */
function setupDOM() {
  document.body.innerHTML = `
    <div id="fileList"></div>
    <div id="toast"></div>
  `;
}

beforeEach(() => {
  setupDOM();
  vi.stubGlobal("fetch", vi.fn());
});

/** Simule une réponse fetch avec une liste de fichiers */
function mockFiles(files) {
  fetch.mockResolvedValue({ json: () => Promise.resolve(files) });
}

// -- loadFiles() ----------------------------------------------------------------

describe("loadFiles()", () => {
  it("affiche un message si aucun fichier disponible", async () => {
    mockFiles([]);
    await loadFiles();
    expect(document.getElementById("fileList").innerHTML).toContain(
      "Aucun fichier disponible",
    );
  });

  it("affiche un fichier avec son nom et sa taille", async () => {
    mockFiles([{ name: "test.txt", size: "1.0 Ko" }]);
    await loadFiles();
    const html = document.getElementById("fileList").innerHTML;
    expect(html).toContain("test.txt");
    expect(html).toContain("1.0 Ko");
  });

  it("affiche un emoji pour une extension connue", async () => {
    mockFiles([{ name: "photo.jpg", size: "500.0 o" }]);
    await loadFiles();
    expect(document.getElementById("fileList").innerHTML).toContain("🖼️");
  });

  it("affiche le badge texte pour une extension inconnue", async () => {
    mockFiles([{ name: "script.py", size: "2.0 Ko" }]);
    await loadFiles();
    expect(document.getElementById("fileList").innerHTML).toContain("py");
  });

  it("affiche plusieurs fichiers", async () => {
    mockFiles([
      { name: "a.txt", size: "1.0 Ko" },
      { name: "b.pdf", size: "2.0 Mo" },
    ]);
    await loadFiles();
    const html = document.getElementById("fileList").innerHTML;
    expect(html).toContain("a.txt");
    expect(html).toContain("b.pdf");
  });

  it("échappe les caractères spéciaux dans le nom affiché", async () => {
    mockFiles([{ name: '<script>alert("xss")</script>.txt', size: "1.0 o" }]);
    await loadFiles();
    const fileNameEl = document.querySelector(".file-name");
    expect(fileNameEl.innerHTML).toContain("&lt;script&gt;");
    expect(fileNameEl.innerHTML).not.toContain("<script>");
  });

  it("génère un lien de téléchargement pour chaque fichier", async () => {
    mockFiles([{ name: "doc.pdf", size: "1.0 Mo" }]);
    await loadFiles();
    expect(document.getElementById("fileList").innerHTML).toContain(
      "/download/doc.pdf",
    );
  });

  it("génère un bouton de suppression avec data-filename", async () => {
    mockFiles([{ name: "test.txt", size: "1.0 Ko" }]);
    await loadFiles();
    const btn = document.querySelector("button[data-filename]");
    expect(btn).not.toBeNull();
    expect(btn.dataset.filename).toBe("test.txt");
  });

  it("ne supprime pas si l'utilisateur annule la confirmation", async () => {
    mockFiles([{ name: "test.txt", size: "1.0 Ko" }]);
    await loadFiles();

    vi.stubGlobal("confirm", () => false);

    const btn = document.querySelector("button[data-filename]");
    btn.click();

    expect(fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/delete/"),
      expect.anything(),
    );
  });

  it("supprime le fichier si l'utilisateur confirme", async () => {
    mockFiles([{ name: "test.txt", size: "1.0 Ko" }]);
    await loadFiles();

    vi.stubGlobal("confirm", () => true);

    fetch
      .mockResolvedValueOnce({}) // delete
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) }); // reload

    const btn = document.querySelector("button[data-filename]");
    btn.click();

    // laisse le temps aux promesses async
    await Promise.resolve();
    await Promise.resolve();

    expect(fetch).toHaveBeenCalledWith("/api/delete/test.txt", {
      method: "DELETE",
    });
  });

  it("encode les caractères spéciaux dans l'URL de téléchargement", async () => {
    mockFiles([{ name: "mon fichier.txt", size: "1.0 Ko" }]);
    await loadFiles();
    expect(document.getElementById("fileList").innerHTML).toContain(
      "/download/mon%20fichier.txt",
    );
  });
});
