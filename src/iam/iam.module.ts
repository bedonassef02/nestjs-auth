import { Module } from '@nestjs/common';
import { HashingService } from './hashing/hashing.service';
import { BcryptService } from './hashing/bcrypt.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenGuard } from './auth/guards/access-token.guard';
import { AuthGuard } from './auth/guards/auth.guard';
import { RefreshTokenIdsStorage } from './auth/refresh-token-ids.storage/refresh-token-ids.storage';
import { RolesGuard } from './authorization/guards/roles.guard';
import { PermissionsGuard } from './authorization/guards/permissions.guard';
import { PolicyHandlerStorate } from './authorization/polices/policy-handlers.storate';
import { FrameworkContributorPolicyHandler } from './authorization/polices/framework-contributor.policy';
import { ApiKeysService } from './auth/api-keys.service';
import { ApiKey } from 'src/users/api-keys/entities/api-key.entity';
import { ApiKeyGuard } from './auth/guards/api-key.guard';
import { OtpAuthService } from './auth/otp-auth.service';
import { GoogleAuthService } from './auth/social/google-auth.service';
import { GoogleAuthController } from './auth/social/google-auth.controller';

@Module({
  imports:[TypeOrmModule.forFeature([User, ApiKey]),
  JwtModule.registerAsync(jwtConfig.asProvider()),
  ConfigModule.forFeature(jwtConfig)
],
  providers: [
    {
      provide: HashingService,
      useClass: BcryptService,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      // useClass: RolesGuard
      useClass: PermissionsGuard
    },
    AccessTokenGuard,
    ApiKeyGuard,
    RefreshTokenIdsStorage,
    AuthService,
    PolicyHandlerStorate,
    FrameworkContributorPolicyHandler,
    ApiKeysService,
    OtpAuthService,
    GoogleAuthService,
  ],
  controllers: [AuthController, GoogleAuthController]
})
export class IamModule {}
