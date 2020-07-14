import test from 'ava';
import TaggingContainer from '../../../src/slidedown/TaggingContainer';
import sinon, { SinonSandbox } from 'sinon';
import { TestEnvironment, HttpHttpsEnvironment, BrowserUserAgent } from '../../support/sdk/TestEnvironment';
import { setUserAgent } from '../../support/tester/browser';
import Slidedown from '../../../src/slidedown/Slidedown';
import { TagCategory, TagsObjectWithBoolean } from '../../../src/models/Tags';
import _ from "lodash";
import { getDomElementOrStub, deepCopy } from '../../../src/utils';
import TagUtils from '../../../src/utils/TagUtils';

const sandbox: SinonSandbox = sinon.sandbox.create();

test.beforeEach(async () => {
  (global as any).BrowserUserAgent = BrowserUserAgent;
  (global as any).location = new URL("https://localhost:4001");
  const userConfig = await TestEnvironment.getFakeMergedConfig({});
  const options = {
    httpOrHttps: HttpHttpsEnvironment.Https,
    initOptions: userConfig,
    addPrompts: true
  };
  await TestEnvironment.stubDomEnvironment(options);
  await TestEnvironment.initialize(options);
});

test.afterEach(function () {
  sandbox.restore();
});

test.todo('check generateHtml() returns correct HTML with given categories and player tags');
test.todo('check that calling mount() adds the tagging container to DOM');
test.todo('check that calling mount() results in allowButton enabled');
test.todo('check that calling load() adds the loading container to DOM');
test.todo('check that clicking a checkbox toggles the checked state of category input');
test.todo('check that calling getValuesFromTaggingContainer returns correct list of tags');

/*
TODO: uncomment after WebAPI dom element creation is implemented for sanitization purposes

test('check sanitization is working correctly', t => {
  setUserAgent(BrowserUserAgent.ChromeMacSupported);
  OneSignal.slidedown = new Slidedown();
  const tagCategoryList = [{
      tag: "tag1\"<script> // injected code </script> \"\"",
      label: "Tag 1\"<script> // injected code </script> \"",
  }];
  const taggingContainer = new TaggingContainer();
  taggingContainer.mount(tagCategoryList);
  const labelElement = getDomElementOrStub(".onesignal-category-label");
  t.is(labelElement.innerHTML, `<span class="onesignal-category-label-text">Tag 1</span>`+
    `<input type="checkbox" value="tag1"><span class="onesignal-checkmark"></span>`);
});
*/
test.todo('check sanitization is working correctly');
