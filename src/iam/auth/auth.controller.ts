import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enum';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ActiveUser } from '../decorators/active-user.decorator';
import { ActiveUserData } from '../interfaces/active-user-data.interface';
import { Response } from 'express';
import { OtpAuthService } from './otp-auth.service';
import { toFileStream } from 'qrcode';

@Auth(AuthType.None)
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService,
        private readonly otpAuthService: OtpAuthService
    ) { }

    @Post('sign-up')
    signUp(@Body() signUpDto: SignUpDto) {
        return this.authService.signUp(signUpDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('sign-in')
    signIn(@Body() signInDto: SignInDto) {
        return this.authService.signIn(signInDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('refresh-tokens')
    refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshToken(refreshTokenDto);
    }

    @Auth(AuthType.Bearer)
    @HttpCode(HttpStatus.OK)
    @Post('2fa/generate')
    async generateQrCode(
        @ActiveUser() activeUser: ActiveUserData,
        @Res() response: Response
    ) {
        const { secret, uri } = await this.otpAuthService.generateSecret(activeUser.email)
        await this.otpAuthService.enableTfaForUser(activeUser.email, secret)
        response.type('png')
        return toFileStream(response, uri);
    }
}
