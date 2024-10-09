import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { HashingService } from '../hashing/hashing.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { ActiveUserData } from '../interfaces/active-user-data.interface';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { IvalidatedRefreshTokenError, RefreshTokenIdsStorage } from './refresh-token-ids.storage/refresh-token-ids.storage';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        private readonly hashingService: HashingService,
        private readonly jwtService: JwtService,
        @Inject(jwtConfig.KEY) private readonly jwtConfigration: ConfigType<typeof jwtConfig>,
        private readonly refreshTokenIdsStorate: RefreshTokenIdsStorage,
    ) { }

    async signUp(signUpDto: SignUpDto) {
        try {
            const user = new User();
            user.email = signUpDto.email;
            user.password = await this.hashingService.hash(signUpDto.password);
            await this.userRepository.save(user);
        } catch (err) {
            const pgUniqueViolationErrorCode = '23505';
            if (err.code === pgUniqueViolationErrorCode) {
                throw new ConflictException('Email already exists');
            }
            throw err;
        }
    }

    async signIn(signInDto: SignInDto) {
        const user = await this.userRepository.findOneBy({
            email: signInDto.email
        })
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }
        const isEqual = await this.hashingService.compare(signInDto.password, user.password)
        if (!isEqual) {
            throw new UnauthorizedException('Password mismatch with user');
        }
        return await this.generateTokens(user);
    }

    private async generateTokens(user: User) {
        const refreshTokenId = randomUUID();
        const [accessToken, refreshToken] = await Promise.all([
            this.signToken<Partial<ActiveUserData>>(user.id, this.jwtConfigration.accessTokenTtl, { email: user.email, role: user.role }),
            this.signToken(user.id, this.jwtConfigration.refreshTokenTtl, { refreshTokenId })
        ]);
        await this.refreshTokenIdsStorate.insert(user.id, refreshTokenId);
        return {
            accessToken,
            refreshToken,
        };
    }

    private async signToken<T>(userId: number, expiresIn: number, payload?: T) {
        return await this.jwtService.signAsync(
            {
                sub: userId,
                ...payload
            },
            {
                audience: this.jwtConfigration.audience,
                issuer: this.jwtConfigration.issuer,
                secret: this.jwtConfigration.secret,
                expiresIn,
            }
        );
    }

    async refreshToken(refreshTokenDto: RefreshTokenDto) {
        try {
            const { sub, refreshTokenId } = await this.jwtService.verifyAsync<
                Pick<ActiveUserData, 'sub'> & {refreshTokenId: string}
            >(refreshTokenDto.refreshToken, {
                secret: this.jwtConfigration.secret,
                audience: this.jwtConfigration.audience,
                issuer: this.jwtConfigration.issuer,
            })
            const user = await this.userRepository.findOneByOrFail({ id: sub })
            const isValid = await this.refreshTokenIdsStorate.validate(user.id, refreshTokenId);
            if(isValid){
                await this.refreshTokenIdsStorate.invalidate(user.id)
            }else{
                throw new Error('Refresh Token is invalid')
            }
            return this.generateTokens(user);
        } catch (err) {
            if (err instanceof IvalidatedRefreshTokenError){
                // Take Action: notify user that his refresh token might have been stolen?
                throw new UnauthorizedException('Access denied')
            }
            throw new UnauthorizedException()
        }
    }
}
