import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { authenticator } from 'otplib'

@Injectable()
export class OtpAuthService {
    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(User) private readonly userRepository: Repository<User>
    ) {
    }


    async generateSecret(email: string) {
        const secret = authenticator.generateSecret();
        const appName = this.configService.getOrThrow('TFA_APP_NAME');
        const uri = authenticator.keyuri(email, appName, secret);
        return { secret, uri };
    }

    verifyCode(code: string, secret: string) {
        return authenticator.verify({ token: code, secret });
    }

    async enableTfaForUser(email: string, secret: string) {
        const {id} = await this.userRepository.findOneOrFail(
            {
                where: { email },
                select: { id: true }
            }
        )
        // ideally we should encrypt secret (not hashing)
        await this.userRepository.update({ id }, { tfaSecret: secret, isTfaEnabled: true })
    }
}
