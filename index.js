const FS = require(`fs`);
const convert = require(`xml-js`);
const express = require(`express`);
const exec = require(`child_process`).exec;
const app = express();

class ModernAct {
    constructor(port) {
        this.pages = [];

        this.startMessage = `[ ! ] $method: localhost:$port$path`;

        this.port = port;

        this.pagesFileExists = false;

        this.config = ``;
        FS.readFileSync(`./.moact/actconfig.json`).toString().split(`\n`).forEach(line => {
            if (line.trim().startsWith(`//`) || line.trim().includes(`/*`) || line.trim().includes(`*/`)) return;
            this.config += line;
        });

        this.config = JSON.parse(this.config);
    }

    fixAttributes = (obj, ...BefAfts) => {
        BefAfts.forEach(BefAft => {
            Object.keys(obj).forEach(key => {
                if (typeof obj[key] === `object`) {
                    this.fixAttributes(obj[key], BefAft);
        
                    if (obj[key]._attributes !== undefined && obj[key]._attributes[BefAft[0]] !== undefined) {
                        obj[key]._attributes[BefAft[1]] = obj[key]._attributes[BefAft[0]];
        
                        delete obj[key]._attributes[BefAft[0]];
                    }
                }
            });
        });

        return obj;
    }

    compile() {
        FS.readdirSync(`./pages/`).forEach((file, idx) => {
            if (file.endsWith(`.act`)) {
                this.pagesFileExists = true;

                const XMLText = FS.readFileSync(`./pages/${file}`).toString();
                const XMLJson = JSON.parse(convert.xml2json(XMLText, {compact: true, spaces: 4}));

                if (XMLJson?.route?._attributes?.path === undefined) {
                    throw new Error(`You must create the required properties for the "route" tag.`);
                }
                
                this.pages[idx] = {
                    path: XMLJson.route._attributes.path,
                    method: XMLJson.route._attributes.method,
                    view: ``,
                    variables: []
                };
                
                if (XMLJson?.route?._attributes) delete XMLJson.route._attributes;
                
                XMLJson.route = this.fixAttributes(XMLJson.route,
                    [`className`, `class`],
                
                    [`onLoad`, `onload`],
                
                    [`onClick`, `onclick`],
                    [`onMouseDown`, `onmousedown`],
                    [`onMouseMove`, `onmousemove`],
                    [`onMouseUp`, `onmouseup`],
                
                    [`onInput`, `oninput`],
                    [`onKeyDown`, `onkeydown`],
                    [`onKeyUp`, `onkeyup`]
                );
                
                let XMLResult = convert.json2xml(XMLJson.route, {compact: true, spaces: 4});
                
                let matches = [
                    {
                        match: /<link.*(path=".*").*>/,
                        func: () => {
                            const linkTags = XMLResult.match(/<link.*(path=".*").*>/g);
                            
                            linkTags.forEach(e => {
                                const tag = /<link.*(path=".*").*>/.exec(e);
                                XMLResult = XMLResult.replace(tag[0],
                                    tag[0].replace(tag[0],
                                        `<a ${tag[1].replace(`path=`, `href=`)}>${JSON.parse(convert.xml2json(e)).elements[0].elements[0].text}</a>`
                                    )
                                );
                            });
                        }
                    },
                    {
                        match: /<img.*(path=".*").*>/,
                        func: () => {
                            const imgTags = XMLResult.match(/<img.*(path=".*").*>/g);
                                
                            imgTags.forEach(e => {
                                const tag = /<img.*(path=".*").*>/.exec(e);
                                XMLResult = XMLResult.replace(tag[0],
                                    tag[0].replace(tag[0],
                                        `<img ${tag[1].replace(`path=`, `src=`)} />`
                                    )
                                );
                            });
                        }
                    },
                    {
                        match: /<text.*>.*<\/text>/,
                        func: () => {
                            const textTags = XMLResult.match(/<text.*>.*<\/text>/g);
                
                            textTags.forEach(e => {
                                const tag = /<text.*>/.exec(e);
                                XMLResult = XMLResult.replace(tag[0], tag[0].replace(/<text/, `<p`).replace(/<\/text>/, `</p>`));
                            });
                        }
                    },
                    {
                        match: /<import.*\/>/,
                        func: () => {
                            const importTags = XMLResult.match(/<import.*\/>/g);
                
                            importTags.forEach(e => {
                                const tag = /<import.*\/>/.exec(e);
        
                                const tagJSON = JSON.parse(convert.xml2json(tag));
                                const tagType = tagJSON?.elements[0]?.attributes?.type;
                                const tagPath = tagJSON?.elements[0]?.attributes?.path;
        
                                if (tagType === `stylesheet`) {
                                    XMLResult = XMLResult.replace(tag[0], `<style>${FS.readFileSync(tagPath).toString()}</style>`);
                                }
        
                                if (tagType === `script`) {
                                    XMLResult = XMLResult.replace(tag[0], `<script>${FS.readFileSync(tagPath).toString()}</script>`);
                                }
        
                                if (tagType === `component` && tagPath.endsWith(`.act`)) {
                                    XMLResult = XMLResult.replace(tag[0], FS.readFileSync(tagPath).toString());
                                }
                            });
                        }
                    },
                    {
                        match: /<act-script.*>([\s\S]*?)<\/act-script>/,
                        func: () => {
                            const scriptTags = XMLResult.match(/<act-script.*>([\s\S]*?)<\/act-script>/g);
                            
                            scriptTags.forEach(e => {
                                const tag = /<act-script.*>([\s\S]*?)<\/act-script>/.exec(e);
                                const tagType = JSON.parse(convert.xml2json(tag[0], {compact: true, spaces: 4}))[`act-script`]?._attributes?.type;

                                if ([`text/javascript`, `text/js`, undefined].includes(tagType)) {
                                    if (tag[1].includes(`actState`)) {
                                        XMLResult = XMLResult.replace(tag[0], ``);
                                        XMLResult += `<script>${FS.readFileSync(`${__dirname}/actscript.js`)}${tag[1].replaceAll(`&gt;`, `>`).replaceAll(`&lt;`, `<`)}</script>`;
                                    }
                                }

                                if ([`text/typescript`, `text/ts`].includes(tagType)) {
                                    if (!this.config.saveTempFile) FS.readdirSync(`./temp/`).forEach(temp_file => FS.unlinkSync(`./temp/${temp_file}`));

                                    const file_name = `${Math.random().toString(36).substring(2)}.ts`;
                                    FS.writeFileSync(`./temp/${file_name}`, tag[1].replaceAll(`&gt;`, `>`).replaceAll(`&lt;`, `<`));

                                    this.promise = () => {
                                        return new Promise((res, rej) => {
                                            exec(`tsc --module commonjs ${file_name}`, {cwd: `./temp/`}).addListener(`exit`, () => {
                                                XMLResult = XMLResult.replace(tag[0], ``);
                                                XMLResult += `<script>${FS.readFileSync(`${__dirname}/actscript.js`)}${FS.readFileSync(`./temp/${file_name.replace(`.ts`, `.js`)}`).toString()}</script>`;
    
                                                if (!this.config.saveTempFile) FS.readdirSync(`./temp/`).forEach(temp_file => FS.unlinkSync(`./temp/${temp_file}`));
                                                res({idx: idx, view: XMLResult});
                                            });
                                        });
                                    }
                                }
                            });
                        }
                    }
                ];

                matches.forEach(match => {
                    if (match.match.test(XMLResult)) {
                        match.func();
                    }
                });
                
                this.pages[idx].view = XMLResult;
            }
        });
    }

    setStartMessage(string) {
        if (string.trim() !== ``) {
            this.startMessage = string;
        }
    }

    async server() {
        if (this.promise) await this.promise().then(data => this.pages[data.idx].view = data.view);

        if (!FS.existsSync(`./pages/`)) {
            throw new Error(`Pages folder does not exist.`);
        }

        if (!this.pagesFileExists) {
            throw new Error(`There are no files in the pages folder.`);
        }

        if (typeof this.port !== `number`) {
            throw new Error(`Invalid port format. ${this.port}`);
        }

        this.pages.forEach(page => {
            console.log(this.startMessage.replace(/\$method/g, page.method).replace(/\$port/g, this.port).replace(/\$path/g, page.path));

            app[page.method](page.path, (req, res) => {
                res.send(page.view);
            });
        });

        if (FS.existsSync(`./src/`)) {
            app.use(`/src/`, express.static(`./src/`));
        }

        app.listen(this.port);
    }
}

module.exports = ModernAct;