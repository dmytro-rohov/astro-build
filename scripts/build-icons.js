import fs from "fs";
import path from "path";
import { optimize } from "svgo";
import svgstore from "svgstore";

const RAW_DIR = "src/assets/icons/raw";
const OUTPUT_DIR = "public/icons";
const OUTPUT_FILE = "sprite.svg";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const sprites = svgstore({
  inline: true
});

const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith(".svg"));

if (!files.length) {
  console.log("No SVG files found.");
  process.exit(0);
}

files.forEach(file => {
  const filePath = path.join(RAW_DIR, file);
  const svg = fs.readFileSync(filePath, "utf8");

  const result = optimize(svg, {
    path: filePath,
    configFile: path.resolve("svgo.config.js")
  });

  const name = path.basename(file, ".svg");

  sprites.add(name, result.data);
  console.log(`Processed: ${file}`);
});

const spriteContent = sprites.toString({
  inline: false
});

fs.writeFileSync(
  path.join(OUTPUT_DIR, OUTPUT_FILE),
  spriteContent
);

console.log("SVG sprite generated successfully.");