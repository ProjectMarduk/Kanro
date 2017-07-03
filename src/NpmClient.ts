import * as Npm from 'npm';
import { LoggerManager } from "./LoggerManager";
import { Colors, Style, AnsiStyle } from "./Logging";
import { AsyncUtils } from "./Utils";
import { File, Path } from "./IO";

let npmLogger = LoggerManager.current.registerLogger("NPM", AnsiStyle.create().foreground(Colors.cyan));

export class NpmClient {
    public static async install(name: String, version: String = '*'): Promise<any> {
        let moduleId = `${name}@${version}`;

        try {
            npmLogger.info(`Module '${moduleId}' installing...`);
            let installResult = await AsyncUtils.promise<string[]>(Npm.commands.install, Npm, [`${moduleId}`, ' --quiet']);
            let data = installResult[0].split("@");
            let moduleName = data[0];
            let moduleVersion = data[1];
            npmLogger.success(Style`NPM install module '${AnsiStyle.create().foreground(Colors.magenta)}${`${moduleName}@${moduleVersion}`}' success.`);
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
            npmLogger.error(`NPM install module '${moduleId}' fail, message: '${error.message}'.`);
        }
    }

    public static async initialize(npmConfig): Promise<void> {
        try {
            await AsyncUtils.promise(Npm.load, Npm, npmConfig);
            if (npmConfig.registry != undefined) {
                npmLogger.info(`Set NPM registry to '${npmConfig.registry}'.`);
            }

            Npm.on('log', message => {
                npmLogger.info(message);
            });
        } catch (error) {
            npmLogger.error(`NPM initialize failed! Message: ${error.message}.\n    ${error.stack}`);
        }
    }
}