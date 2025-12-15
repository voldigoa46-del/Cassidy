/*
 * @XaviaCMD
 * @Christus
 * Mixtral 8x22b AI Command
 */

import axios from "axios";

const config = {
  name: "mixtral",
  version: "1.0.0",
  permissions: [0],
  noPrefix: "both",
  credits: "Christus",
  description:
    "Interact with Mixtral 8x22b AI via Zetsu API (text-only).",
  category: "AI",
  usages: "[text]",
  cooldown: 3,
};

const style = {
  titleFont: "bold",
  title: "🤖 Mixtral 8x22b",
  contentFont: "fancy",
};

async function onCall({ message, args }) {
  const text = args.join(" ");

  if (!text) {
    return message.reply("❌ Please provide a prompt for Mixtral AI.");
  }

  try {
    const uid = message.senderID;
    const api = `https://zetbot-page.onrender.com/api/mixtral-8x22b?prompt=${encodeURIComponent(
      text
    )}&uid=${uid}`;

    const res = await axios.get(api);

    if (!res.data || !res.data.success) {
      return message.reply("❌ Mixtral API returned an invalid response.");
    }

    message.reply(res.data.response.trim());
  } catch (e: any) {
    message.reply(
      `❌ Error while contacting Mixtral API:\n${e.message}`
    );
  }
}

export default {
  config,
  onCall,
  style,
};
