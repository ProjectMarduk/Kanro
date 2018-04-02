import { Responder, INodeContainer } from "../Core";
import { IRequest, IResponse } from "../Http";

export class ServiceProxy extends Responder {
    public async respond(request: IRequest): Promise<IResponse> {
        if(this.dependencies["target"] == undefined){
            throw new Error("No target for service proxy") 
        }

        let response = request.respond();

        return response;
    }

    constructor(container: INodeContainer<ServiceProxy>) {
        super(container);
    }
}