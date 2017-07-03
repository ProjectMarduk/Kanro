export interface ILogger {
    info(message: string);
    error(message: string);
    success(message: string);
    warning(message: string);
}