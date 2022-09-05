const fs = require("fs");
const version = require("./package.json").version;

const { minify } = require("terser");

const run = async()=>{
    console.log("[+] index.js done.");

 
    //Format and fix dependencies of cli.js
    let cli = fs.readFileSync('./lib/cli/cli.js', 'utf8');

    let typesFile = fs.readFileSync('./lib/cli/types.js', 'utf8');

    const typesTemplate =  fs.readFileSync('./cli/templates/types.file', 'utf-8').replace(/\`/g,'\\\`');

    fs.writeFileSync(
        './lib/cli/cli.js', 
        cli
        .replace(/require\(tsImportPath\)/g, 'import\(tsImportPath\)')
        .replace(/require\(schemaImportPath\)/g, 'import\(schemaImportPath\)')
        .replace(/\{restsVersion\}/g, version),
        {
            'encoding': 'utf-8'
        }
    );

    fs.writeFileSync(
        './lib/cli/types.js',
        typesFile
        .replace(/fs\.readFileSync\(\'\.\/types\.file', 'utf\-8'\)/g, `\n\`${typesTemplate}\``)
        .replace(/\{restsVersion\}/g, version),
        {
            encoding: 'utf-8'
        }
    )
    console.log("[+] cli.js done.")


    //Replace Version Index.js
    let main = fs.readFileSync('./lib/index.js', 'utf8');
    
    main = main.replace(/\{restsVersion\}/g, version)

    fs.writeFileSync(
        './lib/index.js', 
        main,
        'utf8'
    );

    //Make a copy of Rests that is compatible for running directly on browser
    let formatted = await minify(
        main.replace(/(Object\.defineProperty\(exports, \"\_\_esModule\"\, \{ value\: true \}\)|module.exports = .+|exports.default = .+);/g, '')
    );

    fs.writeFileSync(
        './lib/rests.browser.js', 
        formatted.code,
        'utf8'
    );

    console.log("[+] rests.browser.js done.");
}

run();