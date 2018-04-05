import { IModuleInfo } from ".";

export interface INodeReference {
    id?: string;
    name: string;
    module: IModuleInfo;
}