import bowser from 'bowser';

import Event from '../Event';
import MainHelper from '../helpers/MainHelper';
import {
  addCssClass,
  addDomElement,
  getPlatformNotificationIcon,
  once,
  removeDomElement,
  removeCssClass,
  getDomElementOrStub
} from '../utils';
import { SlidedownPermissionMessageOptions } from '../models/Prompts';
import { SERVER_CONFIG_DEFAULTS_SLIDEDOWN } from '../config';
import { getLoadingIndicatorWithColor } from './LoadingIndicator';
import { getDialogHtml } from './DialogHtml';
import { getRetryIndicator } from './RetryIndicator';
import { SlidedownCssClasses, SlidedownCssIds, COLORS } from "./constants";

export default class Slidedown {
  public options: SlidedownPermissionMessageOptions;
  public notificationIcons: NotificationIcons | null;
  private isInSaveState: boolean;
  public isShowingFailureState: boolean;

  static get EVENTS() {
    return {
      ALLOW_CLICK: 'slidedownAllowClick',
      CANCEL_CLICK: 'slidedownCancelClick',
      SHOWN: 'slidedownShown',
      CLOSED: 'slidedownClosed',
    };
  }

  constructor(options?: SlidedownPermissionMessageOptions) {
    if (!options) {
        options = MainHelper.getSlidedownPermissionMessageOptions(OneSignal.config.userConfig.promptOptions);
    }
    this.options = options;
    this.options.actionMessage = options.actionMessage.substring(0, 90);
    this.options.acceptButtonText = options.acceptButtonText.substring(0, 15);
    this.options.cancelButtonText = options.cancelButtonText.substring(0, 15);
    this.options.positiveUpdateButton = options.positiveUpdateButton ?
      options.positiveUpdateButton.substring(0, 16):
      SERVER_CONFIG_DEFAULTS_SLIDEDOWN.categoryDefaults.positiveUpdateButton;
    this.options.negativeUpdateButton = options.negativeUpdateButton ?
      options.negativeUpdateButton.substring(0, 16) :
      SERVER_CONFIG_DEFAULTS_SLIDEDOWN.categoryDefaults.negativeUpdateButton;
    this.options.updateMessage = !!options.updateMessage ?
      options.updateMessage.substring(0, 90) :
      SERVER_CONFIG_DEFAULTS_SLIDEDOWN.categoryDefaults.updateMessage;
    this.options.savingButtonText = SERVER_CONFIG_DEFAULTS_SLIDEDOWN.savingText;
    // NOTE: will be configurable in the future
    this.options.errorButtonText = this.options.positiveUpdateButton;

    this.notificationIcons = null;
    this.isInSaveState = false;
    this.isShowingFailureState = false;
  }

  async create(isInUpdateMode?: boolean) {
    // TODO: dynamically change btns depending on if its first or repeat display of slidedown (subscribe vs update)
    if (this.notificationIcons === null) {
      const icons = await MainHelper.getNotificationIcons();

      this.notificationIcons = icons;

      // Remove any existing container
      if (this.container.className.includes(SlidedownCssClasses.container)) {
          removeDomElement(`#${SlidedownCssIds.container}`);
      }
      const positiveButtonText = isInUpdateMode ?
        this.options.positiveUpdateButton : this.options.acceptButtonText;
      const negativeButtonText = isInUpdateMode ?
        this.options.negativeUpdateButton : this.options.cancelButtonText;
      const messageText = isInUpdateMode ?
        this.options.updateMessage : this.options.actionMessage;

      const icon = this.getPlatformNotificationIcon();
      const dialogHtml = getDialogHtml({
        messageText,
        icon,
        positiveButtonText,
        negativeButtonText
      });

      // Insert the container
      addDomElement('body', 'beforeend', `<div id="${SlidedownCssIds.container}"` +
        `class="${SlidedownCssClasses.container} ${SlidedownCssClasses.reset}"></div>`);
      // Insert the dialog
      addDomElement(this.container, 'beforeend',
          `<div id="${SlidedownCssIds.dialog}" class="${SlidedownCssClasses.dialog}">${dialogHtml}</div>`);

      // Animate it in depending on environment
      addCssClass(this.container, bowser.mobile ? 'slide-up' : 'slide-down');

      // Add click event handlers
      this.allowButton.addEventListener('click', this.onSlidedownAllowed.bind(this));
      this.cancelButton.addEventListener('click', this.onSlidedownCanceled.bind(this));
      Event.trigger(Slidedown.EVENTS.SHOWN);
    }
  }

