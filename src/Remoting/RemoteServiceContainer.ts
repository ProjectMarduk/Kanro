import { RemoteServiceException } from "../Exceptions";
import { Service } from "../Core";
import { ServiceProxyHandler } from "./ServiceProxyHandler";

export class RemoteServiceContainer extends Service {
    async onLoaded(): Promise<void> {
        if (this.getDependedService<any>("target") == null) {
            throw new Error("No target for service proxy");
        }
    }
}