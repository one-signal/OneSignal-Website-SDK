import {
  DelayedPromptType,
  SlidedownPromptOptions,
} from '../../src/models/Prompts';

export default class PromptsHelper {
  static isCategorySlidedownConfigured(prompts: SlidedownPromptOptions[]): boolean {
    if (!prompts) return false;

    const options = PromptsHelper.getSlidedownPromptOptionsWithType(prompts, DelayedPromptType.Category);
    if (!!options) {
      return (!!options.categories && options.categories.length > 0);
    }
    return false;
  }

  static getSlidedownPromptOptionsWithType(prompts: SlidedownPromptOptions[] | undefined, type: DelayedPromptType):
    SlidedownPromptOptions | undefined {
      return prompts ? prompts.filter(options => options.type === type)[0] : undefined;
    }

  static isSlidedownAutoPromptConfigured(prompts: SlidedownPromptOptions[]) : boolean {
    if (!prompts) {
      return false;
    }

    for (let i=0; i<prompts.length; i++) {
      if (prompts[i].autoPrompt) return true;
    }
    return false;
  }
}
