// CommandFiles/commands/imgbb.ts
// @ts-check

import axios from "axios";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";
import moment from "moment-timezone";

/* ================= CONSTANTS ================= */

const CONFIG_URL =
  "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";

/* ================= META ================= */

export const meta: CommandMeta = {
  name: "imgbb",
  description: "Upload une image ou vidéo sur ImgBB",
  author: "ArYAN • TS fixed by Christus",
  version: "1.0.0",
  usage: "imgbb <url> (ou répondre à une image)",
  category: "utility",
  role: 0,
  waitingTime: 2,
  icon: "🖼️",
  noPrefix: true,
};

/* ================= STYLE ================= */

export const style: CommandStyle = {
  title: "ImgBB Uploader 🖼️",
  titleFont: "bold",
  contentFont: "fancy",
};

/* ================= LANG ================= */

export const langs = {
  fr: {
    noInput: "❌ Réponds à une image ou fournis une URL.",
    fetching: "⏳ Récupération de la configuration...",
    uploading: "📤 Upload vers ImgBB en cours...",
    configFail: "❌ Impossible de récupérer la configuration API.",
    uploadFail: "❌ Échec de l'upload vers ImgBB.",
    error: "⚠️ Une erreur est survenue.",
  },
  en: {
    noInput: "❌ Reply to an image or provide a URL.",
    fetching: "⏳ Fetching configuration...",
    uploading: "📤 Uploading to ImgBB...",
    configFail: "❌ Failed to fetch API configuration.",
    uploadFail: "❌ Failed to upload to ImgBB.",
    error: "⚠️ An error occurred.",
  },
};

/* ================= ENTRY ================= */

export const entry = defineEntry(async ({ args, event, output, langParser }) => {
  const getLang = langParser.createGetLang(langs);

  /* ===== MEDIA DETECTION ===== */

  let mediaUrl = "";

  const replyAttachment =
    event.messageReply?.attachments?.[0];

  if (replyAttachment?.url) {
    mediaUrl = replyAttachment.url;
  } else if (args.length > 0) {
    mediaUrl = args.join(" ").trim();
  }

  if (!mediaUrl) {
    return output.reply(getLang("noInput"));
  }

  /* ===== FETCH CONFIG ===== */

  const loadingConfig = await output.reply(
    `${UNISpectra.charm} ${getLang("fetching")}`
  );

  let apiBase: string;

  try {
    const configRes = await axios.get(CONFIG_URL, { timeout: 15000 });
    apiBase = configRes.data?.api;
    if (!apiBase) throw new Error("Missing api field");
  } catch (err) {
    console.error("ImgBB config error:", err);
    await output.unsend(loadingConfig.messageID);
    return output.reply(getLang("configFail"));
  }

  /* ===== UPLOAD ===== */

  await output.unsend(loadingConfig.messageID);

  const timestamp = moment()
    .tz("Asia/Manila")
    .format("MMMM D, YYYY h:mm A");

  const loadingUpload = await output.reply(
    `${UNISpectra.charm} ${getLang("uploading")}\n• 📅 ${timestamp}`
  );

  try {
    const res = await axios.get(
      `${apiBase}/imgbb?url=${encodeURIComponent(mediaUrl)}`,
      { timeout: 30000 }
    );

    const link = res.data?.link;

    if (!link) {
      await output.unsend(loadingUpload.messageID);
      return output.reply(getLang("uploadFail"));
    }

    await output.unsend(loadingUpload.messageID);

    return output.reply({
      body: `✅ ImgBB Upload Successful\n\n🔗 ${link}`,
    });

  } catch (err) {
    console.error("ImgBB upload error:", err);
    await output.unsend(loadingUpload.messageID);
    return output.reply(getLang("error"));
  }
});
