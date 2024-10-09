import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enum';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Auth(AuthType.None)
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService){}

    @Post('sign-up')
    signUp(@Body() signUpDto: SignUpDto){
        return this.authService.signUp(signUpDto);
    }    

    @HttpCode(HttpStatus.OK)
    @Post('sign-in')
    signIn(@Body() signInDto: SignInDto){
        return this.authService.signIn(signInDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('refresh-tokens')
    refreshToken(@Body() refreshTokenDto: RefreshTokenDto){
        return this.authService.refreshToken(refreshTokenDto);
    }
}
