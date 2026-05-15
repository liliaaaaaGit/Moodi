import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(fileURLToPath(new URL("..", import.meta.url)));
const svg = readFileSync(join(root, "cursor-assets/icon-source.svg"));

const targets = [
  { path: "public/icon-180.png", size: 180 },
  { path: "public/icon-192.png", size: 192 },
  { path: "public/icon-512.png", size: 512 },
  { path: "public/apple-icon.png", size: 180 },
  { path: "public/favicon-32.png", size: 32 },
];

for (const t of targets) {
  const fullPath = join(root, t.path);
  mkdirSync(dirname(fullPath), { recursive: true });
  await sharp(svg).resize(t.size, t.size).png().toFile(fullPath);
  console.log(`Generated ${t.path}`);
}

console.log("Done.");
