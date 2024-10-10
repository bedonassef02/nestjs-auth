import { ConflictException, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library'
import { AuthService } from '../auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GoogleAuthService implements OnModuleInit {
    private oauthClient: OAuth2Client;

    constructor(
        private readonly configService: ConfigService,
        private readonly authService: AuthService,
        @InjectRepository(User) private readonly userRepository: Repository<User>
    ) { }
    onModuleInit() {
        const clientId = this.configService.get('GOOGLE_CLIENT_ID');
        const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
        this.oauthClient = new OAuth2Client(clientId, clientSecret);
    }

    async authenticate(token: string) {
        try {
            const loginTicket = await this.oauthClient.verifyIdToken({ idToken: token });
            const { email, sub: googleId } = loginTicket.getPayload();
            const user = await this.userRepository.findOneBy({ googleId })
            if (user) {
                return this.authService.generateTokens(user);
            }
            const newUser = await this.userRepository.save({ email, googleId });
            return this.authService.generateTokens(newUser);
        }
        catch (err) {
            const pgUniqueViolationErrorCode = '23505';
            if (err.code === pgUniqueViolationErrorCode) {
                throw new ConflictException('Email already exists');
            }
            throw new UnauthorizedException()
        }
    }


}
