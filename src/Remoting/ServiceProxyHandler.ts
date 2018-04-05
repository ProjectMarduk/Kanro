import { RemoteServiceException } from "../Exceptions";

export class ServiceProxyHandler implements ProxyHandler<any> {
    getPrototypeOf(target: any): object | null {
        throw new RemoteServiceException("getPrototypeOf");
    }
    setPrototypeOf(target: any, v: any): boolean {
        throw new RemoteServiceException("setPrototypeOf");
    }
    isExtensible(target: any): boolean {
        return false;
    }
    preventExtensions(target: any): boolean {
        return true;
    }
    getOwnPropertyDescriptor(target: any, p: PropertyKey): PropertyDescriptor | undefined {
        throw new RemoteServiceException("getOwnPropertyDescriptor");
    }
    has(target: any, p: PropertyKey): boolean {
        throw new RemoteServiceException("has");
    }
    get(target: any, p: PropertyKey, receiver: any): any {
        throw new RemoteServiceException("get");
    }
    set(target: any, p: PropertyKey, value: any, receiver: any): boolean {
        throw new RemoteServiceException("set");
    }
    deleteProperty(target: any, p: PropertyKey): boolean {
        throw new RemoteServiceException("deleteProperty");
    }
    defineProperty(target: any, p: PropertyKey, attributes: PropertyDescriptor): boolean {
        throw new RemoteServiceException("defineProperty");
    }
    enumerate(target: any): PropertyKey[] {
        throw new RemoteServiceException("enumerate");
    }
    ownKeys(target: any): PropertyKey[] {
        throw new RemoteServiceException("ownKeys");
    }
    apply(target: any, thisArg: any, argArray?: any): any {
        throw new RemoteServiceException("apply");
    }
    construct(target: any, argArray: any, newTarget?: any): object {
        throw new RemoteServiceException("construct");
    }
}