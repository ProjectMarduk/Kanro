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
}