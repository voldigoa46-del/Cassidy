import axios from "axios";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

/* ================= META ================= */

export const meta: CommandMeta = {
  name: "nano",
  author: "Christus",
  version: "1.0.0",
  description: "Generate AI images using Nano API",
  category: "AI",
  usage: "{prefix}{name} <prompt> [--seed N] [--ref X] [--ref1 Y]",
  role: 2,
  waitingTime: 5,
  icon: "🧠",
  noLevelUI: true,
};

/* ================= STYLE ================= */

export const style: CommandStyle = {
  title: "🧠 Christus • NANO AI",
  titleFont: "bold",
  contentFont: "fancy",
};

/* ================= LANGS ================= */

export const langs = {
  en: {
    noPrompt: "🧠 | Please provide a prompt.",
    generateFail: "❌ | Image generation failed.",
    badRequest: "🧠 | Bad request. Try a different prompt.",
  },
};

/* ================= CONSTANT ================= */

const API_URL = "https://zetbot-page.onrender.com/api/nano";

/* ================= ENTRY ================= */

export const entry = defineEntry(
  async ({ input, output, args, langParser }) => {
    const t = langParser.createGetLang(langs);

    if (!args.length) return output.reply(t("noPrompt"));

    /* ===== Parse flags ===== */
    let promptParts: string[] = [];
    let seed: string | null = null;
    let ref: string | null = null;
    let ref1: string | null = null;

    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--seed" && args[i + 1]) {
        seed = args[i + 1];
        i++;
      } else if (args[i] === "--ref" && args[i + 1]) {
        ref = args[i + 1];
        i++;
      } else if (args[i] === "--ref1" && args[i + 1]) {
        ref1 = args[i + 1];
        i++;
      } else {
        promptParts.push(args[i]);
      }
    }

    const prompt = promptParts.join(" ");
    if (!prompt) return output.reply(t("noPrompt"));

    /* ===== Build query ===== */
    const params = new URLSearchParams({
      prompt,
    });

    if (seed) params.append("seed", seed);
    if (ref) params.append("ref", ref);
    if (ref1) params.append("ref1", ref1);

    const finalUrl = `${API_URL}?${params.toString()}`;

    const cacheDir = path.join(__dirname, "tmp");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const filePath = path.join(cacheDir, `nano_${Date.now()}.png`);

    /* ===== API Call ===== */
    try {
      const res = await axios.get(finalUrl, {
        responseType: "arraybuffer",
        timeout: 120000,
      });

      fs.writeFileSync(filePath, res.data);

      await output.reply({
        body: "🧠✨ Image generated successfully",
        attachment: fs.createReadStream(filePath),
      });

      fs.unlinkSync(filePath);
    } catch (err: any) {
      if (err.response?.status === 400) {
        return output.reply(t("badRequest"));
      }
      console.error("NANO API ERROR:", err);
      return output.reply(t("generateFail"));
    }
  }
);
