// CommandFiles/commands/nanobanana.ts

import axios from "axios";
import fs from "fs-extra";
import path from "path";
import moment from "moment-timezone";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

export const meta: CommandMeta = {
  name: "nanobanana",
  description: "Générer une image IA avec l'API NanoBanana",
  author: "Christus | API Renz",
  version: "1.0.1",
  usage: "{prefix}nanobanana <prompt>",
  category: "Image Generator",
  role: 0,
  noPrefix: false,
  waitingTime: 5,
  otherNames: ["nb"],
  icon: "🍌",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "Astral • NanoBanana Image Generator 🍌",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  fr: {
    noPrompt:
      "⚠️ Veuillez fournir un prompt pour générer une image.\nExemple : {prefix}nanobanana Un chat mignon portant des lunettes de soleil",
    processing: "⏳ Génération de votre image en cours...",
    success: '✅ Image générée pour : "{prompt}"',
    error: "❌ Échec de la génération de l'image. Veuillez réessayer plus tard.",
  },
};

export const entry = defineEntry(
  async ({ input, output, args, langParser }) => {
    const getLang = langParser.createGetLang(langs);
    const prompt = args.join(" ").trim();

    if (!prompt) return output.reply(getLang("noPrompt"));

    const processingMsg = await output.reply(getLang("processing"));

    const imgPath = path.join(__dirname, "cache", `${Date.now()}_nanobanana.jpg`);
    const seed = 12345;

    try {
      const apiURL = `https://dev.oculux.xyz/api/nanobanana?prompt=${encodeURIComponent(
        prompt
      )}&seed=${seed}`;
      const res = await axios.get(apiURL, { responseType: "arraybuffer" });

      await fs.ensureDir(path.dirname(imgPath));
      await fs.writeFile(imgPath, Buffer.from(res.data, "binary"));
      await output.unsend(processingMsg.messageID);

      await output.reply({
        body: getLang("success", { prompt }),
        attachment: fs.createReadStream(imgPath),
      });
    } catch (err) {
      console.error("Erreur API NanoBanana :", err);
      await output.unsend(processingMsg.messageID);
      await output.reply(getLang("error"));
    } finally {
      if (await fs.pathExists(imgPath)) {
        await fs.remove(imgPath);
      }
    }
  }
);
