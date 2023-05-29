/* modules */
const FS = require(`fs`);
const convert = require(`xml-js`);
const express = require(`express`);

class ModernAct {
    /* set option */
    public startMessage: string;
    public port: number;

    /* pages */
    private pages: {    
        path: string;
        method: string;
        view: string;
        variables: any[];
    }[];

    /* use module */
    private app: any;
    private express: any;

    /* private variable */
    private pagesFileExists: boolean;

    /* constructor */
    public constructor(port: number) {
        this.pages = [];
        this.startMessage = `[ ! ] $method: localhost:$port$path`;
        this.port = port;
        this.express = express;
        this.app = this.express();
        this.pagesFileExists = false;
    }

    /* check and fix attributes */
    private sanitizeAttributes(obj: object, ...BefAfts: any[]) {
        /* Array to use when modifying an object */
        BefAfts.forEach(BefAft => {
            Object.keys(obj).forEach(key => {
                /* if obj ~ */
                if (typeof obj[key] === `object`) {
                    /* loop function */
                    this.sanitizeAttributes(obj[key], BefAft);
        
                    /* check exist _attributes object, check exist key in BefAft[0] */
                    if (obj[key]._attributes !== undefined && obj[key]._attributes[BefAft[0]] !== undefined) {
                        /* add attribute and delete */
                        obj[key]._attributes[BefAft[1]] = obj[key]._attributes[BefAft[0]];
        
                        delete obj[key]._attributes[BefAft[0]];
                    }
                }
            });
        });

        return obj;
    }

