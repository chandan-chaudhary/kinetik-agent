import { registerAs } from '@nestjs/config';

export default registerAs('marketApi', () => ({
  alpacaApiKey: process.env.ALPACA_API_KEY || 'PK4QTAS4CFON2VTVFG5HC4YCBI',
  alpacaApiSecret:
    process.env.ALPACA_API_SECRET ||
    '2FPnLp3Bvq5VD4XjnVVMrD1qUS68mA6738h4Edd8NaQh',
  alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY || 'SYDHAU9PGVNZ51K2',
}));
