"use strict";

const Koa = require("koa");

const PASSTHROUGH_CONFIG_KEYS = [
	"maxHeadersCount",
	"headersTimeout",
	"timeout",
	"keepAliveTimeout"
];

/**
 * @typedef {Object} SimpleWebServerConfig
 *
 * See this bug related to the timeouts: https://github.com/nodejs/node/issues/27363
 *
 * @property {number} port The port to listen on
 * @property [number] maxHeadersCount {@link https://nodejs.org/docs/latest/api/http.html#http_server_maxheaderscount}
 * @property [number] headersTimeout {@link https://nodejs.org/docs/latest/api/http.html#http_server_headerstimeout}
 * @property [number] timeout {@link https://nodejs.org/docs/latest/api/http.html#http_server_timeout}
 * @property [number] keepAliveTimeout {@link https://nodejs.org/docs/latest/api/http.html#http_server_keepalivetimeout}
 */

/**
 * A light wrapper over Koa.
 *
 * When referring to 'middleware' any function that conforms to Koa's Middleware function syntax
 * can be used.
 */
class SimpleWeb {
	/**
	 * @param {SimpleWebServerConfig} config
	 */
	constructor(config) {
		this._config = config;

		this._web = new Koa()
	}

	start() {
		return new Promise((resolve, reject) => {
			if (!this._server) {
				this._server = this._web.listen(this._config.port);

				PASSTHROUGH_CONFIG_KEYS.forEach((key) => {
					if (typeof this._config[key] !== 'undefined') {
						this._server[key] = this._config[key];
					}
				});

				this._server.on("listening", resolve);
			}
			else {
				reject(new Error("Server already started"));
			}
		});
	}

	stop() {
		return new Promise((resolve, reject) => {
			if (this._server) {
				this._server.on("close", () => {
					this._server = null;

					resolve();
				});

				this._server.on("error", reject);

				this._server.close()
			}
			else {
				resolve();
			}
		});
	}

	/**
	 * Adds routes.
	 *
	 * @param {Router} router A Koa Router
	 */
	route(router) {
		this._web.use(router.allowedMethods());
		this._web.use(router.routes());
	}

	/**
	 * Allow arbitrary middleware to be added.
	 *
	 * @param {Function} middleware Koa middleware
	 */
	use(middleware) {
		this._web.use(middleware);
	}

	/**
	 * Adds to Koa's context object.
	 *
	 * @param {string} name
	 * @param {Function} fn
	 */
	addContext(name, fn) {
		this._web.context[name] = fn;
	}
}

module.exports = SimpleWeb;
