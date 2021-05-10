import { RegisterOptions } from "../helpers/InitHelper";
import Log from "../libraries/Log";
import { ResourceLoadState } from "../services/DynamicResourceLoader";
import { CUSTOM_LINK_CSS_CLASSES, CUSTOM_LINK_CSS_SELECTORS } from "../slidedown/constants";
import { addCssClass } from "../utils";
import { AppUserConfigCustomLinkOptions } from "../models/Prompts";

export class CustomLinkManager {
  private config: AppUserConfigCustomLinkOptions | undefined;
  private isPushEnabled: boolean = false;
  private isOptedOut: boolean = false;

  constructor(config?: AppUserConfigCustomLinkOptions) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (!this.config?.enabled) {
      return;
    }

    if (!(await this.loadSdkStyles())) {
      return;
    }

    Log.info("OneSignal: initializing customlink");

    await this.updateSubscriptionState();

    if (!this.config?.unsubscribeEnabled && this.isPushEnabled) {
      this.hideCustomLinkContainers();
      return;
    }

    for (let i=0; i<this.customlinkContainerElements.length; i++) {
      await this.injectMarkup(this.customlinkContainerElements[i]);
    }
  }

  private async injectMarkup(element: HTMLElement): Promise<void> {
    // clear contents
    element.innerHTML = '';

    this.mountExplanationNode(element);
    await this.mountSubscriptionNode(element);
  }

  private mountExplanationNode(element: HTMLElement): void {
    if (!this.config?.text) {
      Log.error("CustomLink: required property 'text' is missing in the config");
      return;
    }

    if (this.config.text.explanation) {
      const explanation = document.createElement("p");
      explanation.textContent = this.config.text.explanation;
      addCssClass(explanation, CUSTOM_LINK_CSS_CLASSES.resetClass);
      addCssClass(explanation, CUSTOM_LINK_CSS_CLASSES.explanationClass);

      if (this.config.size) {
        addCssClass(explanation, this.config.size);
      }

      if (this.isPushEnabled) {
        addCssClass(explanation, CUSTOM_LINK_CSS_CLASSES.state.subscribed);
      } else {
        addCssClass(explanation, CUSTOM_LINK_CSS_CLASSES.state.unsubscribed);
      }

      element.appendChild(explanation);
    }
  }

  private async mountSubscriptionNode(element: HTMLElement): Promise<void> {
    if (!this.config?.text) {
      Log.error("CustomLink: required property 'text' is missing in the config");
      return;
    }

    if (this.config.text.subscribe) {
      const subscribe = document.createElement("button");
      addCssClass(subscribe, CUSTOM_LINK_CSS_CLASSES.resetClass);
      addCssClass(subscribe, CUSTOM_LINK_CSS_CLASSES.subscribeClass);

      if (this.config.size) {
        addCssClass(subscribe, this.config.size);
      }

      if (this.config.style) {
        addCssClass(subscribe, this.config.style);
      }

      if (this.isPushEnabled) {
        addCssClass(subscribe, CUSTOM_LINK_CSS_CLASSES.state.subscribed);
      } else {
        addCssClass(subscribe, CUSTOM_LINK_CSS_CLASSES.state.unsubscribed);
      }

      this.setCustomColors(subscribe);
      await this.setTextFromPushStatus(subscribe);

      subscribe.addEventListener("click", async () => {
        Log.info("CustomLink: subscribe clicked");
        await this.handleClick(subscribe);
      });

      element.appendChild(subscribe);
    }
  }

  private async loadSdkStyles(): Promise<boolean> {
    const sdkStylesLoadResult = await OneSignal.context.dynamicResourceLoader.loadSdkStylesheet();
    if (sdkStylesLoadResult !== ResourceLoadState.Loaded) {
        Log.debug('Not initializing custom link button because styles failed to load.');
        return false;
    }
    return true;
  }

  private hideElement(element: HTMLElement): void {
    addCssClass(element, CUSTOM_LINK_CSS_CLASSES.hide);
  }

  /**
   * Used for hiding elements if "Allow unsubscribe" is on
   * @returns void
   */
  private hideCustomLinkContainers(): void {
      this.customlinkContainerElements.forEach(element => {
        this.hideElement(element);
      });
  }

  private async handleClick(element: HTMLElement): Promise<void> {
    this.updateSubscriptionState();

    if (this.isPushEnabled) {
      await OneSignal.setSubscription(false);
      this.setTextFromPushStatus(element);
    } else {
      if (!this.isOptedOut) {
        const autoAccept = !OneSignal.environmentInfo.requiresUserInteraction;
        const options: RegisterOptions = { autoAccept };
        await OneSignal.registerForPushNotifications(options);
        // once subscribed, prevent unsubscribe by hiding customlinks
        if (!this.config?.unsubscribeEnabled && this.isPushEnabled) {
          this.hideCustomLinkContainers();
        }
        return;
      }
      await OneSignal.setSubscription(true);
      // once subscribed, prevent unsubscribe by hiding customlinks
      if (!this.config?.unsubscribeEnabled && this.isPushEnabled) {
        this.hideCustomLinkContainers();
      }
    }
  }

  private async setTextFromPushStatus(element: HTMLElement): Promise<void> {
    await this.updateSubscriptionState();
    if (this.config?.text?.subscribe) {
      if (!this.isPushEnabled) {
        element.textContent = this.config.text.subscribe;
      }
    }

    if (this.config?.text?.unsubscribe) {
      if (this.isPushEnabled) {
        element.textContent = this.config.text.unsubscribe;
      }
    }
  }

  private async updateSubscriptionState(): Promise<void> {
    this.isPushEnabled = await OneSignal.privateIsPushNotificationsEnabled();
    this.isOptedOut    = await OneSignal.internalIsOptedOut();
  }

  private setCustomColors(element: HTMLElement): void {
    if (this.config?.style === "button" && this.config?.color && this.config?.color.button && this.config?.color.text) {
      element.style.backgroundColor = this.config?.color.button;
      element.style.color = this.config?.color.text;
    } else if (this.config?.style === "link" && this.config?.color && this.config?.color.text) {
      element.style.color = this.config?.color.text;
    }
  }

  get customlinkContainerElements(): HTMLElement[] {
    const containers = document.querySelectorAll<HTMLElement>(CUSTOM_LINK_CSS_SELECTORS.containerSelector);
    return Array.prototype.slice.call(containers);
  }
}
