import test from 'ava';
import sinon, { SinonSandbox } from 'sinon';
import { TestEnvironment, HttpHttpsEnvironment, BrowserUserAgent } from '../../../support/sdk/TestEnvironment';
import { getDomElementOrStub } from '../../../../src/utils';
import {
  CHANNEL_CAPTURE_CONTAINER_CSS_CLASSES,
  CHANNEL_CAPTURE_CONTAINER_CSS_IDS
} from '../../../../src/slidedown/constants';
import ChannelCaptureContainer from '../../../../src/slidedown/ChannelCaptureContainer';
import { SlidedownPromptingTestHelper } from '../SlidedownPrompting/_SlidedownPromptingTestHelpers';
import { DelayedPromptType } from '../../../../src/models/Prompts';
import { ChannelCaptureContainerHelper } from './_ChannelCaptureContainerHelper';

const sandbox: SinonSandbox = sinon.sandbox.create();

test.beforeEach(async () => {
  (global as any).BrowserUserAgent = BrowserUserAgent;
  (global as any).location = new URL("https://localhost:4001");
  const userConfig = TestEnvironment.getFakeMergedConfig({});
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

const testHelper = new SlidedownPromptingTestHelper(sandbox);
const minimalSmsAndEmailOptions = testHelper.getMinimalSmsAndEmailOptions();

test("check that calling mount() adds the capture container to DOM", async t => {
  ChannelCaptureContainerHelper.setupStubs(sandbox);
  const captureContainer = new ChannelCaptureContainer(minimalSmsAndEmailOptions);
  let containerFromDom = getDomElementOrStub(`#${CHANNEL_CAPTURE_CONTAINER_CSS_IDS.channelCaptureContainer}`);
  t.false(containerFromDom.id === CHANNEL_CAPTURE_CONTAINER_CSS_IDS.channelCaptureContainer);

  await captureContainer.mount();

  containerFromDom = getDomElementOrStub(`#${CHANNEL_CAPTURE_CONTAINER_CSS_IDS.channelCaptureContainer}`);
  t.true(containerFromDom.id === CHANNEL_CAPTURE_CONTAINER_CSS_IDS.channelCaptureContainer);
});

test("sms & email validation is hidden by default", async t => {
  ChannelCaptureContainerHelper.setupStubs(sandbox);

  const captureContainer = new ChannelCaptureContainer(minimalSmsAndEmailOptions);
  await captureContainer.mount();

  const smsValidationElement = document.querySelector(
    `#${CHANNEL_CAPTURE_CONTAINER_CSS_IDS.onesignalSmsValidationElement}`
  );

  const smsValidationHidden = smsValidationElement?.classList.contains(
    CHANNEL_CAPTURE_CONTAINER_CSS_CLASSES.onesignalValidationElementHidden
    );

  const emailValidationElement = document.querySelector(
    `#${CHANNEL_CAPTURE_CONTAINER_CSS_IDS.onesignalEmailValidationElement}`
  );

  const emailValidationHidden = emailValidationElement?.classList.contains(
    CHANNEL_CAPTURE_CONTAINER_CSS_CLASSES.onesignalValidationElementHidden
    );

  t.true(smsValidationHidden);
  t.true(emailValidationHidden);
});

test("resetting validation styles works correctly", async t => {
  ChannelCaptureContainerHelper.setupStubs(sandbox);

  const captureContainer = new ChannelCaptureContainer(minimalSmsAndEmailOptions);
  await captureContainer.mount();

  ChannelCaptureContainer.showSmsInputError(true);
  ChannelCaptureContainer.showEmailInputError(true);

  ChannelCaptureContainer.resetInputErrorStates(DelayedPromptType.SmsAndEmail);

  const smsValidationElement = document.querySelector(
    `#${CHANNEL_CAPTURE_CONTAINER_CSS_IDS.onesignalSmsValidationElement}`
  );

  const smsValidationHidden = smsValidationElement?.classList.contains(
    CHANNEL_CAPTURE_CONTAINER_CSS_CLASSES.onesignalValidationElementHidden
    );

  const emailValidationElement = document.querySelector(
    `#${CHANNEL_CAPTURE_CONTAINER_CSS_IDS.onesignalEmailValidationElement}`
  );

  const emailValidationHidden = emailValidationElement?.classList.contains(
    CHANNEL_CAPTURE_CONTAINER_CSS_CLASSES.onesignalValidationElementHidden
    );

  t.true(smsValidationHidden);
  t.true(emailValidationHidden);
});

test("email validation works correctly", t => {
  t.true(ChannelCaptureContainer.validateEmailInputWithReturnVal("email@example.com"));
  t.true(ChannelCaptureContainer.validateEmailInputWithReturnVal("firstname.lastname@example.com"));
  t.true(ChannelCaptureContainer.validateEmailInputWithReturnVal("email@subdomain.example.com"));
  t.true(ChannelCaptureContainer.validateEmailInputWithReturnVal("firstname+lastname@example.com"));
  t.true(ChannelCaptureContainer.validateEmailInputWithReturnVal("email@123.123.123.123"));
  t.true(ChannelCaptureContainer.validateEmailInputWithReturnVal("firstname-lastname@example.com"));

  t.false(ChannelCaptureContainer.validateEmailInputWithReturnVal("#@%^%#$@#$@#.com"));
  t.false(ChannelCaptureContainer.validateEmailInputWithReturnVal("@example.com"));
  t.false(ChannelCaptureContainer.validateEmailInputWithReturnVal("email@example@example.com"));
  t.false(ChannelCaptureContainer.validateEmailInputWithReturnVal("email@-example.com"));
});
