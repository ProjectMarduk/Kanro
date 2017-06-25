/**
 * Type of executors.
 * 
 * @export
 * @enum {number}
 */
export enum ExecutorType {
    RequestHandler,
    RequestDiverter,
    RequestReplicator,
    Responder,
    ResponseHandler,
    ExceptionHandler,
    Fuse,
    GlobalRequestHandler,
    GlobalResponseHandler,
    GlobalExceptionHandler,
    Service
}