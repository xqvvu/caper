declare module "bun" {
  interface Env {
    readonly SERVER_PORT: string;
    readonly MONGODB_URI: string;
  }
}
