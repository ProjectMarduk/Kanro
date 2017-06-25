export interface ILogger {
    success(message: string);
    error(message: string);
    info(message: string);
}