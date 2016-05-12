/*
    Copyright (c) 2016 eyeOS

    This file is part of Open365.

    Open365 is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

var sinon = require('sinon');
var assert = require('chai').assert;
var HttpWrapper = require('../eyeos-http-wrapper.js');
var http = require('http');

suite('eyeos-http-wrapper suite:', function() {

	var sut, dummyRequest, dummyResponse;
	var responseHandler;

	setup(function() {
		sut = new HttpWrapper();
		dummyRequest = {

			fps: {},

			on: function(id, callback) {
				this.fps[id] = callback;
			},
			executeCallback: function(id, data) {
				this.fps[id](data);
			},

			write: function() {

			},

			end: function() {

			}
		};

		dummyResponse = {
			fps: {},
			statusCode : 200,

			on: function(id, callback) {
				this.fps[id] = callback;
			},
			executeCallback: function(id, data) {
				this.fps[id](data);
			}

		};
	});

	test('request will call to internal http request', sinon.test(function() {
		this.mock(http).expects('request').once().withArgs(getConnectionOptions()).returns(dummyRequest);
		exerciseRequest();
	}));

	test('request when request is closed will send to callback the response text', sinon.test(function() {

		var receivedText = '';
		var responseText = 'some text';
		var testCallback = function(text) {
			receivedText = text;
		};
		configureHttpAsStub(this);
		exerciseRequest(testCallback);
		responseHandler(dummyResponse);
		dummyResponse.executeCallback('data', responseText);
        dummyResponse.executeCallback('end');
		assert.equal(responseText, receivedText);
	}));

	test('request when enter on error state will call to errorCallback', sinon.test(function() {

		var error = new Error('test error');
		var actualError = null;
		var errorHandler = function(e) {
			actualError = e;
		};
		configureHttpAsStub(this);
		exerciseRequest(null, errorHandler);
		responseHandler(dummyResponse);
		dummyRequest.executeCallback('error', error);
		assert.equal(error, actualError);
	}));

	// the responseStatusCodes that should call the errorCallback function
	[400, 403, 404, 405, 500].forEach(function(item) {
		test('request close when response code is ' + item + ' will call to errorCallback and set error.statusCode', sinon.test(function() {
			testResponseReturningError(this, item);
		}));
	}, this);

	function testResponseReturningError(self, errorStatus) {
		var responseText = 'dummy error message';
		var httpConfig = getConnectionOptions();
		var error = new Error('Request "GET ' + httpConfig.host + httpConfig.path
			+ '" returned status code ' + errorStatus + '\nResponse was: ' + responseText);
		var actualError = null;
		var errorHandler = function(e) {
			actualError = e;
		};
		configureHttpAsStub(self);
		exerciseRequest(function(){}, errorHandler);
		responseHandler(dummyResponse);
		dummyResponse.statusCode = errorStatus;
		dummyResponse.executeCallback('data', responseText);
        dummyResponse.executeCallback('end');
		assert.equal(error.message, actualError.message);
		// also check error.statusCode
		assert.equal(errorStatus, actualError.statusCode);
	}

	function configureHttpAsStub(self) {
		self.stub(http, 'request', function(config, handler) {
			responseHandler = handler;
			return dummyRequest;
		});
	}

	function exerciseRequest(callback, errorCallback) {
		sut.request('', getConnectionOptions(), callback, errorCallback);
	}

	function getConnectionOptions() {
		return {
			host: 'a.test.host',
			path: '/testPath'
		};
	}
});
