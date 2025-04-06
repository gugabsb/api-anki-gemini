export default function(eleventyConfig) {
    return {
      dir: {
        input: "src",
        includes: "_includes",
        output: "_site"
      },
      templateFormats: ["njk", "md", "11ty.js"],
      markdownTemplateEngine: "njk"
    };
  }