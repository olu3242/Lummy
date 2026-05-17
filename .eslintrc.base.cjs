module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: "latest"
  },
  plugins: ["boundaries"],
  settings: {
    "boundaries/elements": [
      { type: "ui", pattern: "src/**" },
      { type: "apps", pattern: "apps/**" },
      { type: "packages", pattern: "packages/*/src/**" }
    ]
  }
}
