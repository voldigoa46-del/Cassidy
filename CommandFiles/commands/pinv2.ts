import axios from "axios";
import fs from "fs";
import path from "path";
import { defineEntry } from "@cass/define";

/* ================= META ================= */

export const meta: CommandMeta = {
  name: "pinterestv2",
  otherNames: ["pinv2", "pintv2"],
  author: "Christus",
  version: "1.0.0",
  description: "Search images from Pinterest",
  category: "Search",
  usage: "{prefix}{name} <query>",
  role: 0,
  waitingTime: 5,
  icon: "📌",
  noLevelUI: true,
};

/* ================= STYLE ================= */

export const style: CommandStyle = {
  title: "📌 Christus • Pinterest Search",
  titleFont: "bold",
  contentFont: "fancy",
};

/* ================= LANGS ================= */

export const langs = {
  en: {
    noQuery: "❌ | Please provide a search query.",
    fetchFail: "❌ | Failed to fetch Pinterest results.",
    noResult: "❌ | No results found.",
  },
};

/* ================= CONSTANT ================= */

const API_ENDPOINT =
  "https://delirius-apiofc.vercel.app/search/pinterestv2";

/* ================= ENTRY ================= */

export const entry = defineEntry(
  async ({ input, output, args, langParser }) => {
    const t = langParser.createGetLang(langs);

    const query = args.join(" ");
    if (!query) return output.reply(t("noQuery"));

    try {
      const { data } = await axios.get(API_ENDPOINT, {
        params: { text: query },
        timeout: 60000,
      });

      if (!data?.status || !Array.isArray(data.data)) {
        return output.reply(t("fetchFail"));
      }

      const results = data.data.slice(0, 6);
      if (!results.length) return output.reply(t("noResult"));

      let message = `📌 **Pinterest results for:** ${query}\n`;

      const attachments: any[] = [];

      for (const item of results) {
        message += `
━━━━━━━━━━━━━━
👤 **${item.name}** (@${item.username})
❤️ ${item.likes} | 👥 ${item.followers}
📅 ${item.created_at}
`;

        try {
          const imgRes = await axios.get(item.image, {
            responseType: "stream",
          });

          const tmpDir = path.join(__dirname, "tmp");
          if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

          const filePath = path.join(
            tmpDir,
            `pin_${Date.now()}_${Math.random()}.jpg`
          );

          const writer = fs.createWriteStream(filePath);
          imgRes.data.pipe(writer);

          await new Promise((res) => writer.on("finish", res));

          attachments.push(fs.createReadStream(filePath));
        } catch {}
      }

      await output.reply({
        body: message.trim(),
        attachment: attachments,
      });

      // cleanup
      attachments.forEach((a: any) => {
        if (fs.existsSync(a.path)) fs.unlinkSync(a.path);
      });
    } catch (err) {
      console.error("PINTEREST ERROR:", err);
      return output.reply(t("fetchFail"));
    }
  }
);
