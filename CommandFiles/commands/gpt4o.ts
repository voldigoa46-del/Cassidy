import axios, { AxiosResponse } from "axios";
import { StrictOutputForm } from "output-cassidy";

const API_URL = "https://redwans-apis.gleeze.com/api/gpt4o";

const cmd = easyCMD({
  name: "gpt4o",
  meta: {
    otherNames: ["4o", "gpt4oai", "gpt_4o"],
    author: "Christus dev AI",
    description: "GPT-4o – Conversational AI by OpenAI",
    icon: "⚡",
    version: "1.0.0",
    noPrefix: "both",
  },
  title: {
    content: "GPT-4o ⚡",
    text_font: "bold",
    line_bottom: "default",
  },
  content: {
    content: null,
    text_font: "none",
    line_bottom: "hidden",
  },
  run(ctx) {
    return main(ctx);
  },
});

interface GPT4oResponse {
  status: string;
  reply?: string;
}

async function main({
  output,
  args,
  input,
  cancelCooldown,
}: CommandContext & { uid?: string }) {
  const prompt = args.join(" ").trim();
  await output.reaction("⏳"); // début

  if (!prompt) {
    cancelCooldown();
    await output.reaction("❌");
    return output.reply(
      "❓ Please provide a prompt for GPT-4o.\n\nExample: gpt4o Hello!"
    );
  }

  try {
    const params = {
      uid: input.sid,
      msg: prompt,
    };

    const res: AxiosResponse<GPT4oResponse> = await axios.get(API_URL, {
      params,
      timeout: 25_000,
    });

    if (!res.data || res.data.status !== "success" || !res.data.reply) {
      throw new Error("Invalid API response");
    }

    const form: StrictOutputForm = {
      body:
        `⚡ **GPT-4o**\n\n` +
        `${res.data.reply}\n\n` +
        `***Reply to continue the conversation.***`,
    };

    await output.reaction("✅");
    const info = await output.reply(form);

    // 🔁 Conversation continue
    info.atReply((rep) => {
      rep.output.setStyle(cmd.style);
      main({
        ...rep,
        args: rep.input.words,
      });
    });
  } catch (err: any) {
    console.error("GPT-4o API Error:", err?.message || err);
    await output.reaction("❌");
    cancelCooldown();
    return output.reply(
      `❌ Failed to connect to GPT-4o.\n\nMessage: ${
        err?.message || "Unknown error"
      }`
    );
  }
}

export default cmd;
