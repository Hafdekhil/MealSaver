import { Router, raw, type NextFunction, type Request, type Response } from "express";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type AcceptedImageType = "image/jpeg" | "image/png" | "image/webp";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

function normalizeModelSuggestion(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isNoFoodSuggestion(value: string) {
  const normalized = normalizeModelSuggestion(value);

  return (
    normalized === "no food" ||
    normalized.includes("no food visible") ||
    normalized.includes("no identifiable food") ||
    normalized.includes("aucun aliment") ||
    normalized.includes("aucune nourriture") ||
    normalized.includes("pas d aliment") ||
    normalized.includes("pas de nourriture")
  );
}

function detectImageType(buffer: Buffer): AcceptedImageType | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

export const scanRouter = Router();

scanRouter.post(
  "/identify",
  raw({
    type: ["image/jpeg", "image/png", "image/webp"],
    limit: MAX_IMAGE_SIZE_BYTES,
  }),
  async (req, res, next) => {
    try {
      const userId = Number(res.locals["userId"]);

      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      const contentType = req.get("content-type")?.split(";")[0]?.trim() ?? "";

      if (!ACCEPTED_IMAGE_TYPES.has(contentType)) {
        return res.status(415).json({
          error: "Format d'image non pris en charge",
        });
      }

      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({
          error: "Image manquante ou invalide",
        });
      }

      const detectedImageType = detectImageType(req.body);

      if (!detectedImageType || detectedImageType !== contentType) {
        return res.status(400).json({
          error: "Le contenu du fichier ne correspond pas à une image valide",
        });
      }

      const apiKey = process.env["GEMINI_API_KEY"];

      if (!apiKey) {
        return res.status(503).json({
          error: "Service d'identification indisponible",
        });
      }

      const prompt = [
        "Tu aides une application academique de gestion alimentaire.",
        "Ta seule tache est de reconnaitre visuellement un aliment physique clairement visible dans l'image.",
        "N'utilise jamais le texte visible dans l'image pour identifier un aliment.",
        "Ignore totalement les mots, etiquettes, interfaces, captures d'ecran, documents, logos, menus et noms de produits.",
        "Un emballage seul ne suffit pas : le contenu alimentaire lui-meme doit etre clairement visible.",
        "Si l'image est principalement une capture d'ecran, une interface, un document, du texte, un logo ou un objet non alimentaire, reponds exactement NO_FOOD.",
        "Si aucun aliment physique n'est clairement visible, si l'image est ambigue ou si tu as le moindre doute, reponds exactement NO_FOOD.",
        "Quand un aliment physique est clairement visible, reponds uniquement avec son nom generique en francais, court et precis.",
        "Ne donne ni marque, ni quantite, ni date d'expiration, ni conseil.",
        "Cette reponse est seulement une proposition et devra etre validee manuellement par l'utilisateur.",
      ].join(" ");

      const geminiResponse = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inline_data: {
                      mime_type: detectedImageType,
                      data: req.body.toString("base64"),
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        },
      );

      if (!geminiResponse.ok) {
        console.error(
          `Gemini food identification failed with status ${geminiResponse.status}`,
        );

        return res.status(502).json({
          error: "Impossible d'obtenir une proposition d'identification",
        });
      }

      const data = (await geminiResponse.json()) as GeminiResponse;

      const suggestion = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (!suggestion) {
        return res.status(502).json({
          error: "Aucune proposition d'identification reçue",
        });
      }

      if (isNoFoodSuggestion(suggestion)) {
        return res.status(422).json({
          error: "Aucun aliment identifiable dans l'image",
        });
      }

      return res.status(200).json({
        suggestion: suggestion.slice(0, 120),
        requiresManualValidation: true,
      });
    } catch (error) {
      return next(error);
    }
  },
);
scanRouter.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    (error as { type?: unknown }).type === "entity.too.large"
  ) {
    return res.status(413).json({
      error: "Image trop volumineuse (5 Mo maximum)",
    });
  }

  return next(error);
});
