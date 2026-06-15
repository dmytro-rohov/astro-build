export default {
  multipass: true,
  plugins: [
    "preset-default",
    {
      name: "removeViewBox",
      active: false
    },
    {
      name: "removeDimensions",
      active: true
    },
    {
      name: "removeAttrs",
      params: {
        attrs: "(fill|stroke)"
      }
    }
  ]
};