import { IModuleInfo } from "./IModuleInfo";
import { ExceptionHandler } from "./ExceptionHandler";
import { Fuse } from "./Fuse";
import { Service } from "./Service";
import { Node } from "./Node";
import { INodeReference } from "./INodeReference";

export interface INodeContainer<T extends Node> extends INodeReference{
    exceptionHandlers?: INodeContainer<ExceptionHandler>[];
    fuses?: INodeContainer<Fuse>[];
    dependencies?: { [name: string]: INodeContainer<Service> };
    instance?: T;
    next?: INodeContainer<Node> | INodeContainer<Node>[];
}