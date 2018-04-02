import * as Ajv from 'Ajv';
import * as Request from 'request';
import { Path, File } from './IO';
import { InvalidConfigException } from './Exceptions';
import { IAppConfig } from './IAppConfig';
import { LoggerManager } from "./LoggerManager";
import { Colors, AnsiStyle, ILogger } from "./Logging";
import { Router } from "./Router";
import { Service, IModuleInfo } from './Core';
import { KanroInternalModule } from './KanroInternalModule';

let projectDir = Path.resolve(__dirname, '..');

export class ConfigBuilder extends Service {
    dependencies = {
        loggerManager: {
            name: LoggerManager.name,
            module: KanroInternalModule.moduleInfo
        }
    }

    private ajv = Ajv();

    constructor() {
        super(undefined);
    }

    async onLoaded(): Promise<void> {
        this.configLogger = this.getDependedService<LoggerManager>("loggerManager").registerLogger("Config", AnsiStyle.create().foreground(Colors.green));
    }
    private configLogger: ILogger;

    async initialize() {
        try {
            let result = await new Promise<any>((res, rej) => {
                Request.get("http://higan.me/schema/1.1/kanro.json", (error, response, body) => {
                    if (error) {
                        rej(error);
                        return;
                    }
                    res(body);
                });
            })
            let schema = JSON.parse(result);
            this.ajv.addSchema(schema, 'kanro');
        } catch (error) {
            this.configLogger.warning("Config schema load failed, config validating will be disable.");
        }
    }

    async readConfig(config?: IAppConfig): Promise<IAppConfig> {
        if (config != undefined) {
            return config;
        }

        this.configLogger.info("Unspecified config, searching for configs...");

        if (await File.exists(`${process.cwd()}/kanro.json`)) {
            return this.readConfigFromFile(`${process.cwd()}/kanro.json`);
        }
        else if (await File.exists(`${projectDir}/config/kanro.json`)) {
            this.configLogger.warning("'kanro.json' not found in project dir, default config will be using.");
            return this.readConfigFromFile(`${projectDir}/config/kanro.json`);
        }
        else {
            throw new Error("Kanro config 'kanro.json' not found.");
        }
    }

    async readConfigFromFile(file: string): Promise<IAppConfig> {
        let result = <any>await File.readJson(file);
        this.validate(result);
        return result;
    }

    async readConfigFromJson(jsonString: string): Promise<IAppConfig> {
        let result = <any>JSON.parse(jsonString);
        this.validate(result);
        return result;
    }

    validate(config: IAppConfig) {
        if (this.ajv.getSchema('kanro') == undefined) {
            return true;
        }

        if (!this.ajv.validate('kanro', config)) {
            this.configLogger.error("Config can't validate with schema, check your 'kanro.json' file.");
            throw new InvalidConfigException('kanro', this.ajv.errorsText(this.ajv.errors))
        }
        return true;
    }
}