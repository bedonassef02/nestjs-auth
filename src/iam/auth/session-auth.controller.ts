import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enum';
import { SessionAuthService } from './session-auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { promisify } from 'util';
import { Request } from 'express';
import { SessionGuard } from './guards/session.guard';
import { ActiveUser } from '../decorators/active-user.decorator';
import { ActiveUserData } from '../interfaces/active-user-data.interface';

@Auth(AuthType.None)
@Controller('session-auth')
export class SessionAuthController {
    constructor(
        private readonly sessionAuthService: SessionAuthService
    ) {
    }

    @HttpCode(HttpStatus.OK)
    @Post('sign-in')
    async signIn(
        @Req() request: Request,
        @Body() signInDto: SignInDto) {
        const user = await this.sessionAuthService.signIn(signInDto);
        await promisify(request.logIn).call(request, user);
    }

    @UseGuards(SessionGuard)
    @Get()
    async sayHello(@ActiveUser() user: ActiveUserData){
        return `Hello ${user.email}`
    }
}
