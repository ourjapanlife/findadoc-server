export {}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SERVER_PORT: number;
      ENV: 'test' | 'dev' | 'prod';
    }
  }
}
