import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    platformRole?: string[];
  }
  interface Session {
    user: {
      id: string;
      platformRole: string[];
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    platformRole?: string[];
  }
}
