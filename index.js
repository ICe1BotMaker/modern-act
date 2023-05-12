class ModernAct {
    constructor(port, fs, convert, express) {
        this.pages = [];

        this.port = port;
        this.FS = fs;
        this.convert = convert;
        this.app = express();
    }

    compile() {
        this.FS.readdirSync(`./pages/`).forEach((file, idx) => {
            if (file.endsWith(`.act`)) {
                const XMLText = this.FS.readFileSync(`./pages/${file}`).toString();
                const XMLJson = JSON.parse(this.convert.xml2json(XMLText, {compact: true, spaces: 4}));
                
                this.pages[idx] = {
                    path: XMLJson.route._attributes.path,
                    method: XMLJson.route._attributes.method,
                    imports: [],
                    view: ``
                };
        
                XMLJson.route.import.forEach(tag => {
                    this.pages[idx].imports = [...this.pages[idx].imports, {
                        type: tag._attributes.type,
                        path: tag._attributes.path
                    }];
                });
                
                if (XMLJson?.route?.import) delete XMLJson.route.import;
                if (XMLJson?.route?._attributes) delete XMLJson.route._attributes;
                
                Object.prototype.findFix = function(...BefAfts) {
                    BefAfts.forEach(BefAft => {
                        Object.keys(this).forEach(key => {
                            if (typeof this[key] === `object`) {
                                this[key].findFix(BefAft);
                    
                                if (this[key]._attributes !== undefined && this[key]._attributes[BefAft[0]] !== undefined) {
                                    this[key]._attributes[BefAft[1]] = this[key]._attributes[BefAft[0]];
                    
                                    delete this[key]._attributes[BefAft[0]];
                                }
                            }
                        });
                    });
                }
                
                XMLJson.route.findFix(
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
                
                let XMLResult = this.convert.json2xml(XMLJson.route, {compact: true, spaces: 4});
                
                if (XMLResult.match(/<link .*(path=".*").*>/)) {
                    const linkTags = XMLResult.match(/<link .*(path=".*").*>/g);
                    
                    linkTags.forEach(e => {
                        const attr = /<link .*(path=".*").*>/g.exec(e);
                        XMLResult = XMLResult.replace(attr[0],
                            attr[0].replace(attr[0],
                                `<a ${attr[1].replace(`path=`, `href=`)}>${JSON.parse(this.convert.xml2json(e)).elements[0].elements[0].text}</a>`
                            )
                        );
                    });
                }
        
                if (XMLResult.match(/<img .*(path=".*").*>/)) {
                    const imgTags = XMLResult.match(/<img .*(path=".*").*>/g);
                        
                    imgTags.forEach(e => {
                        const attr = /<img .*(path=".*").*>/g.exec(e);
                        XMLResult = XMLResult.replace(attr[0],
                            attr[0].replace(attr[0],
                                `<img ${attr[1].replace(`path=`, `src=`)} />`
                            )
                        );
                    });
                }
        
                if (XMLResult.match(/<text .*>/)) {
                    const textTags = XMLResult.match(/<text .*>/g);
        
                    textTags.forEach(e => {
                        const attr = /<text .*>/g.exec(e);
                        XMLResult = XMLResult.replace(attr[0], attr[0].replace(/<text/, `<p`).replace(/<\/text>/, `</p>`));
                    });
                }
                
                this.pages[idx].imports.forEach(file => {
                    let importType;
                
                    if (file.type === `stylesheet`) {
                        importType = `style`;
                    } else if (file.type === `script`) {
                        importType = `script`;
                    }
                
                    XMLResult += `\n<${importType}>\n${this.FS.readFileSync(file.path).toString()}\n</${importType}>`;
                });
                
                this.pages[idx].view = XMLResult;
            }
        });
    }

    server() {
        this.pages.forEach(page => {
            console.log(`[ ! ] ${page.method}: localhost:${this.port}${page.path}`);
        
            this.app[page.method](page.path, (req, res) => {
                res.send(page.view);
            });
        });

        this.FS.readdirSync(`./src/`).forEach((file, idx) => {
            if (file.includes(`.`)) {
                this.app.get(`/src/${file}`, (req, res) => {
                    res.sendFile(`${__dirname}/src/${file}`);
                });
            }
        });

        this.app.listen(this.port);
    }
}

module.exports = ModernAct;

// const FS = require(`fs`);
// const convert = require(`xml-js`);

// const express = require(`express`);
// const app = express();

// let pages = [];

// FS.readdirSync(`./pages/`).forEach((file, idx) => {
//     if (file.endsWith(`.act`)) {
//         const XMLText = FS.readFileSync(`./pages/${file}`).toString();
//         const XMLJson = JSON.parse(convert.xml2json(XMLText, {compact: true, spaces: 4}));
        
//         pages[idx] = {
//             path: XMLJson.route._attributes.path,
//             method: XMLJson.route._attributes.method,
//             imports: [],
//             view: ``
//         };

//         XMLJson.route.import.forEach(tag => {
//             pages[idx].imports = [...pages[idx].imports, {
//                 type: tag._attributes.type,
//                 path: tag._attributes.path
//             }];
//         });
        
//         if (XMLJson?.route?.import) delete XMLJson.route.import;
//         if (XMLJson?.route?._attributes) delete XMLJson.route._attributes;
        
//         Object.prototype.findFix = function(...BefAfts) {
//             BefAfts.forEach(BefAft => {
//                 Object.keys(this).forEach(key => {
//                     if (typeof this[key] === `object`) {
//                         this[key].findFix(BefAft);
            
//                         if (this[key]._attributes !== undefined && this[key]._attributes[BefAft[0]] !== undefined) {
//                             this[key]._attributes[BefAft[1]] = this[key]._attributes[BefAft[0]];
            
//                             delete this[key]._attributes[BefAft[0]];
//                         }
//                     }
//                 });
//             });
//         }
        
//         XMLJson.route.findFix(
//             [`className`, `class`],
        
//             [`onLoad`, `onload`],
        
//             [`onClick`, `onclick`],
//             [`onMouseDown`, `onmousedown`],
//             [`onMouseMove`, `onmousemove`],
//             [`onMouseUp`, `onmouseup`],
        
//             [`onInput`, `oninput`],
//             [`onKeyDown`, `onkeydown`],
//             [`onKeyUp`, `onkeyup`]
//         );
        
//         let XMLResult = convert.json2xml(XMLJson.route, {compact: true, spaces: 4});
        
//         if (XMLResult.match(/<link .*(path=".*").*>/)) {
//             const linkTags = XMLResult.match(/<link .*(path=".*").*>/g);
            
//             linkTags.forEach(e => {
//                 const attr = /<link .*(path=".*").*>/g.exec(e);
//                 XMLResult = XMLResult.replace(attr[0],
//                     attr[0].replace(attr[0],
//                         `<a ${attr[1].replace(`path=`, `href=`)}>${JSON.parse(convert.xml2json(e)).elements[0].elements[0].text}</a>`
//                     )
//                 );
//             });
//         }

//         if (XMLResult.match(/<img .*(path=".*").*>/)) {
//             const imgTags = XMLResult.match(/<img .*(path=".*").*>/g);
                
//             imgTags.forEach(e => {
//                 const attr = /<img .*(path=".*").*>/g.exec(e);
//                 XMLResult = XMLResult.replace(attr[0],
//                     attr[0].replace(attr[0],
//                         `<img ${attr[1].replace(`path=`, `src=`)} />`
//                     )
//                 );
//             });
//         }

//         if (XMLResult.match(/<text .*>/)) {
//             const textTags = XMLResult.match(/<text .*>/g);

//             textTags.forEach(e => {
//                 const attr = /<text .*>/g.exec(e);
//                 XMLResult = XMLResult.replace(attr[0], attr[0].replace(/<text/, `<p`).replace(/<\/text>/, `</p>`));
//             });
//         }
        
//         pages[idx].imports.forEach(file => {
//             let importType;
        
//             if (file.type === `stylesheet`) {
//                 importType = `style`;
//             } else if (file.type === `script`) {
//                 importType = `script`;
//             }
        
//             XMLResult += `\n<${importType}>\n${FS.readFileSync(file.path).toString()}\n</${importType}>`;
//         });
        
//         pages[idx].view = XMLResult;
//     }
// })

// const port = 3000;

// pages.forEach(page => {
//     console.log(`[ ! ] ${page.method}: localhost:${port}${page.path}`);

//     app[page.method](page.path, (req, res) => {
//         res.send(page.view);
//     });
// });

// FS.readdirSync(`./src/`).forEach((file, idx) => {
//     if (file.includes(`.`)) {
//         app.get(`/src/${file}`, (req, res) => {
//             res.sendFile(`${__dirname}/src/${file}`);
//         });
//     }
// });

// app.listen(port);