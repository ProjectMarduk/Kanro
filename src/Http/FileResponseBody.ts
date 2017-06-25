import { IResponseBody } from "./IResponseBody";

import * as Http from "http";
import * as FileCore from "fs";
import * as FileType from "file-type";
import * as MimeType from "mime-types";
import * as ReadChunk from "read-chunk";
import { Path } from "../IO";

export class FileResponseBody implements IResponseBody {
    path: string;

    async write(response: Http.ServerResponse): Promise<any> {
        let ext = Path.extname(this.path);

        if (ext) {
            response.setHeader("content-type", MimeType.contentType(ext));
        }
        else {
            let buffer = await ReadChunk(this.path, 0, 4100);
            response.setHeader("content-type", FileType(buffer).mime);
        }

        await new Promise((res, rej) => {
            FileCore.createReadStream(this.path).pipe(response).on("finish", () => {
                res();
            });
        });
    }

    constructor(path: string) {
        this.path = path;
    }
}
