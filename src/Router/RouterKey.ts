import { RouterKeyType } from "./RouterKeyType";

export class RouterKey {
    key: string;
    regex: RegExp;
    type: RouterKeyType;

    constructor(stringKey: string) {
        if (stringKey == "*") {
            this.key = stringKey;
            this.type = RouterKeyType.Wildcard;
        }
        else if (stringKey == "**") {
            this.key = stringKey;
            this.type = RouterKeyType.Wildcard;
        }
        else if (stringKey.startsWith("{") && stringKey.endsWith("}")) {
            this.type = RouterKeyType.Param;
            let index = stringKey.indexOf(":")
            if (index < 0) {
                this.key = stringKey.slice(1, stringKey.length - 1);
            }
            else {
                this.key = stringKey.slice(1, index);
                this.regex = new RegExp(stringKey.slice(index + 1, stringKey.length - 1));
            }
        }
        else {
            this.type = RouterKeyType.Path;
            this.key = stringKey;
        }
    }

    match(path: string) {
        switch (this.type) {
            case RouterKeyType.Wildcard:
                return true;
            case RouterKeyType.Param:
                if (path != undefined) {
                    if (this.regex != undefined) {
                        return this.regex.test(path);
                    } else {
                        return true;
                    }
                }
                return false;
            case RouterKeyType.Path:
                if (path != undefined) {
                    return path == this.key;
                }
                return false;
            default:
                return false;
        }
    }
}