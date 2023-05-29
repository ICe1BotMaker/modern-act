# Modern Act

- Originally, **Kithub** was intended to be developed based on **React**, but the developer's greed also led to a new one called **Modern Act**.

- **Modern Act** begins with a new file extension called `.act`. This extension **.act** was conceived by the developer himself and will be used in future development of the markup language.

- The portfolio will be updated continuously.

directory structure:

```markdown
+ my-first-act
    + .moact
        - actconfig.json

    + src
        + css
            - style.css
            
        - bg.jpg
        - script.js

    + pages
        - home.act
        - save.act
        - view.act

    + components
        - form.act
    
    - Act.js
    - package.json
    - package-lock.json
```

### Installation

| Vscode Extension (language support) | Modern Act NPM | Moact NPM |
|-------------------------------------|----------------|-----------|
| [Go VSCode Extension](https://marketplace.visualstudio.com/items?itemName=ice1.modern-act-language) | [Go NPM](https://www.npmjs.com/package/modern-act) | [Go NPM](https://www.npmjs.com/package/moact) |

Install NPM Global Module:

```
$ npm install -g moact
```

Enter **Moact** Commad:
```
$ moact init

- C:\<path>
$ project name: <project-name>

(project) <project-name>: init success.
https://github.com/ICe1BotMaker/modern-act

Installing Module...
Install Module Success
```

### Usage

```js
act.setStartMessage(`(listening) $method :$port$path`);
```

Update `Act.js` first. (optional)

- You can import **.act** files into HTML using the compile method.

- You can use a method called `setStartMessage` to output the message you want when the server starts.

```xml
<route path="/" method="get">
    <title>Modern Act</title>

    <import type="stylesheet" path="./src/css/style.css" />
    <import type="script" path="./src/script.js" />

    <text className="text-default">Hello, world!</text>
</route>
```

You can create a file with the `.act` extension in the pages folder in the root directory and modify it as above.

```xml
<import type="script" path="./src/script.js" />
```

You can import a style sheet or script file using the `import` tag.

```xml
<act-script type="text/javascript">
    Act.actState({
        key: `foo`,
        value: false
    });

    const buttonOnclick = function() {
        Act.modState({
            key: `foo`,
            value: !Act.get({key: `foo`})
        });
    }
</act-script>

<!-- replace ${foo} with abcdef -->
<text className="text-default">${foo}</text>
```

You can also use the status that changes in real time as shown above.

### Start Server

```
$ npm run start
```

Open a browser and access `localhost:<port>`