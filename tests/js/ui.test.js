import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fileIcon, esc, toast } from "../../static/js/ui.js";

// -- esc() ----------------------------------------------------------------

describe("esc()", () => {
  it("échappe les esperluettes", () => {
    expect(esc("a&b")).toBe("a&amp;b");
  });

  it("échappe les chevrons ouvrants", () => {
    expect(esc("<script>")).toBe("&lt;script&gt;");
  });

  it("échappe les guillemets doubles", () => {
    expect(esc('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("échappe plusieurs caractères spéciaux dans la même chaîne", () => {
    expect(esc('<a href="test&val">')).toBe(
      "&lt;a href=&quot;test&amp;val&quot;&gt;",
    );
  });

  it("retourne une chaîne vide inchangée", () => {
    expect(esc("")).toBe("");
  });

  it("retourne une chaîne sans caractères spéciaux inchangée", () => {
    expect(esc("hello world")).toBe("hello world");
  });

  it("convertit une valeur non-string en string avant d'échapper", () => {
    expect(esc(42)).toBe("42");
    expect(esc(null)).toBe("null");
  });
});

// -- fileIcon() ----------------------------------------------------------------

describe("fileIcon()", () => {
  it("retourne un emoji pour une extension image connue", () => {
    const result = fileIcon("photo.jpg");
    expect(result.emoji).toBe("🖼️");
    expect(result.known).toBe(true);
    expect(result.ext).toBe("");
  });

  it("retourne un emoji pour une extension vidéo connue", () => {
    expect(fileIcon("video.mp4").emoji).toBe("🎬");
  });

  it("retourne un emoji pour une extension audio connue", () => {
    expect(fileIcon("music.mp3").emoji).toBe("🎵");
  });

  it("retourne un emoji pour une extension archive connue", () => {
    expect(fileIcon("archive.zip").emoji).toBe("📦");
  });

  it("retourne un emoji pour une extension document connue", () => {
    expect(fileIcon("doc.pdf").emoji).toBe("📄");
    expect(fileIcon("doc.docx").emoji).toBe("📝");
    expect(fileIcon("table.xlsx").emoji).toBe("📊");
  });

  it("retourne un emoji pour une extension texte connue", () => {
    expect(fileIcon("readme.md").emoji).toBe("📃");
    expect(fileIcon("data.json").emoji).toBe("📃");
  });

  it("est insensible à la casse de l'extension", () => {
    expect(fileIcon("photo.JPG").emoji).toBe("🖼️");
    expect(fileIcon("photo.PNG").emoji).toBe("🖼️");
  });

  it("retourne known=false et l'extension brute pour un type inconnu", () => {
    const result = fileIcon("script.py");
    expect(result.emoji).toBeNull();
    expect(result.known).toBe(false);
    expect(result.ext).toBe("py");
  });

  it("retourne '?' pour un fichier sans extension", () => {
    const result = fileIcon("Makefile");
    expect(result.known).toBe(false);
    expect(result.ext).toBe("?");
  });

  it("gère l'extension 7z correctement", () => {
    expect(fileIcon("archive.7z").emoji).toBe("📦");
  });
});

// -- toast() ----------------------------------------------------------------

describe("toast()", () => {
  beforeEach(() => {
    // Crée un élément #toast dans le DOM de test
    document.body.innerHTML = '<div id="toast"></div>';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("affiche le message dans l'élément toast", () => {
    toast("Bonjour !");
    expect(document.getElementById("toast").textContent).toBe("Bonjour !");
  });

  it("applique la couleur par défaut si aucune couleur fournie", () => {
    toast("Test");
    expect(document.getElementById("toast").style.background).toBe(
      "rgb(16, 185, 129)",
    );
  });

  it("applique la couleur personnalisée", () => {
    toast("Erreur", "#dc2626");
    expect(document.getElementById("toast").style.background).toBe(
      "rgb(220, 38, 38)",
    );
  });

  it("ajoute la classe 'show' au toast", () => {
    toast("Test");
    expect(document.getElementById("toast").classList.contains("show")).toBe(
      true,
    );
  });

  it("retire la classe 'show' après 2500ms", () => {
    toast("Test");
    vi.advanceTimersByTime(2500);
    expect(document.getElementById("toast").classList.contains("show")).toBe(
      false,
    );
  });
});
