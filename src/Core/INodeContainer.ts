import { ExceptionHandler } from "./ExceptionHandler";
import { Fuse } from "./Fuse";
import { IModuleInfo } from "./IModuleInfo";
import { INodeReference } from "./INodeReference";
import { Node, Service } from "./Node";

export interface INodeContainer<T extends Node> extends INodeReference {
    exceptionHandlers?: INodeContainer<ExceptionHandler>[];
    fuses?: INodeContainer<Fuse>[];
    dependencies?: { [name: string]: INodeContainer<Service> };
    instance?: T;
    next?: INodeContainer<Node> | INodeContainer<Node>[];
}