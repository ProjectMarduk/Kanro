export class ObjectUtils {
    static copy<T>(object: T): T {
        if (Array.isArray(object)) {
            return <any>[].concat(object);
        }

        return JSON.parse(JSON.stringify(object));
    }

    static isEmptyObject(obj: any): boolean {
        return !Object.keys(obj).length;
    }

    static getValueFormKeys(object: any, ...keys: PropertyKey[]): any {
        if (object == null) {
            return undefined;
        }

        for (let key of keys) {
            if (object[key] == null) {
                return undefined;
            }

            object = object[key];
        }

        return object;
    }

    static setValueFormKeys(object: any, value: any, ...keys: PropertyKey[]): void {
        for (let index: number = 0; index < keys.length - 1; index++) {
            let key: PropertyKey = keys[index];

            if (object[key] == null) {
                object[key] = {};
            }

            object = object[key];
        }

        object[keys[keys.length - 1]] = value;
    }
}