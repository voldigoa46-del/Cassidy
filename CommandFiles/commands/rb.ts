// CommandFiles/commands/realbooru.ts

import moment from "moment-timezone";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

export const meta: CommandMeta = {
  name: "realbooru",
  description: "Search for NSFW images on RealBooru",
  author: "Christus dev AI",
  version: "1.0.0",
  usage: "{prefix}{name} <query>",
  category: "Media",
  role: 0,
  noPrefix: false,
  waitingTime: 5,
  requirement: "3.0.0",
  otherNames: ["rb", "booru"],
  icon: "🖼️",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "Astral • RealBooru 🌌",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  en: {
    noQuery: "Please provide a search query!\nExample: {prefix}realbooru 1girl",
    noResults: "No images found for this query!",
    invalidSelection: "Please select a valid number between 1 and 5!",
    error: "Error fetching images: %1",
  },
};

async function fetchImages(query: string): Promise<any[]> {
  const apiUrl = `https://zetbot-page.onrender.com/api/realbooru?query=${encodeURIComponent(
    query
  )}&limit=5`;
  const response = await fetch(apiUrl);
  const data = await response.json();
  const images = Object.values(data).filter((v: any) => v?.image);
  return images.slice(0, 5);
}

function formatImageList(results: any[]) {
  const timestamp = moment().tz("Asia/Manila").format("MMMM D, YYYY h:mm A");
  const list = results
    .map((img, i) => ` • ${i + 1}. ${img.title.split(",")[0] || "Untitled"}`)
    .join("\n");

  return `${UNISpectra.charm} Temporal Coordinates
 • 📅 ${timestamp}
${UNISpectra.standardLine}
${UNISpectra.charm} RealBooru Search Results
${list}
${UNISpectra.standardLine}
${UNISpectra.charm} Reply with a number (1-5) to select
${UNISpectra.charm} CassidyAstral-Midnight 🌃 ${UNISpectra.charm}
[ Transmission from Astral Command ]`;
}

export const entry = defineEntry(
  async ({ input, output, args, langParser }) => {
    const getLang = langParser.createGetLang(langs);
    const query = args.join(" ").trim();

    if (!query) return output.reply(getLang("noQuery"));

    try {
      const results = await fetchImages(query);

      if (!results || results.length === 0) return output.reply(getLang("noResults"));

      const messageInfo = await output.reply(formatImageList(results));

      input.setReply(messageInfo.messageID, {
        key: "realbooru",
        id: input.senderID,
        results,
      });
    } catch (error: any) {
      output.reply(getLang("error", error.message));
    }
  }
);

export async function reply({
  input,
  output,
  repObj,
  detectID,
  langParser,
}: CommandContext & { repObj: { id: string; results: any[] } }) {
  const getLang = langParser.createGetLang(langs);
  const { id, results } = repObj;

  if (input.senderID !== id || !results) return;

  const selection = parseInt(input.body);
  if (isNaN(selection) || selection < 1 || selection > results.length) {
    return output.reply(getLang("invalidSelection"));
  }

  const selected = results[selection - 1];
  input.delReply(String(detectID));

  output.reply({
    body: `${UNISpectra.charm} Selected Image\n • Title: ${
      selected.title.split(",")[0] || "Untitled"
    }\n • Source: ${selected.url}`,
    attachment: await global.utils.getStreamFromURL(selected.image),
  });
}
