"use strict";

const https = require("https");
const Router = require("koa-router");
const superagent = require("superagent");

const { assertThat, equalTo, is, not, defined } = require("hamjest");
const { hasHeader, hasStatusCode } = require("superjest");

const SimpleWeb = require("../src/simple-web");

const PORT = process.env.PORT || 8080;
const TLS_PORT = process.env.TLS_PORT || 43434;
const MAX_HEADERS_COUNT = 1111;
const HEADERS_TIMEOUT = 2222;
const TIMEOUT = 3333;
const KEEP_ALIVE_TIMEOUT = 4444;

const config = {
	port: PORT,
	maxHeadersCount: MAX_HEADERS_COUNT,
	headersTimeout: HEADERS_TIMEOUT,
	timeout: TIMEOUT,
	keepAliveTimeout: KEEP_ALIVE_TIMEOUT
};

describe("simple web", function() {
	let web;

	beforeEach(async function() {
		web = new SimpleWeb(config);
	});

	afterEach(async function() {
		await web.stop();
	});

	describe("lifecycle", function() {
		function lifecycleTests(getServer) {
			it("should not throw error stopping unstarted component", async function() {
				await web.stop();
				await web.start();

				assertThat(getServer().listening, is(true));
			});

			it("should only be able to be started once", async function() {
				await web.start();

				return web.start().then(
						() => { throw new Error("Expected error to be thrown") },

						// catch the "thrown" error.
						() => {}
				)
			});

			it("should handle being stopped multiple times", async function() {
				await web.stop();
				await web.stop();
			});

			it("should handle being restarted again", async function() {
				await web.start();
				await web.stop();

				assertThat(getServer().listening, is(false));

				await web.start();

				assertThat(getServer().listening, is(true));
			})
		}

		describe("with no server provided", function() {
			lifecycleTests(() => web._server);
		});

		describe("with server provided", function() {
			let server;

			beforeEach(function() {
				const alteredConfig = Object.assign({}, config);
				alteredConfig.port = TLS_PORT;

				server = https.createServer();
				web = new SimpleWeb(alteredConfig, server);
			});

			lifecycleTests(() => server);
		});
	});

	describe("config", function() {
		["maxHeadersCount", "headersTimeout", "timeout", "keepAliveTimeout"].forEach((key) => {
			it(`should set ${key}`, async function() {
				// Configuration should be synchronous, not wait for the promise to settle
				const promise = web.start();

				try {
					assertThat(web._server[key], is(config[key]));
				}
				finally {
					await promise;
				}
			});

			it(`should set ${key} to zero`, async function() {
				const alteredConfig = Object.assign({}, config);
				alteredConfig[key] = 0;

				web = new SimpleWeb(alteredConfig);
				const promise = web.start();

				try {
					assertThat(web._server[key], is(0));
				}
				finally {
					await promise;
				}
			});

			it(`should not set ${key} if undefined`, async function() {
				const alteredConfig = Object.assign({}, config);
				delete alteredConfig[key];

				web = new SimpleWeb(alteredConfig);
				const promise = web.start();

				try {
					assertThat(web._server[key], defined());
					assertThat(web._server[key], not(config[key]));
				}
				finally {
					await promise;
				}
			});
		});
	});

	describe("routes", function() {
		beforeEach(async function() {
			web.route(givenRootRoute());

			await web.start();
		});

		it("should mount routes", function(done) {
			superagent.get(`http://localhost:${PORT}`)
				.end((error, response) => {
					assertThat(response, hasStatusCode(200));
					assertThat(response.text, is("OK"));

					done();
				});
		});

		it("should only allow defined methods", function(done) {
			superagent.post(`http://localhost:${PORT}`)
				.end((error, response) => {
					assertThat(response, hasStatusCode(405));

					/*
					 * See koa-router for more information about the contents of the 405 response.
					 *
					 * We're not testing koa-router we just want to make sure we've wired the routes together
					 * properly.
					 */
					done();
				});
		});
	});

	describe("middleware", function() {
		beforeEach(async function() {
			web.use(async (ctx, next) => {
				ctx.response.set("x-foo", "bar");

				return await next();
			});

			web.route(givenRootRoute());

			await web.start();
		});

		it("should allow arbitrary middleware", function(done) {
			superagent.get(`http://localhost:${PORT}`)
				.end((error, response) => {
					assertThat(response, hasStatusCode(200));
					assertThat(response, hasHeader("x-foo", equalTo("bar")));

					done();
				});
		});
	});

	describe("context", function() {
		beforeEach(async function() {
			const router = new Router();
			web.route(router);

			router.get("/name", async (ctx) => {
				ctx.status = 200;
				ctx.body = ctx.name();
			});

			await web.start();
		});

		it("should add to context", function(done) {
			const name = "Bruce Wayne";

			web.addContext("name", function() {
				return name;
			});

			superagent.get(`http://localhost:${PORT}/name`)
				.end((error, response) => {
					assertThat(response, hasStatusCode(200));
					assertThat(response.text, is(name));

					done();
				});
		});
	});
});

function givenRootRoute() {
	const router = new Router();

	router.get("/", async (ctx) => {
		ctx.status = 200;
		ctx.body = "OK"
	});

	return router;
}
