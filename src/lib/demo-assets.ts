import hero from "@/assets/hero.jpg";
import b1 from "@/assets/b1.jpg";
import b2 from "@/assets/b2.jpg";
import b3 from "@/assets/b3.jpg";

/** Local demo-tenant images used when Storage is not configured. */
export const demoImages: Record<string, string> = {
  "hero.jpg": hero,
  "b1.jpg": b1,
  "b2.jpg": b2,
  "b3.jpg": b3,
};

/** Resolves a storage-like path against bundled demo assets when possible. */
export function resolveDemoImage(path: string | null | undefined): string | null {
  if (!path) return null;
  const file = path.split("/").pop() ?? path;
  return demoImages[file] ?? path;
}
