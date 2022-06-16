const fs = require("fs");
const { minify } = require("terser");

const run = async()=>{
    console.log("[+] index.js done.");

    //Replace require with import on cli.js
    let cli = fs.readFileSync('./lib/cli.js', 'utf8');

    fs.writeFileSync(
        './lib/cli.js', 
        cli.replace(/require\(schemaImportPath\)/g, 'import\(schemaImportPath\)'),
        'utf8'
    );

    console.log("[+] cli.js done.")

    //Make a copy of Rests that is compatible for running directly on browser
    let main = fs.readFileSync('./lib/index.js', 'utf8');
    
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