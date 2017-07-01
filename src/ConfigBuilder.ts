import * as Ajv from "Ajv";
import { Path, File } from "./IO";
import { InvalidConfigException } from "./Exceptions";
import { IAppConfig } from "./IAppConfig";

let projectDir = Path.resolve(__dirname, "..");

export class ConfigBuilder {
    private static ajv: Ajv.Ajv;

    static async readConfig(config?: IAppConfig): Promise<IAppConfig> {
        if (config != undefined) {
            return config;
        }

        if (await File.exists(`${process.cwd()}/kanro.json`)) {
            return ConfigBuilder.readConfigFromFile(`${process.cwd()}/kanro.json`);
        }
        else if (await File.exists(`${projectDir}/configs/kanro.json`)) {
            return ConfigBuilder.readConfigFromFile(`${projectDir}/configs/kanro.json`);
        }
        else {
            throw new Error("Kanro config 'kanro.json' not found.");
        }
    }

    static async readConfigFromFile(file: string): Promise<IAppConfig> {
        return <any>await File.readJson(file);
    }

    static async readConfigFromJson(jsonString: string): Promise<IAppConfig> {
        return <any>JSON.parse(jsonString);
    }
}