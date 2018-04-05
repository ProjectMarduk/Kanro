export class ServiceProxyHandler implements ProxyHandler<any> {
    getPrototypeOf(target: any): object | null {
        throw new Error("getPrototypeOf");
    }
    setPrototypeOf(target: any, v: any): boolean {
        throw new Error("setPrototypeOf");
    }
    isExtensible(target: any): boolean {
        return false;
    }
    preventExtensions(target: any): boolean {
        return true;
    }
    getOwnPropertyDescriptor(target: any, p: PropertyKey): PropertyDescriptor | undefined {
        throw new Error("getOwnPropertyDescriptor");
    }
    has(target: any, p: PropertyKey): boolean {
        throw new Error("has");
    }
    get(target: any, p: PropertyKey, receiver: any): any {
        throw new Error("get");
    }
    set(target: any, p: PropertyKey, value: any, receiver: any): boolean {
        throw new Error("set");
    }
    deleteProperty(target: any, p: PropertyKey): boolean {
        throw new Error("deleteProperty");
    }
    defineProperty(target: any, p: PropertyKey, attributes: PropertyDescriptor): boolean {
        throw new Error("defineProperty");
    }
    enumerate(target: any): PropertyKey[] {
        throw new Error("enumerate");
    }
    ownKeys(target: any): PropertyKey[] {
        throw new Error("ownKeys");
    }
    apply(target: any, thisArg: any, argArray?: any): any {
        throw new Error("apply");
    }
    construct(target: any, argArray: any, newTarget?: any): object {
        throw new Error("construct");
    }
}