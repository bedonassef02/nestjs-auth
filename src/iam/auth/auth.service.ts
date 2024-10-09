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

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        private readonly hashingService: HashingService,
        private readonly jwtService: JwtService,
        @Inject(jwtConfig.KEY) private readonly jwtConfigration: ConfigType<typeof jwtConfig>,
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
        const accessToken = await this.jwtService.signAsync(
            {
                sub: user.id,
                email: user.email
            },
            {
                audience: this.jwtConfigration.audience,
                issuer: this.jwtConfigration.issuer,
                secret: this.jwtConfigration.secret,
                expiresIn: this.jwtConfigration.accessTokenTtl,
            }
        )
        return {
            accessToken
        }
    }
}
