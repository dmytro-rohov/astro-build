export default {
  extends: ["stylelint-config-standard-scss"],

  ignoreFiles: [
    "dist/**/*",
    "public/icons/sprite.svg",
    "src/styles/abstracts/_tokens.scss",
    "src/styles/abstracts/_fonts.scss",
  ],

  rules: {
    "selector-class-pattern": [
      "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__(?:[a-z0-9]+-?)+)?(?:--(?:[a-z0-9]+-?)+)?$",
      {
        message:
          "Expected class selector to follow kebab-case or BEM naming.",
      },
    ],

    "property-no-vendor-prefix": null,
    "value-no-vendor-prefix": null,
  },
};