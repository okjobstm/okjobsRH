import path from "node:path";

export const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "/var/recruit/uploads";

/**
 * Containment test for candidate-uploaded files. The root itself is refused:
 * it is a directory, and a stored value that resolves to it would let a caller
 * read the whole tree instead of one document.
 */
export function isInsideUploads(target: string): boolean {
  const root = path.resolve(UPLOADS_DIR);
  const resolved = path.resolve(target);
  return resolved !== root && resolved.startsWith(root + path.sep);
}

/**
 * Resolves a stored relative upload path. A value coming from the database is
 * never trusted to stay inside the uploads root: callers get null back and must
 * refuse the request rather than sanitise the path themselves.
 */
export function resolveInsideUploads(relativePath: string): string | null {
  const root = path.resolve(UPLOADS_DIR);
  const resolved = path.resolve(root, relativePath);
  return isInsideUploads(resolved) ? resolved : null;
}