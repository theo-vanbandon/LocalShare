import { describe, it, expect, vi, beforeEach } from "vitest";
import { initUpload } from "../../static/js/upload.js";

beforeEach(() => {
  // DOM minimal requis par upload.js
  document.body.innerHTML = `
    <div id="dropZone">
      <input type="file" id="fileInput" multiple />
    </div>
    <div id="progressWrap" style="display:none">
      <div id="progressLabel"></div>
      <div id="progressBar">
        <div id="progressFill"></div>
      </div>
    </div>
    <div id="fileList"></div>
    <div id="toast"></div>
  `;
  vi.stubGlobal("fetch", vi.fn());
});

/** Crée un mock XHR qui se résout immédiatement */
function mockXhr() {
  const xhrMock = {
    open: vi.fn(),
    send: vi.fn((fd) => {
      setTimeout(() => xhrMock.onload(), 0);
    }),
    upload: {},
    onload: null,
    onerror: null,
  };
  vi.stubGlobal(
    "XMLHttpRequest",
    vi.fn(() => xhrMock),
  );
  return xhrMock;
}

// -- initUpload() ----------------------------------------------------------------

describe("initUpload()", () => {
  it("attache un écouteur click sur la dropzone", () => {
    initUpload();
    const fileInput = document.getElementById("fileInput");
    const clickSpy = vi.spyOn(fileInput, "click");
    document.getElementById("dropZone").click();
    expect(clickSpy).toHaveBeenCalled();
  });

  it("ajoute la classe 'drag' au dragover", () => {
    initUpload();
    const dropZone = document.getElementById("dropZone");
    dropZone.dispatchEvent(new Event("dragover"));
    expect(dropZone.classList.contains("drag")).toBe(true);
  });

  it("retire la classe 'drag' au dragleave", () => {
    initUpload();
    const dropZone = document.getElementById("dropZone");
    dropZone.classList.add("drag");
    dropZone.dispatchEvent(new Event("dragleave"));
    expect(dropZone.classList.contains("drag")).toBe(false);
  });

  it("retire la classe 'drag' et lance l'upload au drop", async () => {
    mockXhr();
    fetch.mockResolvedValue({ json: () => Promise.resolve([]) });
    initUpload();

    const dropZone = document.getElementById("dropZone");
    dropZone.classList.add("drag");

    const file = new File(["contenu"], "test.txt");
    const dropEvent = new Event("drop");
    dropEvent.dataTransfer = { files: [file] };
    dropZone.dispatchEvent(dropEvent);

    expect(dropZone.classList.contains("drag")).toBe(false);
  });

  it("affiche la barre de progression pendant l'upload", async () => {
    mockXhr();
    fetch.mockResolvedValue({ json: () => Promise.resolve([]) });
    initUpload();

    const file = new File(["contenu"], "test.txt");
    const changeEvent = new Event("change");
    Object.defineProperty(document.getElementById("fileInput"), "files", {
      value: [file],
      configurable: true,
    });
    document.getElementById("fileInput").dispatchEvent(changeEvent);

    expect(document.getElementById("progressWrap").style.display).toBe("block");
  });

  it("met à jour la barre de progression via onProgress quand lengthComputable", async () => {
    const xhrMock = mockXhr();
    fetch.mockResolvedValue({ json: () => Promise.resolve([]) });
    initUpload();

    const file = new File(["contenu"], "test.txt");
    Object.defineProperty(document.getElementById("fileInput"), "files", {
      value: [file],
      configurable: true,
    });
    document.getElementById("fileInput").dispatchEvent(new Event("change"));

    // Simule un événement de progression
    xhrMock.upload.onprogress({
      lengthComputable: true,
      loaded: 50,
      total: 100,
    });

    expect(document.getElementById("progressFill").style.width).toBe("50%");
  });

  it("ne lance pas l'upload si la liste de fichiers est vide", async () => {
    mockXhr();
    fetch.mockResolvedValue({ json: () => Promise.resolve([]) });
    initUpload();

    Object.defineProperty(document.getElementById("fileInput"), "files", {
      value: [],
      configurable: true,
    });
    document.getElementById("fileInput").dispatchEvent(new Event("change"));

    // Aucune requête XHR ne doit être envoyée
    expect(document.getElementById("progressWrap").style.display).not.toBe(
      "block",
    );
  });

  it("affiche le toast au pluriel pour plusieurs fichiers", async () => {
    const xhrMock = mockXhr();
    fetch.mockResolvedValue({ json: () => Promise.resolve([]) });
    initUpload();

    const files = [new File(["a"], "a.txt"), new File(["b"], "b.txt")];
    Object.defineProperty(document.getElementById("fileInput"), "files", {
      value: files,
      configurable: true,
    });
    document.getElementById("fileInput").dispatchEvent(new Event("change"));

    // Laisse les XHR se résoudre
    await new Promise((r) => setTimeout(r, 50));

    expect(document.getElementById("toast").textContent).toBe(
      "✅ 2 fichiers envoyés !",
    );
  });

  it("n'update pas la barre si lengthComputable est false", async () => {
    const xhrMock = mockXhr();
    fetch.mockResolvedValue({ json: () => Promise.resolve([]) });
    initUpload();

    const file = new File(["contenu"], "test.txt");
    Object.defineProperty(document.getElementById("fileInput"), "files", {
      value: [file],
      configurable: true,
    });
    document.getElementById("fileInput").dispatchEvent(new Event("change"));

    xhrMock.upload.onprogress({ lengthComputable: false });

    expect(document.getElementById("progressFill").style.width).toBe("");
  });
});
