var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_multer = __toESM(require("multer"), 1);
var upload = (0, import_multer.default)({ storage: import_multer.default.memoryStorage() });
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use((0, import_cors.default)());
  app.use(import_express.default.json({ limit: "50mb" }));
  const ai = new import_genai.GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.post("/api/verify-face", upload.single("selfie"), async (req, res) => {
    try {
      const selfieFile = req.file;
      const galleryUrls = JSON.parse(req.body.galleryUrls);
      if (!selfieFile || !galleryUrls.length) {
        return res.status(400).json({ error: "Missing selfie or gallery images" });
      }
      const selfiePart = {
        inlineData: {
          mimeType: selfieFile.mimetype,
          data: selfieFile.buffer.toString("base64")
        }
      };
      const galleryParts = await Promise.all(galleryUrls.map(async (url) => {
        try {
          if (url.startsWith("data:")) {
            const [mimePart, dataPart] = url.split(",");
            const mimeType = mimePart.split(":")[1].split(";")[0];
            return { inlineData: { mimeType, data: dataPart } };
          }
          if (url.startsWith("blob:")) return null;
          const imageRes = await fetch(url);
          if (!imageRes.ok) return null;
          const buffer = await imageRes.arrayBuffer();
          return {
            inlineData: {
              mimeType: imageRes.headers.get("content-type") || "image/jpeg",
              data: Buffer.from(buffer).toString("base64")
            }
          };
        } catch (e) {
          return null;
        }
      }));
      const filteredGalleryParts = galleryParts.filter(Boolean);
      const prompt = `
        I am providing a "target" selfie and a series of gallery images.
        Identify the person in the selfie.
        For each gallery image provided (following the target selfie), determine if that same person appears prominently.
        
        Respond ONLY with a JSON array of the indices (0-based) of the gallery images that match. 
        Example: [0, 2] if the 1st and 3rd gallery images match.
        If no matches, respond with [].
      `;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { text: prompt },
            { text: "Target Selfie:" },
            selfiePart,
            { text: "Gallery Images:" },
            ...filteredGalleryParts
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });
      const matchedIndices = JSON.parse(response.text || "[]");
      res.json({ matchedIndices });
    } catch (error) {
      console.error("Face verification error:", error);
      res.status(500).json({ error: "Failed to verify face", details: error.message });
    }
  });
  app.post("/api/summarize-collection", async (req, res) => {
    try {
      const { imageUrls, weddingName } = req.body;
      if (!imageUrls || !imageUrls.length) {
        return res.status(400).json({ error: "Missing images" });
      }
      const representativeImages = imageUrls.slice(0, 8);
      const prompt = `
        You are looking at a collection of photos from a wedding named "${weddingName}".
        Based on these images, provide a brief, poetic, and aesthetic description of the collection. 
        Focus on the mood, the style, and the key moments captured. 
        Keep it under 100 words.
        Respond with a JSON object: { "summary": "your poetic description here" }
      `;
      const imageParts = await Promise.all(representativeImages.map(async (url) => {
        try {
          if (url.startsWith("data:")) {
            const [mimePart, dataPart] = url.split(",");
            const mimeType = mimePart.split(":")[1].split(";")[0];
            return {
              inlineData: {
                mimeType,
                data: dataPart
              }
            };
          }
          if (url.startsWith("blob:")) {
            return null;
          }
          const imageRes = await fetch(url);
          if (!imageRes.ok) throw new Error(`Status ${imageRes.status}`);
          const buffer = await imageRes.arrayBuffer();
          return {
            inlineData: {
              mimeType: imageRes.headers.get("content-type") || "image/jpeg",
              data: Buffer.from(buffer).toString("base64")
            }
          };
        } catch (e) {
          console.error(`Failed to fetch image for Gemini: ${url}`, e.message);
          return null;
        }
      }));
      const filteredParts = imageParts.filter(Boolean);
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ text: prompt }, ...filteredParts] },
        config: {
          responseMimeType: "application/json"
        }
      });
      const result = JSON.parse(response.text || "{}");
      res.json(result);
    } catch (error) {
      console.error("Summarization error:", error);
      res.status(500).json({ error: "Failed to summarize collection", details: error.message });
    }
  });
  app.post("/api/generate-toast", async (req, res) => {
    try {
      const { relationship, tone, memory, weddingName } = req.body;
      const prompt = `
        Write a wedding toast for a wedding named "${weddingName}".
        Guest's relationship to the couple: ${relationship}
        Tone of the toast: ${tone}
        Key memory/point to include: ${memory || "None specified, just be general but heartfelt."}

        Requirements:
        - Keep it well-structured and engaging.
        - Ensure it fits the requested tone perfectly.
        - If tone is "Funny", include a light-hearted joke.
        - If tone is "Tear-jerker", focus on deep emotional connection.
        - Keep the output around 100-150 words.
        - Respond with a JSON object: { "toast": "the full toast text here" }
      `;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const result = JSON.parse(response.text || "{}");
      res.json(result);
    } catch (error) {
      console.error("Toast generation error:", error);
      res.status(500).json({ error: "Failed to generate toast", details: error.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
