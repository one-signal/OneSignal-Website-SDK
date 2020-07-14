import test from "ava";
import sinon, { SinonSandbox } from "sinon";
import { TestEnvironment, HttpHttpsEnvironment, TestEnvironmentConfig } from '../../support/sdk/TestEnvironment';
import Log from '../../../src/libraries/Log';
import TaggingContainer from '../../../src/slidedown/TaggingContainer';
import MainHelper from '../../../src/helpers/MainHelper';
import InitHelper from '../../../src/helpers/InitHelper';
import { PromptsManager } from '../../../src/managers/PromptsManager';
import { PageViewManager } from '../../../src/managers/PageViewManager';
import Slidedown from '../../../src/slidedown/Slidedown';
import { DynamicResourceLoader, ResourceLoadState } from '../../../src/services/DynamicResourceLoader';
import EventsTestHelper from '../../support/tester/EventsTestHelper';
import Database from '../../../src/services/Database';
import Random from '../../support/tester/Random';
import { ConfigIntegrationKind } from '../../../src/models/AppConfig';

const sinonSandbox: SinonSandbox = sinon.sandbox.create();

test.afterEach(() => {
    sinonSandbox.restore();
    OneSignal._initCalled = false;
    OneSignal.__initAlreadyCalled = false;
    OneSignal._sessionInitAlreadyRunning = false;
});

test('if category options are not configured, check that an error was logged', async t => {
    await TestEnvironment.initialize();
    TestEnvironment.mockInternalOneSignal();
    const logSpy = sinonSandbox.stub(Log, "error");
    await OneSignal.showCategorySlidedown();
    t.true(logSpy.calledOnce);
});

test('category options are configured, in update mode, check 1) tagging container loaded 2) remote tag fetch',
    async t => {
        await initializeConfigWithCategories(true);
        sinonSandbox.stub(OneSignal, "privateIsPushNotificationsEnabled").resolves(true);
        sinonSandbox.stub(MainHelper, "getNotificationIcons");

        const tagFetchSpy = sinonSandbox.stub(OneSignal, "getTags").resolves({});
        const loadSpy = sinonSandbox.spy(TaggingContainer.prototype, "load");

        await OneSignal.showCategorySlidedown();

        t.true(loadSpy.calledOnce);
        t.true(tagFetchSpy.calledOnce);
});


test('category options are configured, not in update mode, check remote tag fetch not made', async t => {
    await initializeConfigWithCategories(true);
    const tagFetchStub = sinonSandbox.stub(OneSignal, "getTags").resolves({});
    sinonSandbox.stub(PageViewManager.prototype, "getLocalPageViewCount").returns(1);
    sinonSandbox.stub(OneSignal, "privateIsPushNotificationsEnabled").resolves(false);
    sinonSandbox.stub(PromptsManager.prototype as any, "checkIfAutoPromptShouldBeShown").resolves(true);
    sinonSandbox.stub(DynamicResourceLoader.prototype, "loadSdkStylesheet").resolves(ResourceLoadState.Loaded);
    const slidedownSpy = sinonSandbox.spy(PromptsManager.prototype, "internalShowSlidedownPrompt");
    const createSpy = sinonSandbox.spy(Slidedown.prototype, "create");
    await InitHelper.sessionInit();

    t.true(!tagFetchStub.called);
    t.true(slidedownSpy.calledOnce);
    t.true(createSpy.called);
});

test('category options are configured, in update mode, no change to category tags, remote tag update not made',
    async t => {
        const testConfig: TestEnvironmentConfig = {
            httpOrHttps: HttpHttpsEnvironment.Https,
            integration: ConfigIntegrationKind.Custom,
            pushIdentifier: 'granted', // to do: check this ???
            stubSetTimeout: true
        };
        const stubs = await TestEnvironment.setupOneSignalPageWithStubs(sinonSandbox, testConfig, t);
        await TestEnvironment.mockInternalOneSignal();
        sinonSandbox.stub(OneSignal, "privateIsPushNotificationsEnabled").resolves(true);
        sinonSandbox.stub(Database, "getSubscription").resolves({ optedOut: false });
        sinonSandbox.stub(OneSignal, "getTags").resolves({ tag1: "1" });
        sinonSandbox.stub(MainHelper, "getNotificationIcons").resolves({ success: true });
        const appId = Random.getRandomUuid();
        const eventHelper = new EventsTestHelper(sinonSandbox);

        const slidedownClosed = new Promise(resolve => {
            OneSignal.on(OneSignal.emitter.on(Slidedown.EVENTS.CLOSED) , () => {
                t.is(stubs.sendTagsSpy.callCount, 0);
                resolve();
            });
        });

        OneSignal.init({
            appId,
            promptOptions: {
                slidedown: {
                enabled: true,
                autoPrompt: false,
                categories : {
                    tags : [{ tag1: "tag", label: "Tag" }]
                }
                }
            },
            autoResubscribe: false,
        });
        await OneSignal.showCategorySlidedown();
        eventHelper.simulateSlidedownAllowAfterShown();
        eventHelper.simulateSlidedownCloseAfterAllow();

        await slidedownClosed;
});

async function initializeConfigWithCategories(autoPrompt: boolean) {
    const config = {
        userConfig: {
            promptOptions: {
                autoPrompt,
                slidedown: {
                    enabled: true,
                    actionMessage: "",
                    acceptButtonText: "",
                    cancelButtonText: "",
                    categories: {
                        tags: [
                            {
                                tag: "Tag",
                                label: "Label"
                            }
                        ]
                    }
                }
            }
        }
    };
    await TestEnvironment.initialize();
    TestEnvironment.mockInternalOneSignal(config);
}
