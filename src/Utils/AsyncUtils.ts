export class AsyncUtils {
    static async promise<T>(func: Function, thisArg: any = undefined, ...args: any[]): Promise<T> {
        return new Promise<T>((res, rej) => {
            let callback = function () {
                let result = undefined;

                for (let index in arguments) {
                    if (arguments[index] != undefined) {
                        if (typeof arguments[index].stack == "string") {
                            rej(arguments[index]);
                            return;
                        } else {
                            if (result == undefined) {
                                result = {};
                            }
                            result[index] = arguments[index];
                        }
                    }
                }

                if (Object.keys(result).length == 1) {
                    result = result[Object.keys(result)[0]];
                }

                res(result);
            }

            if (args == undefined) {
                args = [];
            }
            args.push(callback);

            func.call(thisArg, ...args);
        });
    }
}