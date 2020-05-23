# koa-simple-web

A simple web server using Koa

## Usage

```bash
$ npm install koa-simple-web
```

### Simple HTTP

```javascript
const web = new SimpleWeb({ port: 8080 });

web.route(new (require("koa-router"))());
web.use(async (ctx) => {});

await web.start();
await web.stop();
```

### Something else

Koa's `listen` (which SimpleWeb uses) is [itself sugar](https://koajs.com/#application) for
```javascript
const http = require("http");
const Koa = require("koa");
const app = new Koa();
http.createServer(app.callback()).listen(3000);
``` 

Consequently, if you want to configure the underlying `server` instance (for example to use HTTPS), you can pass in a Node `http.Server` or `https.Server` to the constructor and that server will be used instead of a default HTTP configuration.

```javascript
const fs = require('fs');
const https = require('https');

const options = {
  key: fs.readFileSync('test/fixtures/keys/agent2-key.pem'),
  cert: fs.readFileSync('test/fixtures/keys/agent2-cert.pem')
};

const server = https.createServer(options);

const web = new SimpleWeb({ port: 8080 }, server);

await web.start();

// curl -v https://localhost:8080/
```

## Why?

When developing simple/small node HTTP services (eg: microservices) that don't require a big web framework, a simple web server that can started (and stopped) is needed.

There wasn't one before, so there is now.

## License

MIT