  async onSlidedownAllowed(_: any) {
    await Event.trigger(Slidedown.EVENTS.ALLOW_CLICK);
  }

  onSlidedownCanceled(_: any) {
    Event.trigger(Slidedown.EVENTS.CANCEL_CLICK);
    this.close();
  }

  close() {
    addCssClass(this.container, 'close-slidedown');
    once(this.dialog, 'animationend', (event: any, destroyListenerFn: () => void) => {
      if (event.target === this.dialog &&
          (event.animationName === 'slideDownExit' || event.animationName === 'slideUpExit')) {
          // Uninstall the event listener for animationend
          removeDomElement(`#${SlidedownCssIds.container}`);
          destroyListenerFn();
          Event.trigger(Slidedown.EVENTS.CLOSED);
      }
    }, true);
  }

  /**
   * only used with Category Slidedown
   */
  toggleSaveState() {
    if (!this.isInSaveState) {
      // note: savingButtonText is hardcoded in constructor. TODO: pull from config & set defaults for future release
      this.allowButton.innerHTML = this.getIndicatorHolderHtmlWithText(this.options.savingButtonText!);
      addDomElement(this.buttonIndicatorHolder, 'beforeend', getLoadingIndicatorWithColor(COLORS.loadingIndicator));
      (<HTMLButtonElement>this.allowButton).disabled = true;
      addCssClass(this.allowButton, 'disabled');
      addCssClass(this.allowButton, SlidedownCssClasses.savingStateButton);
    } else {
      // positiveUpdateButton should be defined as written in MainHelper.getSlidedownPermissionMessageOptions
      this.allowButton.innerHTML = this.options.positiveUpdateButton!;
      removeDomElement(`#${SlidedownCssClasses.buttonIndicatorHolder}`);
      (<HTMLButtonElement>this.allowButton).disabled = false;
      removeCssClass(this.allowButton, 'disabled');
      removeCssClass(this.allowButton, SlidedownCssClasses.savingStateButton);
    }
    this.isInSaveState = !this.isInSaveState;
  }

  toggleFailureState() {
    if (!this.isShowingFailureState) {
      // note: errorButtonText is hardcoded in constructor. TODO: pull from config & set defaults for future release
      this.allowButton.innerHTML = this.getIndicatorHolderHtmlWithText(this.options.errorButtonText!);
      addDomElement(this.buttonIndicatorHolder, 'beforeend', getRetryIndicator());
      addCssClass(this.allowButton, 'onesignal-error-state-button');
    } else {
      removeDomElement('#onesignal-button-indicator-holder');
      removeCssClass(this.allowButton, 'onesignal-error-state-button');
    }
    this.isShowingFailureState = !this.isShowingFailureState;
  }

  getPlatformNotificationIcon(): string {
    return getPlatformNotificationIcon(this.notificationIcons);
  }

  getIndicatorHolderHtmlWithText(text: string) {
    return `${text}<div id="${SlidedownCssIds.buttonIndicatorHolder}"` +
      `class="${SlidedownCssClasses.buttonIndicatorHolder}"></div>`;
  }

  get container() {
    return getDomElementOrStub(`#${SlidedownCssIds.container}`);
  }

  get dialog() {
    return getDomElementOrStub(`#${SlidedownCssIds.dialog}`);
  }

  get allowButton() {
    return getDomElementOrStub(`#${SlidedownCssIds.allowButton}`);
  }

  get cancelButton() {
    return getDomElementOrStub(`#${SlidedownCssIds.cancelButton}`);
  }

  get buttonIndicatorHolder() {
    return getDomElementOrStub(`#${SlidedownCssIds.buttonIndicatorHolder}`);
  }

  get slidedownFooter() {
    return getDomElementOrStub(`#${SlidedownCssIds.footer}`);
  }
}

export function manageNotifyButtonStateWhileSlidedownShows() {
  const notifyButton = OneSignal.notifyButton;
  if (notifyButton &&
    notifyButton.options.enable &&
    OneSignal.notifyButton.launcher.state !== 'hidden') {
    OneSignal.notifyButton.launcher.waitUntilShown()
      .then(() => {
        OneSignal.notifyButton.launcher.hide();
      });
  }
  OneSignal.emitter.once(Slidedown.EVENTS.CLOSED, () => {
    if (OneSignal.notifyButton &&
      OneSignal.notifyButton.options.enable) {
      OneSignal.notifyButton.launcher.show();
    }
  });
}
