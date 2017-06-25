import { AsyncUtils } from "../Utils";
import * as FileModule from "fs";

export class File {
    static async unlink(path: string | Buffer): Promise<void> {
        return await AsyncUtils.promise<void>(FileModule.unlink, undefined, path);
    }

    static async exists(path: string | Buffer): Promise<boolean> {
        return await AsyncUtils.promise<boolean>(FileModule.exists, undefined, path);
    }

    static async rename(oldPath: string, newPath: string): Promise<boolean> {
        return await AsyncUtils.promise<boolean>(FileModule.rename, undefined, oldPath, newPath);
    }

    static async readJson(path: string): Promise<object> {
        let data = await AsyncUtils.promise<Buffer>(FileModule.readFile, undefined, path);
        return JSON.parse(data.toString());
    }

    static async readFile(path: string): Promise<Buffer> {
        return await AsyncUtils.promise<Buffer>(FileModule.readFile, undefined, path);
    }

    static async readdir(path: string): Promise<string[]> {
        return await AsyncUtils.promise<string[]>(FileModule.readdir, undefined, path);
    }
}