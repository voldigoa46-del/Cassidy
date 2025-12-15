// @ts-check

/**
 * @type {CommandMeta}
 */
export const meta = {
  name: "animagine",
  description: "Generate anime-style images using Animagine AI",
  author: "Christus",
  version: "1.0.0",
  usage: "{prefix}{name} <prompt>",
  category: "AI-Image",
  permissions: [0],
  waitingTime: 20,
  requirement: "3.0.0",
  otherNames: ["animeimg", "aniimg"],
  icon: "🍥",
  noWeb: true,
};

import axios from "axios";
import fs from "fs-extra";
import path from "path";
import stream from "stream";
import { promisify } from "util";
import { defineEntry } from "@cass/define";

const pipeline = promisify(stream.pipeline);
const API_ENDPOINT = "https://arychauhann.onrender.com/api/animagine";
const CACHE_DIR = path.join(process.cwd(), "cache", "animagine");

/* -------------------- HELPERS -------------------- */

async function downloadImage(url: string): Promise<string> {
  const filePath = path.join(
    CACHE_DIR,
    `animagine_${Date.now()}.png`
  );

  try {
    const res = await axios.get(url, {
      responseType: "stream",
      timeout: 120_000,
    });

    await pipeline(res.data, fs.createWriteStream(filePath));
    return filePath;
  } catch {
    if (fs.existsSync(filePath)) await fs.unlink(filePath);
    throw new Error("Failed to download image");
  }
}

/* -------------------- ENTRY -------------------- */

export const entry = defineEntry(
  async ({ input, output, args }) => {
    const prompt = args.join(" ").trim();

    if (!prompt) {
      return output.reply(
        "❌ Veuillez fournir un prompt.\nExemple : animagine anime ninja girl"
      );
    }

    await fs.ensureDir(CACHE_DIR);

    await output.reply("⏳ Génération de l’image Animagine en cours...");

    try {
      const { data } = await axios.get<any>(
        `${API_ENDPOINT}?prompt=${encodeURIComponent(prompt)}`,
        { timeout: 180_000 }
      );

      if (data?.status !== "success" || !data?.url) {
        throw new Error("API invalide ou image non générée");
      }

      const imageUrl: string = data.url;

      const imagePath = await downloadImage(imageUrl);

      await output.reply({
        body:
          "🍥 **Animagine Image Generated**\n" +
          `📝 Prompt : ${prompt}`,
        attachment: fs.createReadStream(imagePath),
      });

      // cleanup
      if (fs.existsSync(imagePath)) {
        await fs.unlink(imagePath).catch(() => {});
      }
    } catch (err: any) {
      console.error("Animagine Error:", err);
      output.reply(`❌ Échec de la génération : ${err.message}`);
    }
  }
);
