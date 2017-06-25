import * as Ajv from "Ajv";
import { Path, File } from "../IO";
import { InvalidConfigException } from "../Exceptions";
import { IKanroConfigs } from "./IKanroConfigs";
import { IKanroConfigFiles } from "./IKanroConfigFiles";

let projectDir = Path.resolve(__dirname, "../..");

export class ConfigBuilder {
    private static ajv: Ajv.Ajv;

    static async readConfig(): Promise<IKanroConfigs> {
        let files: IKanroConfigFiles = {};

        if (await File.exists(`${process.cwd()}/kanro.json`)) {
            files.appConfig = `${process.cwd()}/kanro.json`;
        }
        else if (await File.exists(`${projectDir}/configs/kanro.json`)) {
            files.appConfig = `${projectDir}/configs/kanro.json`;
        }
        else if (await File.exists(`${projectDir}/configs/default/kanro.json`)) {
            files.appConfig = `${projectDir}/configs/default/kanro.json`;
        }
        else {
            throw new Error("Kanro config 'kanro.json' not found.");
        }

        if (await File.exists(`${process.cwd()}/modules.json`)) {
            files.modulesConfig = `${process.cwd()}/modules.json`;
        }
        else if (await File.exists(`${projectDir}/configs/modules.json`)) {
            files.modulesConfig = `${projectDir}/configs/modules.json`;
        }
        else if (await File.exists(`${projectDir}/configs/default/modules.json`)) {
            files.modulesConfig = `${projectDir}/configs/default/modules.json`;
        }
        else {
            throw new Error("Kanro config 'modules.json' not found.");
        }

        if (await File.exists(`${process.cwd()}/services.json`)) {
            files.serviceConfig = `${process.cwd()}/services.json`;
        }
        else if (await File.exists(`${projectDir}/configs/services.json`)) {
            files.serviceConfig = `${projectDir}/configs/services.json`;
        }
        else if (await File.exists(`${projectDir}/configs/default/services.json`)) {
            files.serviceConfig = `${projectDir}/configs/default/services.json`;
        }
        else {
            throw new Error("Kanro config 'services.json' not found.");
        }

        if (await File.exists(`${process.cwd()}/executors.json`)) {
            files.executorsConfig = `${process.cwd()}/executors.json`;
        }
        else if (await File.exists(`${projectDir}/configs/executors.json`)) {
            files.executorsConfig = `${projectDir}/configs/executors.json`;
        }
        else if (await File.exists(`${projectDir}/configs/default/executors.json`)) {
            files.executorsConfig = `${projectDir}/configs/default/executors.json`;
        }
        else {
            throw new Error("Kanro config 'executors.json' not found.");
        }

        return await ConfigBuilder.readConfigFromFile(files);
    }

    static async readConfigFromFile(files: IKanroConfigFiles): Promise<IKanroConfigs> {
        let result: IKanroConfigs = {};

        result.appConfig = <any>await File.readJson(files.appConfig);
        result.modulesConfig = <any>await File.readJson(files.modulesConfig);
        result.serviceConfig = <any>await File.readJson(files.serviceConfig);
        result.executorsConfig = <any>await File.readJson(files.executorsConfig);

        return await ConfigBuilder.readConfigFromObject(result);
    }

    static async readConfigFromPath(path: string): Promise<IKanroConfigs> {
        let files: IKanroConfigFiles = {};

        if (File.exists(`${path}/kanro.json`)) {
            files.appConfig = `${path}/kanro.json`;
        }
        else {
            throw new Error("Kanro config 'kanro.json' not found.");
        }

        if (File.exists(`${path}/modules.json`)) {
            files.modulesConfig = `${path}/modules.json`;
        }
        else {
            throw new Error("Kanro config 'modules.json' not found.");
        }

        if (File.exists(`${path}/services.json`)) {
            files.serviceConfig = `${path}/services.json`;
        }
        else {
            throw new Error("Kanro config 'services.json' not found.");
        }

        if (File.exists(`${path}/executors.json`)) {
            files.executorsConfig = `${path}/executors.json`;
        }
        else {
            throw new Error("Kanro config 'executors.json' not found.");
        }

        return await ConfigBuilder.readConfigFromFile(files);
    }

    static async readConfigFromObject(config: IKanroConfigs): Promise<IKanroConfigs> {
        await ConfigBuilder.validate(config);
        return config;
    }

    static async validate(config: IKanroConfigs): Promise<IKanroConfigs> {
        if (config != undefined) {
            if (config.appConfig != undefined) {
                await ConfigBuilder.validateConfig(config.appConfig, "kanro");
            }
            else {
                throw new Error("appConfig is 'undefined'.");
            }

            if (config.modulesConfig != undefined) {
                await ConfigBuilder.validateConfig(config.modulesConfig, "modules");
            }
            else {
                throw new Error("modulesConfig is 'undefined'.");
            }

            if (config.serviceConfig != undefined) {
                await ConfigBuilder.validateConfig(config.serviceConfig, "services");
            }
            else {
                throw new Error("serviceConfig is 'undefined'.");
            }

            if (config.executorsConfig != undefined) {
                await ConfigBuilder.validateConfig(config.executorsConfig, "executors");
            }
            else {
                throw new Error("executorsConfig is 'undefined'.");
            }
        }
        else {
            throw new Error("Config is 'undefined'.");
        }

        return config;
    }

    private static async validateConfig(config: object, type: "executors" | "kanro" | "modules" | "services"): Promise<any> {
        await ConfigBuilder.initialize();

        if (!ConfigBuilder.ajv.validate(type, config)) {
            throw new InvalidConfigException(type, ConfigBuilder.ajv.errors.pop().message);
        }

        return config;
    }

    static async initialize() {
        if (ConfigBuilder.ajv != undefined) {
            return;
        }

        ConfigBuilder.ajv = new Ajv();

        let schemas = await File.readdir(`${projectDir}/schema`);

        for (let schema of schemas) {
            let file = `${projectDir}/schema/${schema}`;
            let fileInfo = Path.parse(schema);
            if (fileInfo.ext != ".json") {
                continue;
            }

            let schemaObject = await File.readJson(file);
            if (!ConfigBuilder.ajv.validateSchema(schemaObject)) {
                continue;
            }

            ConfigBuilder.ajv.addSchema(schemaObject, fileInfo.name);
        }
    }
}