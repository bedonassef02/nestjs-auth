import { Injectable } from "@nestjs/common";
import { Policy } from "./interfaces/policy.interface";
import { PolicyHandler } from "./interfaces/policy-handler.interface";
import { ActiveUserData } from "src/iam/interfaces/active-user-data.interface";
import { PolicyHandlerStorate } from "./policy-handlers.storate";

export class FrameworkContributorPolicy implements Policy{
    name: string = "frameworkContributor";
}

@Injectable()
export class FrameworkContributorPolicyHandler implements PolicyHandler<FrameworkContributorPolicy>{
    constructor(
        private readonly policyHandlerStorage: PolicyHandlerStorate
    ){

    }
    handle(policy: FrameworkContributorPolicy, user: ActiveUserData): void {
        const isContributor = user.email.endsWith("@nestjs.com");
        if(!isContributor){
            throw new Error("user is not a contributor")
        }
    }
    
}