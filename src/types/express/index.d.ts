import { User as PrismaUser } from '../../generated/prisma';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface User extends Omit<PrismaUser, 'password_hash'> {}
  }
}