    /* act to html */
    public compile() {
        /* get act files in pages folder */
        FS.readdirSync(`./pages/`).forEach((file: string, idx: number) => {
            if (file.endsWith(`.act`)) {
                this.pagesFileExists = true;

                /* get act file text and convert text to json */
                const XMLText = FS.readFileSync(`./pages/${file}`).toString();
                const XMLJson = JSON.parse(convert.xml2json(XMLText, {compact: true, spaces: 4}));

                /* check exist path */
                if (XMLJson?.route?._attributes?.path === undefined) {
                    throw new Error(`You must create the required properties for the "route" tag.`);
                }
                
                /* page information */
                this.pages[idx] = {
                    path: XMLJson.route._attributes.path,
                    method: XMLJson.route._attributes.method,
                    view: ``,
                    variables: []
                };
                
                /* check exist _attributes object in root */
                if (XMLJson?.route?._attributes) delete XMLJson.route._attributes;
                
                /* fix attribute */
                XMLJson.route = this.sanitizeAttributes(XMLJson.route,
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
                
                /* modify result */
                let XMLResult = convert.json2xml(XMLJson.route, {compact: true, spaces: 4});
                
                /* tag match */
                let matches = [
                    {
                        match: /<link.*(path=".*").*>/,
                        func: () => {
                            const linkTags: any = XMLResult.match(/<link.*(path=".*").*>/g);
                            
                            linkTags.forEach((e: string) => {
                                const tag: any = /<link.*(path=".*").*>/.exec(e);
                                XMLResult = XMLResult.replace(tag[0], tag[0].replace(tag[0], `<a ${tag[1].replace(`path=`, `href=`)}>${JSON.parse(convert.xml2json(e)).elements[0].elements[0].text}</a>`));
                            });
                        }
                    },
                    {
                        match: /<img.*(path=".*").*>/,
                        func: () => {
                            const imgTags: any = XMLResult.match(/<img.*(path=".*").*>/g);
                                
                            imgTags.forEach((e: string) => {
                                const tag: any = /<img.*(path=".*").*>/.exec(e);
                                XMLResult = XMLResult.replace(tag[0], tag[0].replace(tag[0], `<img ${tag[1].replace(`path=`, `src=`)} />`));
                            });
                        }
                    },
                    {
                        match: /<text.*>/,
                        func: () => {
                            const textTags: any = XMLResult.match(/<text.*>/g);
                
                            textTags.forEach((e: string) => {
                                const tag: any = /<text.*>/.exec(e);
                                XMLResult = XMLResult.replace(tag[0], tag[0].replace(/<text/, `<p`).replace(/<\/text>/, `</p>`));
                            });
                        }
                    },
                    {
                        match: /<import.*\/>/,
                        func: () => {
                            const importTags: any = XMLResult.match(/<import.*\/>/g);
                
                            importTags.forEach((e: string) => {
                                const tag: any = /<import.*\/>/.exec(e);
        
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
                            const scriptTags: any = XMLResult.match(/<act-script.*>([\s\S]*?)<\/act-script>/g);
                            
                            scriptTags.forEach((e: string) => {
                                const tag: any = /<act-script.*>([\s\S]*?)<\/act-script>/.exec(e);
                                const tagType = convert.xml2json(tag[0], {compact: true, spaces: 4})[`act-script`]?._attributes?.type;

                                if ([`text/javascript`, `text/js`, undefined].includes(tagType)) {
                                    if (tag[1].includes(`actState`)) {
                                        XMLResult = `<script>const Act = {
                                            states: [],
                                        
                                            eleContent(state) {
                                                const elements = document.querySelectorAll(\`body *\`);
                                        
                                                elements.forEach(element => {
                                                    if (/\\$\{(.+?)\}/g.test(element.textContent)) {
                                                        let match = element.textContent.match(/\\$\{(.+?)\}/g);
                                                        
                                                        if (/\\$\{(.+?)\}/.exec(match)[1] === state.key) {
                                                            element.dataset.marep = \`__ma-rep\`;
                                                            element.textContent = element.textContent.replace(match, \`\u200d\${state.state}\u200d\`);
                                                        }
                                                    } else if (element.dataset.marep === \`__ma-rep\`) {
                                                        element.textContent = element.textContent.replace(/\u200d(.+?)\u200d/, \`\u200d\${state.state}\u200d\`);
                                                    }
                                                });
                                            },
                                        
                                            actState({key, value}) {
                                                this.states = [...this.states, {
                                                    key: key,
                                                    state: value
                                                }];
                                        
                                                document.onload = function() {
                                                    this.eleContent({key, value});
                                                }
                                            },
                                        
                                            modState({key, value}) {
                                                this.states.forEach((state, idx) => {
                                                    if (state.key === key) {
                                                        this.states[idx].state = value;
                                                        this.eleContent(state);
                                                    }
                                                });
                                        
                                            },
                                        
                                            get({key}) {
                                                let result;
                                        
                                                this.states.forEach(state => {
                                                    if (state.key === key) {
                                                        result = state.state;
                                                    }
                                                });
                                        
                                                return result;
                                            }
                                        };</script>\n${XMLResult}`;
                                    }

                                    XMLResult = XMLResult.replace(tag[0], tag[0].replace(tag[0], `<script>${tag[1]}</script>`));
                                }
                            });
                        }
                    }
                ];

                /* check tag match, run function */
                matches.forEach(match => {
                    if (match.match.test(XMLResult)) {
                        match.func();
                    }
                });
                
                this.pages[idx].view = XMLResult;
            }
        });
    }
    
    /* when start server, set log */
    public setStartMessage(string: string) {
        if (string.trim() !== ``) {
            this.startMessage = string;
        }
    }

    /* start server method */
    public server() {
        /* check exist pages folder */
        if (!FS.existsSync(`./pages/`)) {
            throw new Error(`Pages folder does not exist.`);
        }

        /* check exist act file in pages folder */
        if (!this.pagesFileExists) {
            throw new Error(`There are no files in the pages folder.`);
        }

        /* check port is number */
        if (typeof this.port !== `number`) {
            throw new Error(`Invalid port format. ${this.port}`);
        }

        this.pages.forEach(page => {
            let message: string = this.startMessage
            .replace(/\$method/g, page.method)
            .replace(/\$port/g, String(this.port))
            .replace(/\$path/g, page.path);

            console.log(message);

            /* set method get, post */
            this.app[page.method](page.path, (req: any, res: any) => {
                res.send(page.view);
            });
        });

        /* check exist src folder */
        if (FS.existsSync(`./src/`)) {
            this.app.use(`/src/`, this.express.static(`./src/`));
        }

        /* listen localhost:port */
        this.app.listen(this.port);
    }
}

module.exports = ModernAct;