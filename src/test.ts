import * as Kanro from ".";

class TestService extends Kanro.Core.Service {
    constructor(container: Kanro.Core.INodeContainer<TestService>) {
        super(container);
    }

    public async test(): Promise<String> {
        return "this is a Test string";
    }
}

class TestModule extends Kanro.Core.Module {
    async getNode(container: Kanro.Core.INodeContainer<Kanro.Core.Node>): Promise<Kanro.Core.Node> {
        switch (container.name) {
            case TestService.name:
                return new TestService(<any>container);
            default:
                return undefined;
        }
    }
}

let application = new Kanro.Application(undefined, [
    {
        name: "test",
        version: "*",
        module: new TestModule()
    }
]);

application.run();

function timeout() {
    setTimeout(async () => {
        application = await application.reloadConfigs();
        timeout();
    }, 5000);
}
timeout();