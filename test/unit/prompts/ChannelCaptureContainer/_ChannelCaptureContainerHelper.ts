import { SinonSandbox } from "sinon";
import ChannelCaptureContainer from "../../../../src/slidedown/ChannelCaptureContainer";

export class ChannelCaptureContainerHelper {
  static stubScriptLoading(sandbox: SinonSandbox): void {
    sandbox.stub(ChannelCaptureContainer.prototype as any, "loadPhoneLibraryScripts");
    sandbox.stub(ChannelCaptureContainer.prototype as any, "initializePhoneInputLibrary");
  }

  static stubEventListenerAdders(sandbox: SinonSandbox): void {
    sandbox.stub(ChannelCaptureContainer.prototype as any, "addSmsInputEventListeners");
    sandbox.stub(ChannelCaptureContainer.prototype as any, "addEmailInputEventListeners");
  }

  static setupStubs(sandbox: SinonSandbox): void {
    ChannelCaptureContainerHelper.stubScriptLoading(sandbox);
    ChannelCaptureContainerHelper.stubEventListenerAdders(sandbox);
  }
}
