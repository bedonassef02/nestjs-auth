import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ActiveUserData } from 'src/iam/interfaces/active-user-data.interface';
import { REQUEST_USER_KEY } from 'src/iam/iam.constants';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionType } from '../permission.type';

@Injectable()
export class PermissionsGuard implements CanActivate {

  constructor(
    private readonly reflector: Reflector
  ){}

  canActivate(
    context: ExecutionContext,
  ){
    const contextPermissions = this.reflector.getAllAndOverride<PermissionType[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if(!contextPermissions){
      return true;
    }
    const user: ActiveUserData = context.switchToHttp().getRequest()[REQUEST_USER_KEY];
    return contextPermissions.every(permission => user.permissions.includes(permission));

  }
}
