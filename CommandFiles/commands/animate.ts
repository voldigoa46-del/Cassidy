import axios from "axios";
import fs from "fs";
import path from "path";
import stream from "stream";
import { promisify } from "util";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

/* ================= META ================= */

export const meta: CommandMeta = {
  name: "animate",
  aliases: ["anim", "genvid"],
  author: "Christus dev AI",
  version: "1.0.0",
  description: "Generate AI animated videos from text prompts",
  category: "AI",
  usage: "{prefix}{name} <prompt>",
  role: 2,
  waitingTime: 30,
  icon: "🎞️",
  noLevelUI: true,
};

/* ================= STYLE ================= */

export const style: CommandStyle = {
  title: "🎞️ Christus • Animate",
  titleFont: "bold",
  contentFont: "fancy",
};

/* ================= LANGS ================= */

export const langs = {
  fr: {
    noPrompt: "⚠️ Veuillez fournir un prompt pour générer une vidéo.\nExemple : /animate un chat qui nage",
    generating: "🎞️ Génération de la vidéo en cours... ⏳",
    fail: "❌ Impossible de générer la vidéo. Veuillez réessayer plus tard.",
  },
};

/* ================= CONSTANTS ================= */

const API_ENDPOINT = "https://metakexbyneokex.fly.dev/animate";
const CACHE_DIR = path.join(__dirname, "cache");
const pipeline = promisify(stream.pipeline);

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

/* ================= ENTRY ================= */

export const entry = defineEntry(async ({ output, args, langParser }) => {
  const t = langParser.createGetLang(langs);

  if (!args.length) return output.reply(t("noPrompt"));

  const prompt = args.join(" ");
  const loadingMsg = await output.reply(t("generating"));

  let videoPath: string | null = null;

  try {
    const { data } = await axios.get(API_ENDPOINT, {
      params: { prompt },
      timeout: 120000,
    });

    if (!data?.success || !data?.video_urls?.length) {
      throw new Error("No video returned");
    }

    const videoUrl: string = data.video_urls[0];
    const fileName = `animate_${Date.now()}_${Math.random().toString(36).slice(2)}.mp4`;
    videoPath = path.join(CACHE_DIR, fileName);

    const videoStream = await axios.get(videoUrl, {
      responseType: "stream",
      timeout: 120000,
    });

    await pipeline(videoStream.data, fs.createWriteStream(videoPath));

    await output.reply({
      body:
        `${UNISpectra.charm} **Vidéo générée avec succès**\n` +
        `📝 Prompt : ${prompt}`,
      attachment: fs.createReadStream(videoPath),
    });

    if (loadingMsg?.messageID) output.unsend(loadingMsg.messageID);
  } catch (err) {
    console.error("ANIMATE ERROR:", err);
    if (loadingMsg?.messageID) output.unsend(loadingMsg.messageID);
    output.reply(t("fail"));
  } finally {
    if (videoPath && fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }
  }
});
