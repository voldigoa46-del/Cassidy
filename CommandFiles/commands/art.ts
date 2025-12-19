// CommandFiles/commands/art.ts

import axios from "axios";
import fs from "fs";
import path from "path";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

/* ================= META ================= */

export const meta: CommandMeta = {
  name: "art",
  aliases: ["aiart", "draw"],
  author: "Christus",
  version: "1.0.0",
  description: "Generate AI art from a prompt",
  category: "AI",
  usage: "{prefix}{name} <prompt>",
  role: 0,
  waitingTime: 10,
  icon: "🎨",
  noLevelUI: true,
};

/* ================= STYLE ================= */

export const style: CommandStyle = {
  title: "🎨 Christus • AI Art",
  titleFont: "bold",
  contentFont: "fancy",
};

/* ================= LANGS ================= */

export const langs = {
  fr: {
    noPrompt: "🎨 Veuillez fournir une description pour générer l'image.",
    generating: "🎨 Génération de l'image en cours... ⏳",
    fail: "❌ Impossible de générer l'image. Veuillez réessayer plus tard.",
  },
};

/* ================= CONSTANT ================= */

const API_URL = "https://wildan-suldyir-apis.vercel.app/api/art";

/* ================= ENTRY ================= */

export const entry = defineEntry(
  async ({ output, args, langParser }) => {
    const t = langParser.createGetLang(langs);

    if (!args.length) return output.reply(t("noPrompt"));

    const prompt = args.join(" ");

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const filePath = path.join(cacheDir, `art_${Date.now()}.jpg`);

    try {
      const loadingMsg = await output.reply(t("generating"));

      const { data } = await axios.get(API_URL, {
        params: { prompt },
        responseType: "arraybuffer",
        timeout: 180000,
      });

      fs.writeFileSync(filePath, Buffer.from(data));

      await output.reply({
        body: `${UNISpectra.charm} Prompt:\n${prompt}`,
        attachment: fs.createReadStream(filePath),
      });

      fs.unlinkSync(filePath);

      if (loadingMsg?.messageID) {
        output.unsend(loadingMsg.messageID);
      }
    } catch (err) {
      console.error(err);
      output.reply(t("fail"));
    }
  }
);
