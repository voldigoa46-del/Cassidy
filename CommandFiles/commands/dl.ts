import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { defineEntry } from "@cass/define";

/* ================= META ================= */

export const meta: CommandMeta = {
  name: "autodl",
  description: "Téléchargement automatique de YouTube, Spotify, Imgur, Pinterest, etc.",
  version: "3.4.0",
  author: "Christus",
  icon: "📥",
  category: "Media",
  role: 0,
  noPrefix: true,
};

export const style: CommandStyle = {
  title: "📥 Auto Downloader",
  titleFont: "bold",
  contentFont: "fancy",
};

/* ================= UTILS & CONFIG ================= */

const CACHE_DIR = path.join(__dirname, "cache");

const patterns = {
  youtube: /(youtube\.com|youtu\.be)/i,
  spotify: /(spotify\.com|spotify\.link)/i,
  images: /(imgur\.com|i\.imgur\.com|pinterest\.com|pin\.it|imgbb\.com|ibb\.co)/i,
};

function getMediaType(url: string) {
  return {
    isYT: patterns.youtube.test(url),
    isSpotify: patterns.spotify.test(url),
    isImg: patterns.images.test(url),
  };
}

async function handleDownload(url: string, output: any) {
  const type = getMediaType(url);
  output.react("⏳");

  try {
    const apiUrl = `https://downvid.onrender.com/api/download?url=${encodeURIComponent(url)}`;
    const { data: res } = await axios.get(apiUrl, { timeout: 60000 });

    if (!res || res.status !== "success") {
      return output.react("❌");
    }

    const mediaInfo = res?.data?.data || {};
    const videoUrl = res.video || mediaInfo.nowm || null;
    const audioUrl = res.audio || null;
    const imageUrl = res.image || mediaInfo.image || null;

    let downloads: { url: string; ext: string }[] = [];
    let header = "✅ Downloaded\n\n";

    // Logique de sélection du média
    if (type.isSpotify) {
      if (!audioUrl) throw new Error();
      downloads.push({ url: audioUrl, ext: "mp3" });
      header = "✅ Spotify Audio 🎧\n\n";
    } 
    else if (type.isYT) {
      if (!videoUrl) throw new Error();
      downloads.push({ url: videoUrl, ext: "mp4" });
      header = "✅ YouTube Video 🎬\n\n";
    } 
    else if (type.isImg) {
      const target = imageUrl || videoUrl;
      if (!target) throw new Error();
      downloads.push({ url: target, ext: target.includes(".mp4") ? "mp4" : "jpg" });
      header = "✅ Image/Media 🖼️\n\n";
    } 
    else {
      if (videoUrl) downloads.push({ url: videoUrl, ext: "mp4" });
      else if (audioUrl) downloads.push({ url: audioUrl, ext: "mp3" });
      else if (imageUrl) downloads.push({ url: imageUrl, ext: "jpg" });
      else throw new Error();
    }

    // Préparation des fichiers
    await fs.ensureDir(CACHE_DIR);
    const streams: fs.ReadStream[] = [];
    const tempFiles: string[] = [];

    for (const item of downloads) {
      const filePath = path.join(CACHE_DIR, `autodl_${Date.now()}_${Math.random().toString(36).slice(2)}.${item.ext}`);
      const response = await axios.get(item.url, { responseType: "arraybuffer", timeout: 120000 });
      await fs.writeFile(filePath, response.data);
      streams.push(fs.createReadStream(filePath));
      tempFiles.push(filePath);
    }

    // Envoi de la réponse
    const body = `${header}📌 Titre: ${mediaInfo.title || "Media"}`;
    await output.replyStyled({ body, attachment: streams }, style);

    // Nettoyage
    for (const file of tempFiles) {
      if (await fs.pathExists(file)) await fs.remove(file);
    }
    output.react("✅");

  } catch (error) {
    console.error("AutoDL Error:", error);
    output.react("❌");
  }
}

/* ================= ENTRY ================= */

export const entry = defineEntry(async ({ args, output }) => {
  const input = args.join(" ");
  const match = input.match(/https?:\/\/\S+/i);
  
  if (!match) return output.reply("❌ Veuillez fournir un lien valide.");
  await handleDownload(match[0], output);
});

/* ================= EVENT ================= */

export const event = async ({ event, output }: CommandContext) => {
  // On ignore si c'est un message système ou si pas de corps de texte
  if (!event.body) return;

  const match = event.body.match(/https?:\/\/\S+/i);
  if (match) {
    await handleDownload(match[0], output);
  }
};
