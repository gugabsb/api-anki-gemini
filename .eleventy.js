export default function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("src/assets");
    return {
        dir: {
            input: "src",
            includes: "_includes",
            output: "_site"
        },
        templateFormats: ["njk", "md", "11ty.js", "html"],
        markdownTemplateEngine: "njk"
    };
}