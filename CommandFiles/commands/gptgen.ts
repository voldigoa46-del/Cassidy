// @ts-check

/**
 * @type {CommandMeta}
 */
export const meta = {
  name: "gptgen",
  description: "Générer ou éditer une image avec GPT Image",
  author: "Christus dev AI",
  version: "1.0.0",
  usage:
    "{prefix}{name} <prompt> [--seed <true|false|number>] [--width <px>] [--height <px>]\n" +
    "• Générer : gptgen a futuristic city\n" +
    "• Éditer : répondre à une image avec gptgen remove background\n" +
    "• Options : gptgen a cat --seed 123 --width 1024 --height 768",
  category: "AI-Image",
  permissions: [0],
  waitingTime: 20,
  otherNames: ["gptimg"],
  icon: "🖼️",
  noWeb: true,
};

import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { defineEntry } from "@cass/define";

const API_ENDPOINT = "https://dev.oculux.xyz/api/gptimage";
const CACHE_DIR = path.join(process.cwd(), "cache", "gptgen");

function extractFlag(prompt: string, flag: string, regex: RegExp) {
  const match = prompt.match(regex);
  if (!match || !match[1]) return { value: null, prompt };
  return {
    value: match[1],
    prompt: prompt.replace(match[0], "").trim(),
  };
}

async function downloadImage(url: string, filename: string) {
  const filePath = path.join(CACHE_DIR, filename);
  const response = await axios.get(url, {
    responseType: "stream",
    timeout: 90_000,
  });

  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);

  await new Promise<void>((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  return filePath;
}

export const entry = defineEntry(async ({ args, output, event, message }) => {
  let prompt = args.join(" ").trim();
  let refUrl: string | null = null;

  if (
    event.type === "message_reply" &&
    event.messageReply?.attachments?.[0] &&
    ["photo", "image"].includes(event.messageReply.attachments[0].type)
  ) {
    refUrl = event.messageReply.attachments[0].url;
  }

  if (!prompt) {
    return output.reply("❌ Veuillez fournir un prompt ou répondre à une image.");
  }

  if (!/^[\x00-\x7F]*$/.test(prompt)) {
    return output.reply("❌ Le prompt doit être en anglais.");
  }

  // Flags
  let seed: string | number | boolean | null = null;
  let width: number | null = null;
  let height: number | null = null;

  let result;

  result = extractFlag(prompt, "--seed", /--seed\s+([^\s]+)/i);
  prompt = result.prompt;
  if (result.value !== null) {
    if (result.value === "true") seed = true;
    else if (result.value === "false") seed = false;
    else if (!isNaN(Number(result.value))) seed = Number(result.value);
  }

  result = extractFlag(prompt, "--width", /--width\s+(\d+)/i);
  prompt = result.prompt;
  if (result.value) width = Number(result.value);

  result = extractFlag(prompt, "--height", /--height\s+(\d+)/i);
  prompt = result.prompt;
  if (result.value) height = Number(result.value);

  if (!prompt) {
    return output.reply("❌ Prompt invalide après analyse des options.");
  }

  await fs.ensureDir(CACHE_DIR);
  await message.react("⏳");

  try {
    let apiUrl = `${API_ENDPOINT}?prompt=${encodeURIComponent(prompt)}`;

    if (refUrl) apiUrl += `&ref=${encodeURIComponent(refUrl)}`;
    if (seed !== null) apiUrl += `&seed=${seed}`;
    if (width !== null) apiUrl += `&width=${width}`;
    if (height !== null) apiUrl += `&height=${height}`;

    const imgPath = await downloadImage(apiUrl, `gptgen_${Date.now()}.png`);

    await message.react("✅");
    await output.reply({
      body: `🖼️ GPT Image ${refUrl ? "éditée" : "générée"} ✨`,
      attachment: fs.createReadStream(imgPath),
    });

    await fs.unlink(imgPath).catch(() => {});
  } catch (err: any) {
    console.error("GPTGen Command Error:", err);
    await message.react("❌");

    let errorMsg = "Erreur lors de la génération de l'image.";
    if (err.code === "ETIMEDOUT") errorMsg = "⏱️ Délai dépassé, essayez un prompt plus simple.";
    if (err.response?.status === 404) errorMsg = "❌ API introuvable (404).";

    output.reply(`❌ ${errorMsg}`);
  }
});
