import fs from "fs";
import path from "path";
import { optimize } from "svgo";
import svgstore from "svgstore";

const RAW_DIR = "src/assets/icons/raw";
const OUTPUT_DIR = "public/icons";
const OUTPUT_FILE = "sprite.svg";
const OUTPUT_PATH = path.join(OUTPUT_DIR, OUTPUT_FILE);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cleanOldSprite() {
  if (fs.existsSync(OUTPUT_PATH)) {
    fs.unlinkSync(OUTPUT_PATH);
    console.log(`Removed old sprite: ${OUTPUT_PATH}`);
  }
}

function hasViewBox(svg) {
  return /viewBox\s*=\s*["'][^"']+["']/i.test(svg);
}

function getSvgSize(svg) {
  const widthMatch = svg.match(/width\s*=\s*["']([\d.]+)(px)?["']/i);
  const heightMatch = svg.match(/height\s*=\s*["']([\d.]+)(px)?["']/i);

  if (!widthMatch || !heightMatch) {
    return null;
  }

  const width = Number(widthMatch[1]);
  const height = Number(heightMatch[1]);

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }

  return { width, height };
}

function addViewBoxIfMissing(svg, file) {
  if (hasViewBox(svg)) {
    return svg;
  }

  const size = getSvgSize(svg);

  if (!size) {
    console.warn(
      `Warning: ${file} has no viewBox and no numeric width/height. Add viewBox manually.`
    );

    return svg;
  }

  const viewBox = `viewBox="0 0 ${size.width} ${size.height}"`;

  console.warn(
    `Warning: ${file} had no viewBox. Added ${viewBox}.`
  );

  return svg.replace("<svg", `<svg ${viewBox}`);
}

ensureDir(OUTPUT_DIR);
cleanOldSprite();

if (!fs.existsSync(RAW_DIR)) {
  console.error(`Raw icons directory does not exist: ${RAW_DIR}`);
  process.exit(1);
}

const sprites = svgstore({
  inline: true,
});

const files = fs
  .readdirSync(RAW_DIR)
  .filter((file) => file.endsWith(".svg"))
  .sort();

if (!files.length) {
  console.log("No SVG files found.");
  process.exit(0);
}

files.forEach((file) => {
  const filePath = path.join(RAW_DIR, file);
  const rawSvg = fs.readFileSync(filePath, "utf8");

  const svgWithViewBox = addViewBoxIfMissing(rawSvg, file);

  const result = optimize(svgWithViewBox, {
    path: filePath,
    configFile: path.resolve("svgo.config.js"),
  });

  const name = path.basename(file, ".svg");

  sprites.add(name, result.data);

  console.log(`Processed: ${file} -> #${name}`);
});

const spriteContent = sprites.toString({
  inline: false,
});

fs.writeFileSync(OUTPUT_PATH, spriteContent);

console.log(`SVG sprite generated successfully: ${OUTPUT_PATH}`);