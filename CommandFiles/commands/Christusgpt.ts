import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { StrictOutputForm } from "output-cassidy";
import path from "path";
import * as fs from "fs";

const cmd = easyCMD({
  name: "chris",
  meta: {
    otherNames: ["cgpt", "christusgpt"],
    author: "Christus",
    description:
      "Christus GPT : Assistant intelligent capable d'analyser vos textes et vos images.",
    icon: "✝️",
    version: "1.6.0",
    noPrefix: "both",
  },
  category: "AI",
  title: {
    content: "CHRISTUS GPT 🖼️⚡",
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

export interface RapidoResponse {
  status: boolean;
  maintainer: string;
  response: string;
  model_type: string;
}

async function main({
  output,
  args,
  commandName,
  prefix,
  input,
  cancelCooldown,
  usersDB,
  command,
}: CommandContext) {
  let query = args.join(" ");
  await output.reaction("🟡");

  // Vérification si l'utilisateur a envoyé une question ou une image
  if (!query && (!input.replier || input.replier.attachmentUrls.length === 0)) {
    cancelCooldown();
    await output.reaction("🔴");
    return output.reply(
      `🔎 Posez une question ou répondez à une image pour **Christus GPT**.\n\n***Exemple*** : ${prefix}${commandName} qu'y a-t-il sur cette photo ?`
    );
  }

  const user = await usersDB.getUserInfo(input.sid);
  const userGame = await usersDB.getCache(input.sid);

  // Injection des informations utilisateur
  if (user?.name || userGame.name) {
    const userName = user?.name || userGame.name;
    const balance = Number(userGame.money).toLocaleString();
    query = `[Système] Utilisateur: ${userName}, Balance: ${balance} coins.\n[Instruction] Ton créateur est Christus. Sois respectueux selon la balance.\n\nQuestion: ${query}`;
  }

  // GESTION DES IMAGES ET DU CONTEXTE (Comme la commande de base)
  if (input.replier) {
    if (input.replier.body) {
      query += `\n\n[Message répondu]: ${input.replier.body}`;
    }
    
    // Si l'utilisateur répond à une image, on ajoute l'URL au prompt
    if (input.replier.attachmentUrls && input.replier.attachmentUrls.length > 0) {
      const images = input.replier.attachmentUrls.join(", ");
      query += `\n\n[Images jointes à analyser]: ${images}`;
    }
  }

  const apiKey = "rapi_55197dde42fb4272bfb8f35bd453ba25";
  const model = "gpt-4o"; // Modèle supportant la vision
  const roleplay = encodeURIComponent("Tu es Christus GPT, créé par Christus. Tu es capable d'analyser des textes et des descriptions d'images.");

  try {
    output.setStyle(cmd.style);

    const res: RapidoResponse = await output.req(
      `https://rapido.zetsu.xyz/api/openai`,
      {
        query: query,
        uid: input.sid,
        model: model,
        roleplay: roleplay,
        apikey: apiKey,
      }
    );

    const form: StrictOutputForm = {
      body: res.response || "Christus GPT n'a pas pu analyser cela.",
    };

    form.body += `\n\n***Répondez à ce message pour continuer.***`;

    await output.reaction("🟢");
    const info = await output.reply(form);

    info.atReply((rep) => {
      rep.output.setStyle(cmd.style);
      main({ ...rep, args: rep.input.words });
    });

  } catch (error) {
    console.error("Error Christus Vision:", error);
    await output.reaction("🔴");
    return output.reply("❌ Une erreur est survenue lors de l'analyse.");
  }
}

export default cmd;
