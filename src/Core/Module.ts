import { IModuleInfo } from "./IModuleInfo";
import { INodeContainer } from "./INodeContainer";
import { Node } from "./Node";

export abstract class Module {
    /**
     * Get a node by a node config.
     *
     * Note: Kanro 会对每个 node config 调用这个方法，对于同样的名字的 node 如果模块返回的是不同示例，
     * 则会导致在链路中也会使用不同的实例，反之如果对每个相同名字的 node 都返回同一个实例，则会导致这个
     * 实例可能被用在多个链路上，如果你需要共享上下文则可以考虑这种方式。请根据具体的需求来返回单例。
     * 另外所有的 Service 类型的 Node 都是单例，除非指定了 Service 的 ID。
     *
     * @param {INodeContainer<Node>} container
     * @returns {Promise<Node>}
     * @memberof IModule
     */
    abstract getNode(container: INodeContainer<Node>): Promise<Node>;


    abstract readonly nodes: Array<string>;
}