# Modern Act

Originally, **Kithub** was intended to be developed based on **React**, but the developer's greed also led to a new one called **Modern Act**.

**Modern Act** begins with a new file extension called `.act`. This extension **.act** was conceived by the developer himself and will be used in future development of the markup language.

The portfolio will be updated continuously.

### Docs

directory structure:
```markdown
+ my-first-act
    + src
        - bg.jpg
        - style.css
        - script.js

    + pages
        - home.act
        - save.act
        - view.act

    + components
    
    - Act.js
    - package.json
    - package-lock.json
```

You can just copy the GitHub repository and use `$ npm install`.

And write `$ npm run start`.

### Basic grammar

To use the **Modern Act**, you need to know the basics first. It's similar to HTML.

```xml
<route path="/" method="get">
    <import type="stylesheet" path="./src/style.css" />

    <text className="text-default title-default">Hello, world!</text>
    <text className="text-default">Lorem ipsum dolor simit.</text>
</route>
```

- First, create the router you want to use to access the page.

- Import to import to use css.

- p, a, h1, h2 do not exist. Use the tag text.

Everything about html is not ready yet.