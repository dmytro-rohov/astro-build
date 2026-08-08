const [major, minor] = process.versions.node
  .split(".")
  .map(Number);

const isSupported =
  major === 24 && minor >= 16;

if (!isSupported) {
  console.error(
    [
      "",
      `Unsupported Node.js version: ${process.version}`,
      "This project requires Node.js >=24.16.0 and <25.",
      "",
      "With nvm, run:",
      "  nvm install",
      "  nvm use",
      "",
    ].join("\n"),
  );

  process.exit(1);
}

console.log(`Using supported Node.js version: ${process.version}`);