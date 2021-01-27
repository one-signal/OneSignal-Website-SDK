import { SlidedownPromptOptions } from "src/models/Prompts";
import { ConfigHelper } from "../../../src/helpers/ConfigHelper";
import { ConfigIntegrationKind, ServerAppConfig } from "../../../src/models/AppConfig";
import { TestEnvironment } from "../sdk/TestEnvironment";

/**
 * Test Helper Function.
 * Gets the first SlidedownPromptOptions object from the `prompts` array on the `slidedown` config param
 * Used to execute `getAppConfig` codepath which includes key functions like:
 *  1) `getMergedConfig`
 *  2) `convertConfigToVersion2` - the resulting prompt options config should be config schema v2
 * @param fakeUserConfig
 */
export async function getPromptOptionsFromFinalAppConfig(fakeUserConfig: any):
    Promise<SlidedownPromptOptions|undefined>{
        const fakeServerConfig = TestEnvironment.getFakeServerAppConfig(ConfigIntegrationKind.Custom);
        fakeUserConfig.appId = fakeServerConfig.app_id;
        const getFakeServerConfig = (appId: string) => new Promise<ServerAppConfig>(resolve => {
            resolve(fakeServerConfig);
        });

        const finalConfig = await ConfigHelper.getAppConfig(fakeUserConfig, getFakeServerConfig);
        return finalConfig.userConfig.promptOptions?.slidedown?.prompts[0];
}