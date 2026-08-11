/**
 * Minimal ambient declarations for the Bun runtime APIs used by serve.ts.
 * The Bun runtime is always present in this environment; these declarations
 * exist only so `bunx tsc --noEmit` can type-check the server wrapper without
 * adding the full @types/bun dependency.
 */
declare namespace Bun {
  interface BunFile extends Blob {
    exists(): Promise<boolean>;
  }
  interface ServeOptions {
    port: number;
    hostname: string;
    fetch(req: Request): Response | Promise<Response>;
  }
  function serve(options: ServeOptions): void;
  function file(path: string): BunFile;
  function sleep(ms: number): Promise<void>;
  const $: (strings: TemplateStringsArray, ...values: unknown[]) => {
    quiet(): { nothrow(): Promise<unknown> };
  };
}

interface ImportMeta {
  /** Absolute path to the directory of the current module (Bun). */
  dir: string;
}
