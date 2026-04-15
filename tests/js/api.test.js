import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchInfo,
  fetchFiles,
  fetchClipboard,
  postClipboard,
  deleteFile,
  uploadFile,
} from "../../static/js/api.js";

// Mock global fetch avant chaque test
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

// -- Helpers ----------------------------------------------------------------

/** Crée un mock fetch qui résout avec le JSON fourni */
function mockFetch(data) {
  fetch.mockResolvedValue({ json: () => Promise.resolve(data) });
}

// -- fetchInfo() ----------------------------------------------------------------

describe("fetchInfo()", () => {
  it("appelle /api/info et retourne les données", async () => {
    mockFetch({ ip: "192.168.1.1", port: 5000, dir: String.raw`C:\files` });
    const result = await fetchInfo();
    expect(fetch).toHaveBeenCalledWith("/api/info");
    expect(result.ip).toBe("192.168.1.1");
    expect(result.port).toBe(5000);
  });
});

// -- fetchFiles() ----------------------------------------------------------------

describe("fetchFiles()", () => {
  it("appelle /api/files et retourne la liste", async () => {
    mockFetch([{ name: "test.txt", size: "1.0 Ko" }]);
    const result = await fetchFiles();
    expect(fetch).toHaveBeenCalledWith("/api/files");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("test.txt");
  });

  it("retourne un tableau vide si aucun fichier", async () => {
    mockFetch([]);
    const result = await fetchFiles();
    expect(result).toEqual([]);
  });
});

// -- fetchClipboard() ----------------------------------------------------------------

describe("fetchClipboard()", () => {
  it("appelle /api/clipboard et retourne le texte", async () => {
    mockFetch({ text: "bonjour" });
    const result = await fetchClipboard();
    expect(fetch).toHaveBeenCalledWith("/api/clipboard");
    expect(result.text).toBe("bonjour");
  });

  it("retourne un texte vide si le presse-papier est vide", async () => {
    mockFetch({ text: "" });
    const result = await fetchClipboard();
    expect(result.text).toBe("");
  });
});

// -- postClipboard() ----------------------------------------------------------------

describe("postClipboard()", () => {
  it("envoie une requête POST avec le bon body JSON", async () => {
    fetch.mockResolvedValue({});
    await postClipboard("mon texte");
    expect(fetch).toHaveBeenCalledWith("/api/clipboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "mon texte" }),
    });
  });

  it("fonctionne avec une chaîne vide", async () => {
    fetch.mockResolvedValue({});
    await postClipboard("");
    expect(fetch).toHaveBeenCalledWith(
      "/api/clipboard",
      expect.objectContaining({
        body: JSON.stringify({ text: "" }),
      }),
    );
  });
});

// -- deleteFile() ----------------------------------------------------------------

describe("deleteFile()", () => {
  it("envoie une requête DELETE avec le nom encodé", async () => {
    fetch.mockResolvedValue({});
    await deleteFile("mon fichier.txt");
    expect(fetch).toHaveBeenCalledWith("/api/delete/mon%20fichier.txt", {
      method: "DELETE",
    });
  });

  it("encode les caractères spéciaux dans le nom", async () => {
    fetch.mockResolvedValue({});
    await deleteFile("fichier&test.txt");
    expect(fetch).toHaveBeenCalledWith("/api/delete/fichier%26test.txt", {
      method: "DELETE",
    });
  });
});

// -- uploadFile() ----------------------------------------------------------------

describe("uploadFile()", () => {
  it("envoie le fichier via XHR et appelle onProgress", async () => {
    // Mock XMLHttpRequest
    const xhrMock = {
      open: vi.fn(),
      send: vi.fn(),
      upload: {},
      onload: null,
      onerror: null,
    };
    vi.stubGlobal(
      "XMLHttpRequest",
      vi.fn(() => xhrMock),
    );

    const file = new File(["contenu"], "test.txt");
    const onProgress = vi.fn();

    const promise = uploadFile(file, onProgress);

    // Simule la fin de la requête
    xhrMock.onload();
    await promise;

    expect(xhrMock.open).toHaveBeenCalledWith("POST", "/api/upload");
    expect(xhrMock.send).toHaveBeenCalled();
    expect(xhrMock.upload.onprogress).toBe(onProgress);
  });

  it("rejette la promesse en cas d'erreur réseau", async () => {
    const xhrMock = {
      open: vi.fn(),
      send: vi.fn(),
      upload: {},
      onload: null,
      onerror: null,
    };
    vi.stubGlobal(
      "XMLHttpRequest",
      vi.fn(() => xhrMock),
    );

    const file = new File(["contenu"], "test.txt");
    const promise = uploadFile(file, vi.fn());

    // Simule une erreur réseau
    xhrMock.onerror(new Error("Network error"));

    await expect(promise).rejects.toBeDefined();
  });
});
