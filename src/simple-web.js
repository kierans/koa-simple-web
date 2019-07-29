"use strict";

const Koa = require("koa");

/**
 * @typedef {Object} SimpleWebServerConfig
 * @property {number} port The port to listen on
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
		this._server = this._web.listen(this._config.port);

		return new Promise((resolve) => {
			this._server.on("listening", resolve);
		});
	}

	stop() {
		if (this._server) {
			return new Promise((resolve, reject) => {
				this._server.on("close", resolve);
				this._server.on("error", reject);

				this._server.close()
			});
		}
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
