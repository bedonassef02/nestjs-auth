import { Injectable, Type } from "@nestjs/common";
import { Policy } from "./interfaces/policy.interface";
import { PolicyHandler } from "./interfaces/policy-handler.interface";

@Injectable()
export class PolicyHandlerStorate{
    private readonly collection = new Map<Type<Policy>, PolicyHandler<any>>();

    add<T extends Policy>(policyCls: Type<T>, handler: PolicyHandler<T>){
        this.collection.set(policyCls, handler);
    }

    get<T extends Policy>(policyCls: Type<T>): PolicyHandler<T> | undefined{
        const handler = this.collection.get(policyCls);
        if(!handler){
            throw new Error(`No handler found for policy ${policyCls.name}`);
        }
        return handler;
    }
} 