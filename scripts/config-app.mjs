import {
  CampaignApiClient,
  CampaignApiError,
  normalizeBaseUrl,
  slugifyCampaignName
} from "./api-client.mjs";

const MODULE_ID = "pendragon-campaign-manager";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class CampaignManagerConfig extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-config`,
    classes: [MODULE_ID, "standard-form"],
    tag: "form",
    position: { width: 600 },
    window: { icon: "fa-solid fa-database", title: "PCM.Config.Title" },
    actions: {
      testConnection: CampaignManagerConfig.testConnection,
      createCampaign: CampaignManagerConfig.createCampaign
    },
    form: {
      closeOnSubmit: false,
      handler: CampaignManagerConfig.submitForm
    }
  };

  static PARTS = {
    form: { template: `modules/${MODULE_ID}/templates/config.hbs` },
    footer: { template: "templates/generic/form-footer.hbs" }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    return {
      ...context,
      backendUrl: game.settings.get(MODULE_ID, "backendUrl"),
      apiKey: game.settings.get(MODULE_ID, "apiKey"),
      campaignId: game.settings.get(MODULE_ID, "campaignId"),
      campaigns: this.campaigns ?? [],
      buttons: [
        { type: "submit", icon: "fa-solid fa-floppy-disk", label: "PCM.Config.Save" }
      ]
    };
  }

  static async testConnection(event, target) {
    event.preventDefault();
    const form = target.closest("form");
    const data = new FormData(form);
    try {
      const client = new CampaignApiClient({
        baseUrl: data.get("backendUrl"),
        apiKey: data.get("apiKey")
      });
      await client.health();
      this.campaigns = await client.listCampaigns();
      ui.notifications.info(game.i18n.localize("PCM.Config.ConnectionSuccess"));
      await this.render({ force: true });
    } catch (error) {
      notifyError(error);
    }
  }

  static async submitForm(event, form, formData) {
    if (!game.user.isGM) return;
    try {
      const values = formData.object;
      const backendUrl = normalizeBaseUrl(values.backendUrl);
      await game.settings.set(MODULE_ID, "backendUrl", backendUrl);
      await game.settings.set(MODULE_ID, "apiKey", values.apiKey?.trim() ?? "");
      await game.settings.set(MODULE_ID, "campaignId", values.campaignId?.trim() ?? "");
      ui.notifications.info(game.i18n.localize("PCM.Config.Saved"));
      await this.close();
    } catch (error) {
      notifyError(error);
    }
  }

  static async createCampaign(event, target) {
    event.preventDefault();
    if (!game.user.isGM) return;
    const data = new FormData(target.closest("form"));
    const name = data.get("newCampaignName")?.trim() ?? "";
    const slug = data.get("newCampaignSlug")?.trim() || slugifyCampaignName(name);
    if (!name || !slug) {
      ui.notifications.error(game.i18n.localize("PCM.Config.CampaignNameRequired"));
      return;
    }

    try {
      const backendUrl = normalizeBaseUrl(data.get("backendUrl"));
      const apiKey = data.get("apiKey")?.trim() ?? "";
      const client = new CampaignApiClient({ baseUrl: backendUrl, apiKey });
      const campaign = await client.createCampaign({
        name,
        slug,
        description: data.get("newCampaignDescription")?.trim() || null,
        current_year: Number(data.get("newCampaignYear") || 485)
      });
      await saveConnectionSettings({ backendUrl, apiKey, campaignId: campaign.id });
      this.campaigns = await client.listCampaigns();
      ui.notifications.info(
        game.i18n.format("PCM.Config.CampaignCreated", { name: campaign.name })
      );
      await this.render({ force: true });
    } catch (error) {
      notifyError(error);
    }
  }
}

async function saveConnectionSettings({ backendUrl, apiKey, campaignId }) {
  await game.settings.set(MODULE_ID, "backendUrl", backendUrl);
  await game.settings.set(MODULE_ID, "apiKey", apiKey);
  await game.settings.set(MODULE_ID, "campaignId", campaignId);
}

function notifyError(error) {
  const message = error instanceof CampaignApiError ? error.message : String(error);
  ui.notifications.error(message, { permanent: true });
}
