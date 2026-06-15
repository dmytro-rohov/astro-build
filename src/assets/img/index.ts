// src/assets/img/index.ts

const modules = import.meta.glob('./*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default'
});

function filenameToAlt(filename: string) {
  return filename
    .replace(/\.(jpg|jpeg|png|webp|avif)$/i, '')
    .replace(/[-_]/g, ' ')
    .trim();
}

export const images = Object.fromEntries(
  Object.entries(modules).map(([path, src]) => {
    const filename = path.split('/').pop() as string;
    const key = filename.replace(/\.(jpg|jpeg|png|webp|avif)$/i, '');

    return [
      key,
      {
        src,
        alt: filenameToAlt(filename),
        kind: 'content' as const
      }
    ];
  })
);
