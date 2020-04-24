# koa-simple-web

A simple web server using Koa

## Usage

```bash
$ npm install koa-simple-web
```

```javascript
// see the constructor docs for all available options.
const web = new SimpleWeb({ port: 8080 });

web.route(new (require("koa-router"))());
web.use(async (ctx) => {});

await web.start();
await web.stop();
```

## Why?

When developing simple/small node HTTP services (eg: microservices) that don't require a big web framework, a simple web server that can started (and stopped) is needed.

There wasn't one before, so there is now.

## License

MIT
