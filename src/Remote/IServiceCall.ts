import { ServiceCallType } from "./ServiceCallType";

export interface IServiceCall {
    type: ServiceCallType;
    args: any[];
}