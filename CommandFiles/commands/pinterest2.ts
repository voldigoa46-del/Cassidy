// @ts-check

/**
 * @type {CommandMeta}
 */
export const meta = {
  name: "pinterest2",
  description: "Recherche des images sur Pinterest par mot-clé",
  author: "Christus",
  version: "1.0.0",
  usage: "{prefix}{name} <query>",
  category: "Images",
  permissions: [0],
  waitingTime: 10,
  requirement: "3.0.0",
  otherNames: ["pin2", "pins"],
  icon: "📌",
  noWeb: true,
};

import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { defineEntry } from "@cass/define";

const CACHE_DIR = path.join(process.cwd(), "cache", "pinterest");

async function downloadImage(url: string, filename: string) {
  const filePath = path.join(CACHE_DIR, filename);
  try {
    const { data } = await axios.get(url, { responseType: "arraybuffer", timeout: 120_000 });
    await fs.writeFile(filePath, data);
    return filePath;
  } catch (err) {
    if (fs.existsSync(filePath)) await fs.unlink(filePath).catch(() => {});
    throw new Error("Échec du téléchargement de l'image Pinterest");
  }
}

export const entry = defineEntry(async ({ args, output }) => {
  const query = args.join(" ").trim();
  if (!query) return output.reply("❌ Veuillez fournir un mot-clé.\nExemple : pinterest cat");

  await fs.ensureDir(CACHE_DIR);
  await output.reply(`⏳ Recherche d'images Pinterest pour : **${query}**`);

  try {
    const { data } = await axios.get<any>(
      `https://zetbot-page.onrender.com/api/pinterest?query=${encodeURIComponent(query)}&limit=5`,
      { timeout: 120_000 }
    );

    if (!data?.status || !data?.pins || data.pins.length === 0) {
      throw new Error("Aucune image trouvée pour ce mot-clé.");
    }

    for (const pin of data.pins) {
      const imgPath = await downloadImage(pin.image, `pin_${pin.id}.jpg`);
      await output.reply({
        body: `📌 **Pinterest Image**\n${pin.title || "Sans titre"}\nUploader: [${pin.uploader.username}](${pin.uploader.profile_url})\n[Voir sur Pinterest](${pin.pin_url})`,
        attachment: fs.createReadStream(imgPath),
      });
      if (fs.existsSync(imgPath)) await fs.unlink(imgPath).catch(() => {});
    }
  } catch (err: any) {
    console.error("Pinterest Command Error:", err);
    output.reply(`❌ Échec de la recherche : ${err.message}`);
  }
});
