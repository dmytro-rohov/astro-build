/** Minimal flag parser: --site <dir> --out <dir>. */
export function getFlag(name: string, args = process.argv.slice(2)): string | undefined {
  const index = args.indexOf(`--${name}`);
  if (index !== -1) return args[index + 1];

  const inline = args.find((arg) => arg.startsWith(`--${name}=`));
  return inline?.slice(name.length + 3);
}
