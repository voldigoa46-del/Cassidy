import axios, { AxiosResponse } from "axios";
import { StrictOutputForm } from "output-cassidy";

const API_URL = "https://haji-mix-api.gleeze.com/api/workers";

const cmd = easyCMD({
  name: "llamas",
  meta: {
    otherNames: ["llama-scout", "llama4-scout", "scout17b"],
    author: "Christus dev AI",
    description: "LLaMA 4 Scout 17B AI – Assistant powered by Gleeze",
    icon: "🤖",
    version: "1.0.0",
    noPrefix: "both",
  },
  title: {
    content: "LLaMA-Scout 17B 🤖",
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

interface LLaMAResponse {
  user_ask: string;
  answer: string;
  model_used: string;
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
    await output.reaction("❌"); // erreur
    return output.reply(
      "❓ Please provide a prompt for LLaMA-Scout 17B.\n\nExample: llamascout Hello!"
    );
  }

  try {
    const params = {
      ask: prompt,
      model: "@cf/meta/llama-4-scout-17b-16e-instruct",
      uid: input.sid || "1",
      roleplay: "",
      max_tokens: 1024,
    };

    const res: AxiosResponse<LLaMAResponse> = await axios.get(API_URL, {
      params,
      timeout: 25_000,
    });

    const answerText = res.data?.answer || "No response from LLaMA-Scout 17B.";

    const form: StrictOutputForm = {
      body:
        `🤖 **LLaMA-Scout 17B**\n\n` +
        `${answerText}\n\n` +
        `***Reply to continue the conversation.***`,
    };

    await output.reaction("✅"); // succès
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
    console.error("LLaMA-Scout API Error:", err?.message || err);
    await output.reaction("❌"); // erreur
    cancelCooldown();
    return output.reply(
      `❌ Failed to connect to LLaMA-Scout 17B AI.\n\nMessage: ${
        err?.message || "Unknown error"
      }`
    );
  }
}

export default cmd;
