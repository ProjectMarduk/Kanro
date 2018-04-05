import * as Kanro from ".";
import { StringResponseBody } from "./Http/StringResponseBody";

class TestService extends Kanro.Core.Service {
    constructor(container: Kanro.Core.INodeContainer<TestService>) {
        super(container);
    }

    async test(): Promise<String> {
        return "this is a Test string";
    }
}

class TestResponder extends Kanro.Core.Responder {
    dependencies = {
        "test": {
            name: "TestService",
            module: {
                name: "test",
                version: "*"
            }
        }
    };

    async respond(request: Kanro.Http.IRequest): Promise<Kanro.Http.IResponse> {
        let response: Kanro.Http.IResponse = request.respond();
        response.body = new StringResponseBody(await (await this.getDependedService<TestService>("test")).test());
        return response;
    }
}


class TestModule extends Kanro.Core.Module {
    readonly nodes: string[] = [
        TestService.name,
        TestResponder.name
    ];

    async getNode(container: Kanro.Core.INodeContainer<Kanro.Core.Node>): Promise<Kanro.Core.Node> {
        switch (container.name) {
            case TestService.name:
                return new TestService(<any>container);
            case TestResponder.name:
                return new TestResponder(<any>container);
            default:
                return undefined;
        }
    }
}

let application: Kanro.Application = new Kanro.Application(undefined, [
    {
        name: "test",
        version: "*",
        module: new TestModule()
    }
]);

application.run();