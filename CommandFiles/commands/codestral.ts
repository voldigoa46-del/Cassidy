import axios, { AxiosResponse } from "axios";
import { StrictOutputForm } from "output-cassidy";

const API_URL = "https://zetbot-page.onrender.com/api/Codestral-latest";

const cmd = easyCMD({
  name: "codestral",
  meta: {
    otherNames: ["zetsu", "codai"],
    author: "Christus",
    description: "Codestral AI – Fast assistant powered by Zetsu",
    icon: "🤖",
    version: "1.0.0",
    noPrefix: "both",
  },
  title: {
    content: "Codestral AI 🤖",
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

interface CodestralResponse {
  operator: string;
  success: boolean;
  response?: string;
}

async function main({
  output,
  args,
  input,
  cancelCooldown,
}: CommandContext & { uid?: string }) {
  const prompt = args.join(" ").trim();
  await output.reaction("🟡");

  if (!prompt) {
    cancelCooldown();
    await output.reaction("🔴");
    return output.reply(
      "❓ Please provide a prompt.\n\nExample: codestral Hello there!"
    );
  }

  try {
    const params = {
      prompt,
      uid: input.sid,
    };

    const res: AxiosResponse<CodestralResponse> = await axios.get(API_URL, {
      params,
      timeout: 20_000,
    });

    const answer = res.data?.response || "⚠️ No response from Codestral AI.";

    const form: StrictOutputForm = {
      body:
        `🤖 **Codestral AI**\n\n` +
        `${answer}\n\n` +
        `***Reply to continue the conversation.***`,
    };

    await output.reaction("🟢");
    const info = await output.reply(form);

    // 🔁 conversation continue
    info.atReply((rep) => {
      rep.output.setStyle(cmd.style);
      main({
        ...rep,
        args: rep.input.words,
      });
    });
  } catch (err: any) {
    console.error("Codestral AI API Error:", err?.message || err);
    await output.reaction("🔴");
    cancelCooldown();
    return output.reply(
      `❌ Failed to connect to Codestral AI.\n\nMessage: ${
        err?.message || "Unknown error"
      }`
    );
  }
}

export default cmd;
