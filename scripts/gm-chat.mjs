import { logInfo, logError, logWarn } from "./logger.mjs";

const MODULE_ID = "pendragon-campaign-manager";

export function extractActorGmContext(actor, effectiveYear = null) {
  if (!actor) return null;

  const traits = Array.from(actor.items ?? [])
    .filter((i) => i.type === "trait")
    .map((i) => `${i.name}: ${i.system?.value ?? 10}`)
    .slice(0, 10);

  const passions = Array.from(actor.items ?? [])
    .filter((i) => i.type === "passion")
    .map((i) => `${i.name}: ${i.system?.value ?? 10}`);

  const topSkills = Array.from(actor.items ?? [])
    .filter((i) => i.type === "skill" && (i.system?.value ?? 0) >= 10)
    .map((i) => `${i.name}: ${i.system?.value}`);

  const wounds = Array.from(actor.items ?? [])
    .filter((i) => i.type === "wound")
    .map((i) => `${i.name} (${i.system?.value ?? 0} dmg)`);

  return {
    name: actor.name,
    type: actor.type,
    glory: actor.system?.glory ?? actor.system?.gloryTotal ?? 0,
    stats: {
      siz: actor.system?.stats?.siz?.total ?? actor.system?.stats?.siz?.value,
      dex: actor.system?.stats?.dex?.total ?? actor.system?.stats?.dex?.value,
      str: actor.system?.stats?.str?.total ?? actor.system?.stats?.str?.value,
      con: actor.system?.stats?.con?.total ?? actor.system?.stats?.con?.value,
      app: actor.system?.stats?.app?.total ?? actor.system?.stats?.app?.value
    },
    top_skills: topSkills,
    passions: passions,
    traits: traits,
    wounds: wounds,
    year: effectiveYear
  };
}

export function registerGmChatIntegration({ createClient }) {
  if (typeof Hooks === "undefined") return;

  Hooks.on("chatMessage", (chatLog, messageText, chatData) => {
    const trimmed = (messageText ?? "").trim();
    if (!trimmed.startsWith("/gm ") && !trimmed.startsWith("@gm ") && trimmed !== "/gm" && trimmed !== "@gm") {
      return true; // Pass through to regular Foundry chat
    }

    const prompt = trimmed.replace(/^(@gm|\/gm)\s*/i, "").trim();
    if (!prompt) {
      if (typeof ui !== "undefined" && ui.notifications) {
        ui.notifications.warn("Please enter a question or knightly action for the Gamemaster (e.g. /gm I draw my sword and salute Earl Roderick).");
      }
      return false;
    }

    const speaker = chatData?.speaker || (typeof ChatMessage !== "undefined" ? ChatMessage.getSpeaker() : { alias: game.user.name });
    const actor = (speaker.actor ? game.actors.get(speaker.actor) : null) || game.user?.character || canvas?.tokens?.controlled?.[0]?.actor;
    const campaignId = game.settings.get(MODULE_ID, "campaignId");

    if (!campaignId) {
      if (typeof ui !== "undefined" && ui.notifications) {
        ui.notifications.error("Campaign ID is not configured in Pendragon Campaign Manager settings.");
      }
      return false;
    }

    let effectiveYear = 485;
    try {
      effectiveYear = game.settings.get("pendragon-campaign-manager", "campaignYear") ||
                      game.settings.get("Pendragon", "gameYear") || 485;
    } catch {
      effectiveYear = 485;
    }

    const actorContext = extractActorGmContext(actor, effectiveYear);
    const speakerName = speaker.alias || actor?.name || game.user.name;

    // Post the player's action into the chat log
    if (typeof ChatMessage !== "undefined") {
      ChatMessage.create({
        speaker: speaker,
        content: `<div class="pcm-player-action"><strong>[Action]:</strong> ${foundry.utils.escapeHTML(prompt)}</div>`,
        type: CONST?.CHAT_MESSAGE_TYPES?.IC ?? 1
      });
    }

    if (typeof ui !== "undefined" && ui.notifications) {
      ui.notifications.info("The Gamemaster ponders the chivalric fates...", { permanent: false });
    }

    const client = createClient({ authenticated: true, allowPlayer: true });
    client.sendGmPrompt(campaignId, {
      prompt,
      speaker: speakerName,
      actorContext,
      year: effectiveYear
    }).then((res) => {
      const narration = res.narration || res.response || res.message || (typeof res === "string" ? res : JSON.stringify(res));
      const diceLogs = res.dice_logs || res.rolls || [];

      let diceHtml = "";
      if (Array.isArray(diceLogs) && diceLogs.length > 0) {
        diceHtml = `<div class="pcm-dice-breakdown"><hr><strong>Dice Resolution:</strong><ul>` +
          diceLogs.map((d) => `<li><em>${d.purpose || d.roll_type || "Check"}:</em> <strong>${d.outcome || d.total}</strong> (Roll: ${JSON.stringify(d.individual_rolls || d.rolls || d.total)})</li>`).join("") +
          `</ul></div>`;
      }

      if (typeof ChatMessage !== "undefined") {
        ChatMessage.create({
          speaker: { alias: "The Gamemaster (Malorian 6e)", img: "icons/svg/crown.svg" },
          content: `
            <div class="pcm-gm-narration">
              <div class="pcm-gm-header"><i class="fa-solid fa-crown"></i> <strong>The Gamemaster</strong></div>
              <div class="pcm-gm-body">${foundry.utils.escapeHTML(narration).replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>")}</div>
              ${diceHtml}
            </div>
          `
        });
      }
    }).catch((err) => {
      logError("Failed to receive Gamemaster narration:", err);
      if (typeof ui !== "undefined" && ui.notifications) {
        ui.notifications.error(`Gamemaster error: ${err.message}`);
      }
      if (typeof ChatMessage !== "undefined") {
        ChatMessage.create({
          speaker: { alias: "The Gamemaster", img: "icons/svg/hazard.svg" },
          content: `<div class="pcm-gm-error"><em>The herald falls silent: ${foundry.utils.escapeHTML(err.message)}</em></div>`
        });
      }
    });

    return false; // Suppress default handling
  });

  logInfo("Gamemaster /gm chat integration registered.");
}
