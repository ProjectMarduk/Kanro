import * as Npm from "npm";
import { AnsiStyle, Colors, ILogger, Style } from "./Logging";
import { AsyncUtils } from "./Utils";
import { File, Path } from "./IO";
import { IAppConfig } from "./IAppConfig";
import { IModuleInfo, Service } from "./Core";
import { KanroInternalModule } from "./KanroInternalModule";
import { LoggerManager } from "./LoggerManager";

export class NpmClient extends Service {
    dependencies = {
        loggerManager: {
            name: LoggerManager.name,
            module: KanroInternalModule.moduleInfo
        }
    };

    constructor() {
        super(undefined);
    }

    private npmLogger: ILogger;

    readonly isProxable: boolean = false;

    async install(name: String, version: String = "*"): Promise<any> {
        let moduleId: string = `${name}@${version}`;

        try {
            this.npmLogger.info(`Module '${moduleId}' installing...`);
            let installResult: string[] = await AsyncUtils.promise<string[]>(Npm.commands.install, Npm, [`${moduleId}`, " --quiet"]);
            let data: string[] = installResult[0].split("@");
            let moduleName: string = data[0];
            let moduleVersion: string = data[1];
            // tslint:disable-next-line:max-line-length
            this.npmLogger.success(Style`NPM install module '${AnsiStyle.create().foreground(Colors.magenta)}${`${moduleName}@${moduleVersion}`}' success.`);
            let newPath: string = `${Path.parse(installResult[1]).dir}/.${moduleVersion}@${moduleName}`;

            if (await File.exists(newPath)) {
                await File.unlink(newPath);
            }
            await File.rename(installResult[1], newPath);

            if (version === "*") {
                await File.symlink(newPath, `${Path.parse(installResult[1]).dir}/${moduleName}`, "dir");
            }

            return require(`.${moduleVersion}@${moduleName}`);
        } catch (error) {
            this.npmLogger.error(`NPM install module '${moduleId}' fail, message: '${error.message}'.`);
        }
    }

    async initialize(npmConfig: IAppConfig): Promise<void> {
        try {
            await AsyncUtils.promise(Npm.load, Npm, npmConfig);
            if (npmConfig.registry != null) {
                this.npmLogger.info(`Set NPM registry to '${npmConfig.registry}'.`);
            }

            Npm.on("log", message => {
                this.npmLogger.info(message);
            });
        } catch (error) {
            this.npmLogger.error(`NPM initialize failed! Message: ${error.message}.\n    ${error.stack}`);
        }
    }

    async onLoaded(): Promise<void> {
        this.npmLogger = await (await this.getDependedService<LoggerManager>("loggerManager"))
            .registerLogger("NPM", AnsiStyle.create().foreground(Colors.cyan));
    }
}