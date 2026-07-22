// Mirrors webpack's `asset/source` for Jest: imports of .md files become the
// raw file content as a string, instead of Jest trying (and failing) to
// parse markdown as JS.
module.exports = {
  process(sourceText) {
    return { code: `module.exports = ${JSON.stringify(sourceText)};` };
  },
};
