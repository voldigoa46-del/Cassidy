// @ts-check
import { UNIRedux } from "@cassidy/unispectra";

export const meta = {
  name: "leave",
  author: "Christus",
  version: "4.0.0",
  description: "Envoie un message lorsqu'un membre quitte ou est expulsé du groupe.",
  supported: "^4.0.0",
  order: 10,
  type: "plugin",
  after: ["input", "output"],
};

/**
 * @param {CommandContext} obj
 */
export async function use(obj) {
  const { event, api, output, threadsData, usersData } = obj;

  // Filtrer uniquement les messages de départ/expulsion
  if (event.logMessageType !== "log:unsubscribe") {
    return obj.next();
  }

  const { threadID } = event;
  const { leftParticipantFbId } = event.logMessageData;
  const botID = api.getCurrentUserID();

  // Si c'est le bot qui est éjecté, on ne fait rien
  if (leftParticipantFbId === botID) {
    return obj.next();
  }

  try {
    const thread = await threadsData.get(threadID);
    
    // Vérifier si le message de départ est activé dans les paramètres du groupe
    if (!thread?.settings?.sendLeaveMessage) {
      return obj.next();
    }

    const userName = await usersData.getName(leftParticipantFbId);
    const threadName = thread.threadName || "ce groupe";
    
    // Logique de session temporelle
    const hours = new Date().getHours();
    let session = "soir";
    if (hours <= 10) session = "matin";
    else if (hours <= 12) session = "midi";
    else if (hours <= 18) session = "après-midi";

    // Déterminer le type de départ (volontaire ou kick)
    const type = leftParticipantFbId == event.author ? "a quitté" : "a été expulsé de";

    // Récupération du message personnalisé ou message par défaut
    let leaveMessage = thread.data?.leaveMessage || "{userName} {type} le groupe.";

    // Remplacement des variables
    leaveMessage = leaveMessage
      .replace(/\{userName\}|\{userNameTag\}/g, userName)
      .replace(/\{type\}/g, type)
      .replace(/\{threadName\}|\{boxName\}/g, threadName)
      .replace(/\{time\}/g, `${hours}h`)
      .replace(/\{session\}/g, session);

    const form = {
      body: `📤 | ${leaveMessage}\n${UNIRedux.standardLine}\nBon vent !`,
      mentions: leaveMessage.includes("{userNameTag}") ? [{ tag: userName, id: leftParticipantFbId }] : []
    };

    // Gestion des pièces jointes si configurées
    if (thread.data?.leaveAttachment && Array.isArray(thread.data.leaveAttachment)) {
      // Note: Ici, on suppose que global.utils.drive est accessible ou remplacé par votre système de stream
      try {
        const attachmentPromises = thread.data.leaveAttachment.map(fileId => 
          global.utils.drive.getFile(fileId, "stream")
        );
        const results = await Promise.allSettled(attachmentPromises);
        form.attachment = results
          .filter(r => r.status === "fulfilled")
          .map(r => r.value);
      } catch (e) {
        console.error("Erreur pièces jointes leave:", e);
      }
    }

    return output.replyStyled(form, {
      title: "NOTIFICATION DE DÉPART",
      titleFont: "none",
      contentFont: "none",
    });

  } catch (err) {
    console.error("❌ Error in leave plugin:", err);
  }

  return obj.next();
        }
