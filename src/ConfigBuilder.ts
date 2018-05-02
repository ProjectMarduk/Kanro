import * as Ajv from "Ajv";
import * as Http from "http";
import { AnsiStyle, Colors, ILogger } from "./Logging";
import { File, Path } from "./IO";
import { IAppConfig } from "./IAppConfig";
import { IModuleInfo, Service } from "./Core";
import { InvalidConfigException } from "./Exceptions";
import { KanroInternalModule } from "./KanroInternalModule";
import { LoggerManager } from "./LoggerManager";
import { UrlRouter } from "./Router";

let projectDir: string = Path.resolve(__dirname, "..");

export class ConfigBuilder extends Service {
    dependencies = {
        loggerManager: {
            name: LoggerManager.name,
            module: KanroInternalModule.moduleInfo
        }
    };

    private ajv = Ajv();

    constructor() {
        super(undefined);
    }

    async onLoaded(): Promise<void> {
        this.configLogger = await (await this.getDependedService<LoggerManager>("loggerManager"))
            .registerLogger("Config", AnsiStyle.create().foreground(Colors.green));
    }
    private configLogger: ILogger;

    async initialize(): Promise<void> {
        try {
            let result: any = await new Promise<any>((res, rej) => {
                Http.get("https://higan.me/schema/1.1/kanro.json", response => {
                    var data = "";
                    response.on("data", chunk => {
                        data += chunk;
                    });
                    response.on("end", () => {
                        res(data);
                    });
                    response.on("error", err => {
                        rej(err);
                    });
                });
            });
            let schema: any = JSON.parse(result);
            this.ajv.addSchema(schema, "kanro");
        } catch (error) {
            this.configLogger.warning("Config schema load failed, config validating will be disable.");
        }
    }

    async readConfig(config?: IAppConfig): Promise<IAppConfig> {
        if (config != null) {
            return config;
        }

        this.configLogger.info("Unspecified config, searching for configs...");

        if (await File.exists(`${process.cwd()}/kanro.json`)) {
            return this.readConfigFromFile(`${process.cwd()}/kanro.json`);
        } else if (await File.exists(`${projectDir}/config/kanro.json`)) {
            this.configLogger.warning("'kanro.json' not found in work directory, default config will be used.");
            return this.readConfigFromFile(`${projectDir}/config/kanro.json`);
        } else {
            throw new Error("Kanro config 'kanro.json' not found.");
        }
    }

    async readConfigFromFile(file: string): Promise<IAppConfig> {
        let result: any = <any>await File.readJson(file);
        this.validate(result);
        return result;
    }

    async readConfigFromJson(jsonString: string): Promise<IAppConfig> {
        let result: any = <any>JSON.parse(jsonString);
        this.validate(result);
        return result;
    }

    validate(config: IAppConfig): boolean {
        if (this.ajv.getSchema("kanro") == null) {
            return true;
        }

        if (!this.ajv.validate("kanro", config)) {
            this.configLogger.error("Config can't validate with schema, check your 'kanro.json' file.");
            throw new InvalidConfigException("kanro", this.ajv.errorsText(this.ajv.errors));
        }
        return true;
    }
}