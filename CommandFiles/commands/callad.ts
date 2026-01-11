// CommandFiles/commands/callad.ts

const MEDIA_TYPES = ["photo", "video", "audio", "animated_image", "file"];

const LINE = "━━━━━━━━━━━━━━━━━━";
const TIME = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export default easyCMD({
  name: "callad",
  description: "Secure uplink to Administration HQ. Live chat enabled.",
  title: "📡 𝗦𝗲𝗰𝘂𝗿𝗲 𝗨𝗽𝗹𝗶𝗻𝗸",
  category: "Support",
  contentFont: "fancy",
  icon: "📡",
  meta: {
    cooldown: 180,
    otherNames: ["calladmin"],
    usage: "callad <message>",
    fbOnly: true,
    author: "Christus",
  },

  async run({ output, input, args, userName, cancelCooldown }) {
    const message = args.join(" ");
    const userID = input.sid;
    const threadID = input.tid;

    if (!message && (!input.attachments || input.attachments.length === 0)) {
      cancelCooldown();
      return output.replyStyled(
        `╭🚫 𝗔𝗰𝘁𝗶𝗼𝗻 𝗥𝗲𝗾𝘂𝗶𝗿𝗲𝗱\n│\n│ Veuillez écrire un message\n│ ou joindre un fichier.\n╰${LINE}`,
        { title: "⚠️ 𝗘𝗿𝗿𝗼𝗿", contentFont: "fancy" }
      );
    }

    const attachments = [
      ...(input.attachments || []),
      ...(input.messageReply?.attachments || []),
    ].filter(att => MEDIA_TYPES.includes(att.type));

    // ⚡ Envoi de confirmation à l'utilisateur et capture du messageID
    const userConfirmation = await output.replyStyled(
      `╭── ✅ 𝗖𝗼𝗻𝗻𝗲𝗰𝘁𝗲𝗱 ───
│ 📡 Votre appel a été transmis
│ à ${Cassidy.config.ADMINBOT.length} administrateur(s).
│
│ 💬 Vous pouvez continuer à
│ répondre à ce message pour
│ discuter en direct.
╰──────────────────`,
      { title: "🚀 𝗦𝗲𝗻𝘁 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆", contentFont: "fancy" }
    );

    const userMessageID = userConfirmation.messageID;

    // Handlers
    const handleAdminReply = (adminCtx, targetThreadID, originalAdminID) => {
      const adminText = adminCtx.input.body || "";
      const adminAttachments = adminCtx.input.attachments || [];

      const adminResponseDesign =
`╭── 🛡️ 𝗔𝗱𝗺𝗶𝗻 𝗥𝗲𝗽𝗹𝘆 ──
│ 🕰️ ${TIME()}
│
│ ${adminText || "📎 [Media Sent]"}
╰──────────────────`;

      // 🔥 Répond directement au message de l'utilisateur
      output.replyStyled(
        adminResponseDesign,
        { title: "💬 𝗦𝘂𝗽𝗽𝗼𝗿𝘁 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲", contentFont: "fancy", replyTo: userMessageID },
        targetThreadID,
        adminAttachments
      ).then((userMsg) => {
        // L'utilisateur peut répondre à ce message et boucler vers l'admin
        userMsg.atReply((userCtx) => handleUserReply(userCtx, originalAdminID));
      });
    };

    const handleUserReply = (userCtx, targetAdminID) => {
      const userText = userCtx.input.body || "";
      const userAttachments = userCtx.input.attachments || [];

      const userReplyDesign =
`╭── 👤 𝗨𝘀𝗲𝗿 𝗥𝗲𝗽𝗹𝘆 ───
│ 🆔 ${userID}
│ 🕰️ ${TIME()}
│
│ ${userText || "📎 [Media Sent]"}
╰──────────────────`;

      output.sendStyled(
        userReplyDesign,
        { title: "📨 𝗡𝗲ｗ 𝗥𝗲𝗽𝗹𝘆", contentFont: "fancy" },
        targetAdminID,
        userAttachments
      ).then((loopAdminMsg) => {
        loopAdminMsg.atReply((adminCtx) => handleAdminReply(adminCtx, threadID, targetAdminID));
      });
    };

    const initialTicketDesign =
`╭── 🚨 𝗡𝗲𝘄 𝗧𝗶𝗰𝗸𝗲𝘁 ───
│ 👤 𝗨𝘀𝗲𝗿: ${userName}
│ 🆔 𝗨𝗜𝗗: ${userID}
│ 🧵 𝗧𝗜𝗗: ${threadID}
│ 🕰️ 𝗧𝗶𝗺𝗲: ${TIME()}
├─── 💬 𝗠𝗲𝘀𝘀𝗮𝗴𝗲 ─────
│ ${message || "📎 [Attachment Only]"}
╰──────────────────`;

    // Envoi initial aux admins
    for (const adminID of Cassidy.config.ADMINBOT) {
      output.sendStyled(
        initialTicketDesign,
        { title: "📡 𝗜𝗻𝗰𝗼𝗺𝗶𝗻𝗴 𝗖𝗮𝗹𝗹", contentFont: "fancy" },
        adminID,
        attachments
      ).then((adminMsg) => {
        adminMsg.atReply((adminCtx) => handleAdminReply(adminCtx, threadID, adminID));
      });
    }
  },
});
