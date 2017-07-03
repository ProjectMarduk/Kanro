import * as FileStream from 'fs';
import { Path } from "../IO";
import { StringUtils } from "../Utils/index";

let projectDir = Path.resolve(__dirname, '../..');

export class CoreLogger {
    private logFile: NodeJS.WritableStream;
    private errorFile: NodeJS.WritableStream;
    static time: number = -1;

    private constructor(logFile: string, errorFile: string) {
        if (logFile != undefined) {
            this.logFile = FileStream.createWriteStream(logFile, {'flags': 'a'});
        }
        if (errorFile != undefined) {
            this.errorFile = FileStream.createWriteStream(errorFile, {'flags': 'a'});
        }
    }

    private static instance: CoreLogger;

    public static get current() {
        if (CoreLogger.instance == undefined) {

            let config = {};
            if (FileStream.existsSync(`${process.cwd()}/logger.json`)) {
                config = require(`${process.cwd()}/logger.json`);
            }
            else if (FileStream.existsSync(`${projectDir}/config/logger.json`)) {
                config = require(`${projectDir}/config/logger.json`);
            }

            CoreLogger.instance = new CoreLogger(config['logFile'], config['errorFile']);
        }
        return CoreLogger.instance;
    }

    public log(message: string) {
        console.log(message);

        if(this.logFile != undefined){
            this.logFile.write(StringUtils.removeStyling(message) + '\n')
        }

        CoreLogger.time = Date.now();
    }

    public error(message: string) {
        console.error(message);
        
        let noStyling = StringUtils.removeStyling(message) + '\n';

        if(this.logFile != undefined){
            this.logFile.write(noStyling)
        }
        if(this.errorFile != undefined){
            this.errorFile.write(noStyling)
        }
        
        CoreLogger.time = Date.now();
    }
}