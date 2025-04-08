export default function(eleventyConfig) {
  // Configurações existentes
  eleventyConfig.addPassthroughCopy("src/assets");
  

  eleventyConfig.on('eleventy.after', async ({ runMode, results }) => {
    //console.log(`Páginas geradas: ${results.length}`);
    //console.log('Rotas dinâmicas:', results.filter(r => r.url.includes('/comprar/')));
  });

  // Novas configurações necessárias
  eleventyConfig.addWatchTarget("src/_includes/partials/");

  
  eleventyConfig.addFilter("map", function(array, property) {
    if (!array) return [];
    return array.map(item => {
      // Acesso seguro a propriedades aninhadas
      return property.split('.').reduce((obj, key) => obj?.[key], item);
    });
  });

  eleventyConfig.addFilter("findById", function(arr, id) {
    if (!Array.isArray(arr)) {
      console.error('Dados inválidos:', arr);
      return null;
    }
    return arr.find(item => item.sys.id === id);
  });
  
  eleventyConfig.addFilter("dump", function(obj) {
    return JSON.stringify(obj, null, 2);
  });

  eleventyConfig.setServerOptions({
    showAllHosts: true,
    domDiff: false,
    port: 8081,
    watch: ["_site/**/*.html"]
  });

  return {
      dir: {
          input: "src/pages",
          includes: "../_includes",
          output: "_site",
          data: "../_data"
      },
      templateFormats: ["njk", "md", "11ty.js", "html"],
      markdownTemplateEngine: "njk",
      htmlTemplateEngine: "njk",
      pathPrefix: "/" 
  };
}