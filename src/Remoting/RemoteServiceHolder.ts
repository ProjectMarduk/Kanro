import { INodeContainer, Responder } from "../Core";
import { IRequest, IResponse } from "../Http";

export class RemoteServiceHolder extends Responder {
    async respond(request: IRequest): Promise<IResponse> {
        if (this.getDependedService<any>("target") == null) {
            throw new Error("No target for service proxy");
        }

        let response: IResponse = request.respond();

        return response;
    }

    constructor(container: INodeContainer<RemoteServiceHolder>) {
        super(container);
    }
}