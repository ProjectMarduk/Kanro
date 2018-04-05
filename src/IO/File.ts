import * as FileModule from "fs";
import * as Path from "path";
import { AsyncUtils } from "../Utils";

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
        let data: Buffer = await AsyncUtils.promise<Buffer>(FileModule.readFile, undefined, path);
        return JSON.parse(data.toString());
    }

    static async readFile(path: string): Promise<Buffer> {
        return await AsyncUtils.promise<Buffer>(FileModule.readFile, undefined, path);
    }

    static async readdir(path: string): Promise<string[]> {
        return await AsyncUtils.promise<string[]>(FileModule.readdir, undefined, path);
    }

    static async symlink(path: string, target: string, type: string): Promise<void> {
        return await AsyncUtils.promise<void>(FileModule.symlink, undefined, path, target, type);
    }

    static async createDir(path: string): Promise<void> {
        if (await File.exists(path)) {
            return;
        }

        await File.createDir(Path.dirname(path));
        await AsyncUtils.promise<void>(FileModule.mkdir, undefined, path);
    }

    static createDirSync(path: string): void {
        if (FileModule.existsSync(path)) {
            return;
        }

        File.createDirSync(Path.dirname(path));
        FileModule.mkdirSync(path);
    }
}