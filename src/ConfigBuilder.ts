import * as Ajv from 'Ajv';
import * as Request from 'request';
import { Path, File } from './IO';
import { InvalidConfigException } from './Exceptions';
import { IAppConfig } from './IAppConfig';
import { LoggerManager } from "./LoggerManager";
import { Colors, AnsiStyle } from "./Logging";
import { Router } from "./Router";

let projectDir = Path.resolve(__dirname, '..');
let ajv = Ajv();
let configLogger = LoggerManager.current.registerLogger("Config", AnsiStyle.create().foreground(Colors.green));

export class ConfigBuilder {
    static async initialize() {
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
            ajv.addSchema(schema, 'kanro');
        } catch (error) {
            configLogger.warning("Config schema load failed, config validating will be disable.");
        }
    }

    static async readConfig(config?: IAppConfig): Promise<IAppConfig> {
        if (config != undefined) {
            return config;
        }

        configLogger.info("Unspecified config, searching for configs...");

        if (await File.exists(`${process.cwd()}/kanro.json`)) {
            return ConfigBuilder.readConfigFromFile(`${process.cwd()}/kanro.json`);
        }
        else if (await File.exists(`${projectDir}/config/kanro.json`)) {
            configLogger.warning("'kanro.json' not found in project dir, default config will be using.");
            return ConfigBuilder.readConfigFromFile(`${projectDir}/config/kanro.json`);
        }
        else {
            throw new Error("Kanro config 'kanro.json' not found.");
        }
    }

    static async readConfigFromFile(file: string): Promise<IAppConfig> {
        let result = <any>await File.readJson(file);
        ConfigBuilder.validate(result);
        return result;
    }

    static async readConfigFromJson(jsonString: string): Promise<IAppConfig> {
        let result = <any>JSON.parse(jsonString);
        ConfigBuilder.validate(result);
        return result;
    }

    private static validate(config: IAppConfig) {
        if (ajv.getSchema('kanro') == undefined) {
            return true;
        }

        if (!ajv.validate('kanro', config)) {
            configLogger.error("Config can't validate with schema, check your 'kanro.json' file.");
            throw new InvalidConfigException('kanro', ajv.errorsText(ajv.errors))
        }
        return true;
    }
}