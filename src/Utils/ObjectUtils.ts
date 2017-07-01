export class ObjectUtils {
    static copy<T>(object: T): T {
        if (Array.isArray(object)) {
            return <any>[].concat(object);
        }

        return { ... <any>object };
    }

    static isEmptyObject(obj) {
        return !Object.keys(obj).length;
    }

    static getValueFormKeys(object, ...keys: (string | number)[]) {
        for (let key of keys) {
            if (object[key] == undefined) {
                return undefined;
            }

            object = object[key];
        }

        return object;
    }

    static setValueFormKeys(object, value, ...keys: (string | number)[]) {
        for (var index = 0; index < keys.length - 1; index++) {
            var key = keys[index];

            if (object[key] == undefined) {
                object[key] = {};
            }

            object = object[key];
        }

        object[keys[keys.length - 1]] = value;
    }
}