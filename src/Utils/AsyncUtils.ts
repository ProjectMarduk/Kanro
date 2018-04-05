export class AsyncUtils {
    static async promise<T>(func: Function, thisArg?: any, ...args: any[]): Promise<T> {
        return new Promise<T>((res, rej) => {
            let callback: () => void = function (): void {
                let result: any;

                for (let index in arguments) {
                    if (arguments[index] != null) {
                        if (typeof arguments[index].stack === "string") {
                            rej(arguments[index]);
                            return;
                        } else {
                            if (result == null) {
                                result = {};
                            }
                            result[index] = arguments[index];
                        }
                    }
                }

                if (Object.keys(result).length === 1) {
                    result = result[Object.keys(result)[0]];
                }

                res(result);
            };

            if (args == null) {
                args = [];
            }
            args.push(callback);

            func.call(thisArg, ...args);
        });
    }
}