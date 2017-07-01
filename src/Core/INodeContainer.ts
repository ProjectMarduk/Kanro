import { IModuleInfo } from "./IModuleInfo";
import { ExceptionHandler } from "./ExceptionHandler";
import { Fuse } from "./Fuse";
import { Service } from "./Service";
import { Node } from "./Node";

export interface INodeContainer<T extends Node> {
    name: string;
    module: IModuleInfo;
    exceptionHandlers?: INodeContainer<ExceptionHandler>[];
    fuses?: INodeContainer<Fuse>[];
    dependencies?: { [name: string]: INodeContainer<Service> };
    instance?: T;
    next?: INodeContainer<Node> | INodeContainer<Node>[];
}