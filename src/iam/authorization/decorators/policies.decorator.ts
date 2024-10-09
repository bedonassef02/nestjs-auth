import { SetMetadata } from "@nestjs/common";
import { Policy } from "../polices/interfaces/policy.interface";

export const POLICIES_KEY = 'policies';
export const Policies = (...policies:Policy[])=> SetMetadata(POLICIES_KEY, policies);