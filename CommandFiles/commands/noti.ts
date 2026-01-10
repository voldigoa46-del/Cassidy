// @ts-check
import { UNIRedux, UNISpectra } from "@cassidy/unispectra";

/**
 * Fonction pour transformer le texte en gras Sans-Serif (Police Cool)
 */
const toBoldSans = (str: string) => {
  const normal = "";
  const boldSans = "";
  return str.split('').map(c => {
    const index = normal.indexOf(c);
    return index !== -1 ? boldSans.split('')[index] : c;
  }).join('');
};

export const meta = {
  name: "notification",
  version: "3.0.0",
  otherNames: ["notify", "noti"],
  author: "Christus | help by liane",
  description: "Diffusion ultime : Nom du groupe dynamique, Tag Admin, Heure CI.",
  usage: "{prefix}notification [message]",
  category: "Owner",
  role: 2,
  waitingTime: 10,
  fbOnly: true,
  icon: "📡",
};

export const style = {
  title: "📡 𝗚𝗟𝗢𝗕𝗔𝗟 𝗧𝗥𝗔𝗡𝗦𝗠𝗜𝗦𝗦𝗜𝗢𝗡",
  titleFont: "bold",
  contentFont: "fancy",
};

export async function entry({ api, event, input, output, args }) {
  const messageContent = args.join(" ");
  const senderID = event.senderID;

  // Sécurité : message vide
  if (!messageContent && input.attachments.length === 0 && !input.messageReply) {
    return output.reply(`❌ **Erreur** : Le message est vide.`);
  }

  try {
    // 1. Récupération des infos Admin (Nom réel pour le tag)
    const userInfo = await api.getUserInfo(senderID);
    const realName = userInfo[senderID]?.name || "Administrateur";

    // 2. Configuration Date & Heure (Séparés et Fuseau CI)
    const dateOptions: Intl.DateTimeFormatOptions = { timeZone: "Africa/Abidjan", day: "2-digit", month: "2-digit", year: "numeric" };
    const timeOptions: Intl.DateTimeFormatOptions = { timeZone: "Africa/Abidjan", hour: "2-digit", minute: "2-digit", hour12: false };
    
    const currentDate = new Intl.DateTimeFormat("fr-FR", dateOptions).format(new Date());
    const currentTime = new Intl.DateTimeFormat("fr-FR", timeOptions).format(new Date());

    // 3. Récupération des groupes
    const threadList = await api.getThreadList(400, null, ["INBOX"]);
    const groups = threadList.filter(t => t.isGroup && t.isSubscribed && t.threadID !== event.threadID);

    if (groups.length === 0) return output.reply("🏜️ Aucun groupe trouvé.");

    // 4. Préparation des pièces jointes (Images/Vidéos)
    const attachments = [
      ...input.attachments,
      ...(input.messageReply?.attachments || [])
    ].filter(item => ["photo", "video", "audio", "animated_image"].includes(item.type));

    // 5. Interface de lancement
    await output.reply(
      `📡 **INITIALISATION DU SYSTÈME**\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👤 Admin : ${realName}\n` +
      `🎯 Cibles : ${groups.length} groupes\n` +
      `🌍 Zone : Abidjan (${currentTime})\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🚀 Envoi en cours...`
    );

    let success = 0;
    let failed = 0;

    // 6. BOUCLE D'ENVOI (Message personnalisé par groupe)
    for (const group of groups) {
      try {
        const groupName = group.name || "Groupe Inconnu";
        const tagName = `@${realName}`;

        // Construction du message unique pour ce groupe
        const broadcastBody = 
          `╔════════════════╗\n` +
          `   📢 ${toBoldSans("𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡")}\n` +
          `╚════════════════╝\n\n` +
          
          `${messageContent}\n\n` +
          
          `━━━━━━━━━━━━━━━━━━\n` +
          `🔰 ${toBoldSans("Groupe")} : ${groupName}\n` + // NOM DU GROUPE ICI
          `👤 ${toBoldSans("Admin")} : ${tagName}\n` + // TAG DE L'ADMIN ICI
          `📅 ${toBoldSans("Date")} : ${currentDate}\n` +
          `🕒 ${toBoldSans("Heure")} : ${currentTime} (CI)\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `⚠️ ${toBoldSans("écrit #supportgc pour rejoindre le groupe du bot.")}`;

        const msgObject = {
          body: broadcastBody,
          mentions: [{ tag: tagName, id: senderID }],
          attachment: attachments.length > 0 ? attachments : undefined
        };

        await api.sendMessage(msgObject, group.threadID);
        success++;
        
        // Délai anti-spam (800ms)
        await new Promise(res => setTimeout(res, 800));

      } catch (e) {
        failed++;
      }
    }

    // 7. Rapport Final
    const finalReport = 
      `🏁 ${toBoldSans("𝗥𝗔𝗣𝗣𝗢𝗥𝗧 𝗙𝗜𝗡𝗔𝗟")}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `✅ Reçus : ${success}\n` +
      `❌ Échecs : ${failed}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `✨ Opération terminée avec succès.`;

    return output.reply(finalReport);

  } catch (err) {
    console.error(err);
    return output.error("Erreur critique du système de diffusion.");
  }
}
