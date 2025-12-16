// CommandFiles/commands/nhentai.ts

import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

export const meta: CommandMeta = {
  name: "nhentai",
  description: "Search nhentai doujins",
  author: "Christus dev AI",
  version: "1.0.0",
  usage: "{prefix}{name} <search term>",
  category: "Media",
  role: 0,
  noPrefix: false,
  waitingTime: 5,
  requirement: "3.0.0",
  otherNames: ["nh", "n-hentai"],
  icon: "📚",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "Astral • NHentai Search 🌌",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  en: {
    noQuery: "Please provide a search query!\nExample: {prefix}nhentai 1",
    noResults: "No nhentai results found for this query!",
    error: "Error fetching nhentai data: %1",
  },
};

async function fetchNhentai(query: string) {
  const url = `https://arychauhann.onrender.com/api/nhentai?query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  return await res.json();
}

export const entry = defineEntry(async ({ input, output, args, langParser }) => {
  const getLang = langParser.createGetLang(langs);
  const query = args.join(" ").trim();

  if (!query) return output.reply(getLang("noQuery"));

  try {
    const data = await fetchNhentai(query);
    if (!data || Object.keys(data).length === 0) return output.reply(getLang("noResults"));

    const results = Object.values(data).filter((v: any) => v.title).slice(0, 5);
    if (!results.length) return output.reply(getLang("noResults"));

    let message = `Astral • NHentai Results 🌌\n`;
    results.forEach((item: any, i: number) => {
      message += `\n${i + 1}. ${item.title}`;
    });

    const messageInfo = await output.reply(message);

    input.setReply(messageInfo.messageID, {
      key: "nhentai",
      id: input.senderID,
      results,
    });
  } catch (err: any) {
    output.reply(getLang("error", err.message));
  }
});

export async function reply({
  input,
  output,
  repObj,
}: CommandContext & { repObj: { id: string; results: any[] } }) {
  const { id, results } = repObj;
  if (!results || input.senderID !== id) return;

  const selection = parseInt(input.body);
  if (isNaN(selection) || selection < 1 || selection > results.length)
    return output.reply("Please select a valid number!");

  const item = results[selection - 1];

  output.reply({
    body: `📚 ${item.title}\n🔗 Link: ${item.link}`,
    attachment: await global.utils.getStreamFromURL(
      item.imgSrc.startsWith("//") ? `https:${item.imgSrc}` : item.imgSrc
    ),
  });

  input.delReply(repObj.key);
}
