import { registerAs } from '@nestjs/config';

export default registerAs('credentials', () => ({
  encryptionKey:
    process.env.CREDENTIAL_ENCRYPTION_KEY || 'default_encryption_key',
}));
