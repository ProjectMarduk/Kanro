import * as FileStream from "fs";
import { File, Path } from "../IO";
import { StringUtils } from "../Utils/index";
import { ILogConfig } from "./ILogConfig";

let projectDir: string = Path.resolve(__dirname, "../..");

export class CoreLogger {
    private logFile: NodeJS.WritableStream;
    private errorFile: NodeJS.WritableStream;
    static time: number = -1;

    private constructor(logFile: string, errorFile: string) {
        if (logFile != null) {
            File.createDirSync(Path.dirname(logFile));
            this.logFile = FileStream.createWriteStream(logFile, { "flags": "a" });
        }
        if (errorFile != null) {
            File.createDirSync(Path.dirname(errorFile));
            this.errorFile = FileStream.createWriteStream(errorFile, { "flags": "a" });
        }
    }

    private static instance: CoreLogger;

    static get current(): CoreLogger {
        if (CoreLogger.instance == null) {

            let config: ILogConfig;
            if (FileStream.existsSync(`${process.cwd()}/logger.json`)) {
                config = require(`${process.cwd()}/logger.json`);
            } else if (FileStream.existsSync(`${projectDir}/config/logger.json`)) {
                config = require(`${projectDir}/config/logger.json`);
            }

            CoreLogger.instance = new CoreLogger(config.logFile, config.errorFile);
        }
        return CoreLogger.instance;
    }

    log(message: string): void {
        console.log(message);

        if (this.logFile != null) {
            this.logFile.write(StringUtils.removeStyling(message) + "\n");
        }

        CoreLogger.time = Date.now();
    }

    error(message: string): void {
        console.error(message);

        let noStyling: string = StringUtils.removeStyling(message) + "\n";

        if (this.logFile != null) {
            this.logFile.write(noStyling);
        }
        if (this.errorFile != null) {
            this.errorFile.write(noStyling);
        }

        CoreLogger.time = Date.now();
    }
}