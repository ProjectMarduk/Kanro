import * as Npm from 'npm';
import { LoggerManager } from "./LoggerManager";
import { Colors, Style, AnsiStyle, ILogger } from "./Logging";
import { AsyncUtils } from "./Utils";
import { File, Path } from "./IO";
import { Service, IModuleInfo } from './Core';
import { KanroInternalModule } from './KanroInternalModule';
import { IAppConfig } from './IAppConfig';

export class NpmClient extends Service {
    dependencies = {
        loggerManager: {
            name: LoggerManager.name,
            module: KanroInternalModule.moduleInfo
        }
    }

    constructor(){
        super(undefined);
    }

    private npmLogger : ILogger

    public get isProxable(){
        return false;
    }

    public async install(name: String, version: String = '*'): Promise<any> {
        let moduleId = `${name}@${version}`;

        try {
            this.npmLogger.info(`Module '${moduleId}' installing...`);
            let installResult = await AsyncUtils.promise<string[]>(Npm.commands.install, Npm, [`${moduleId}`, ' --quiet']);
            let data = installResult[0].split("@");
            let moduleName = data[0];
            let moduleVersion = data[1];
            this.npmLogger.success(Style`NPM install module '${AnsiStyle.create().foreground(Colors.magenta)}${`${moduleName}@${moduleVersion}`}' success.`);
            let newPath = `${Path.parse(installResult[1]).dir}/.${moduleVersion}@${moduleName}`;

            if (await File.exists(newPath)) {
                await File.unlink(newPath);
            }
            await File.rename(installResult[1], newPath);

            if(version == "*"){
                await File.symlink(newPath, `${Path.parse(installResult[1]).dir}/${moduleName}`, 'dir');
            }

            return require(`.${moduleVersion}@${moduleName}`);
        } catch (error) {
            this.npmLogger.error(`NPM install module '${moduleId}' fail, message: '${error.message}'.`);
        }
    }

    public async initialize(npmConfig: IAppConfig): Promise<void> {
        try {
            await AsyncUtils.promise(Npm.load, Npm, npmConfig);
            if (npmConfig.registry != undefined) {
                this.npmLogger.info(`Set NPM registry to '${npmConfig.registry}'.`);
            }

            Npm.on('log', message => {
                this.npmLogger.info(message);
            });
        } catch (error) {
            this.npmLogger.error(`NPM initialize failed! Message: ${error.message}.\n    ${error.stack}`);
        }
    }

    async onLoaded(): Promise<void>{
        this.npmLogger = this.getDependedService<LoggerManager>("loggerManager").registerLogger("NPM", AnsiStyle.create().foreground(Colors.cyan));
    }
}