import axios from "axios";
import fs from "fs";
import path from "path";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

/* ================= META ================= */

export const meta: CommandMeta = {
  name: "nude",
  aliases: ["nudepic"],
  author: "Christus Dev AI | Redwan API",
  version: "1.0.0",
  description: "Fetch a random image from Nude API",
  category: "AI",
  usage: "{prefix}{name}",
  role: 2,
  waitingTime: 5,
  icon: "🖼️",
  noLevelUI: true,
};

/* ================= STYLE ================= */

export const style: CommandStyle = {
  title: "🖼️ Christus • Nude API",
  titleFont: "bold",
  contentFont: "fancy",
};

/* ================= LANGS ================= */

export const langs = {
  en: {
    generating: "🖼️ | Fetching image, please wait...",
    generateFail: "❌ | Failed to fetch image.",
  },
};

/* ================= CONSTANTS ================= */

const API_URL = "http://65.109.80.126:20511/api/nude";
const CACHE_DIR = path.join(__dirname, "tmp");

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/* ================= ENTRY ================= */

export const entry = defineEntry(
  async ({ output, langParser }) => {
    const t = langParser.createGetLang(langs);

    const waitMsg = await output.reply(t("generating"));

    try {
      const { data } = await axios.get(API_URL, { timeout: 60000 });

      if (!data?.image) throw new Error("Invalid API response");

      const imgBuffer = await axios.get(data.image, {
        responseType: "arraybuffer",
        timeout: 60000,
      });

      const filePath = path.join(
        CACHE_DIR,
        `nude_${Date.now()}.jpg`
      );

      fs.writeFileSync(filePath, imgBuffer.data);

      await output.unsend(waitMsg.messageID);

      await output.reply({
        body: "✅ Image fetched successfully!",
        attachment: fs.createReadStream(filePath),
      });

      fs.unlinkSync(filePath);
    } catch (err: any) {
      console.error("Nude Command Error:", err.message || err);
      await output.unsend(waitMsg.messageID);
      output.reply(t("generateFail"));
    }
  }
);
