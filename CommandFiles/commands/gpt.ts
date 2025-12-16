mport axios, { AxiosResponse } from "axios";
import { StrictOutputForm } from "output-cassidy";

const API_URL = "https://arychauhann.onrender.com/api/gpt-3.5-turbo";

const cmd = easyCMD({
  name: "gpt",
  meta: {
    otherNames: ["chatgpt", "turbo"],
    author: "Christus dev AI",
    description: "GPT-3.5 Turbo – AI assistant by Aryan Chauhan",
    icon: "🤖",
    version: "1.0.0",
    noPrefix: "both",
  },
  title: {
    content: "GPT-3.5 Turbo 🏂",
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

interface GPT35Choice {
  index: number;
  message: {
    role: string;
    content: string;
    refusal?: any;
    annotations?: any[];
  };
  logprobs?: any;
  finish_reason?: string;
}

interface GPT35Response {
  status: boolean;
  operator: string;
  result: {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: GPT35Choice[];
    usage: any;
    service_tier: string;
    system_fingerprint: string;
  };
  conversationId?: string;
  message?: string;
}

async function main({
  output,
  args,
  input,
  cancelCooldown,
}: CommandContext & { conversationId?: string }) {
  const prompt = args.join(" ").trim();
  await output.reaction("🟡");

  if (!prompt) {
    cancelCooldown();
    await output.reaction("🔴");
    return output.reply(
      "❓ Please provide a message for GPT-3.5 Turbo.\n\nExample: gpt35 Hello!"
    );
  }

  try {
    const params: Record<string, string> = {
      prompt,
      uid: input.sid,
      reset: "",
    };

    // Réutiliser conversationId si existant
    if ((main as any).conversationId) {
      params["uid"] = (main as any).conversationId;
    }

    const res: AxiosResponse<GPT35Response> = await axios.get(API_URL, {
      params,
      timeout: 25_000,
    });

    const answer =
      res.data?.result?.choices?.[0]?.message?.content ||
      res.data?.message ||
      "⚠️ No response from GPT-3.5 Turbo.";

    // stocker conversationId
    if (res.data?.conversationId) {
      (main as any).conversationId = res.data.conversationId;
    }

    const form: StrictOutputForm = {
      body:
        `🤖 **GPT-3.5 Turbo**\n\n` +
        `${answer}\n\n` +
        `***Reply to continue the conversation.***`,
    };

    await output.reaction("🟢");
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
    console.error("GPT-3.5 Turbo API Error:", err?.message || err);
    await output.reaction("🔴");
    cancelCooldown();
    return output.reply(
      `❌ Failed to connect to GPT-3.5 Turbo.\n\nMessage: ${
        err?.message || "Unknown error"
      }`
    );
  }
}

export default cmd;
