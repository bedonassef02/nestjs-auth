import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { HashingService } from '../hashing/hashing.service';
import { SignInDto } from './dto/sign-in.dto';

@Injectable()
export class SessionAuthService {
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly hashingService: HashingService
    ) {}

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
        return user;
    }
}
