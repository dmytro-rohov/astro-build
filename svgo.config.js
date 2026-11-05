export default {
  multipass: true,
  plugins: [
    "preset-default",
    "removeDimensions",
    // Every color becomes currentColor, so icons follow the text color
    // in light and dark schemes. "none" stays untouched.
    {
      name: "convertColors",
      params: {
        currentColor: true,
      },
    },
  ],
};
