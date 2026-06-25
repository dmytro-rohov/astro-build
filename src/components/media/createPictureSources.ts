// src/lib/media/createPictureSources.ts

export type PictureSource = {
  srcset: string;
  media?: string;
  type?: string;
};

type SourceInput = {
  mobile?: ImageMetadata;
  tablet?: ImageMetadata;
  desktop?: ImageMetadata;
};

export function createPictureSources(input: SourceInput): PictureSource[] {
  const sources: PictureSource[] = [];

  if (input.mobile) {
    sources.push({
      srcset: input.mobile.src,
      media: "(max-width: 767px)",
    });
  }

  if (input.tablet) {
    sources.push({
      srcset: input.tablet.src,
      media: "(min-width: 768px) and (max-width: 1023px)",
    });
  }

  if (input.desktop) {
    sources.push({
      srcset: input.desktop.src,
      media: "(min-width: 1024px)",
    });
  }

  return sources;
}