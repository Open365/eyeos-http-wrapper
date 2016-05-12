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

var HttpWrapper = function(useSsl) {
	this.http = useSsl ? require('https') : require('http');
};

HttpWrapper.prototype = {
	request: function(body, options, callback, errorCallback) {
		var self = this;
		var req = this.http.request(options, function(res) {
			var response = '';
			res.on('data', function(chunk) {
				response += chunk.toString();
			});

			res.on('end', function() {
				if(res.statusCode >= 400){
					var error = new Error(
						'Request "'
						+ self._httpOptionsToHumanReadable(options)
						+ '" returned status code ' + res.statusCode + '\n'
						+ 'Response was: ' + response
					);
					error.statusCode = res.statusCode;
					self._doErrorProcessing(error, errorCallback);
				} else {
					callback(response);
				}

			});
		});

		req.on('error', function(e) {
			self._doErrorProcessing(e, errorCallback);
		});

		req.write(body);
		req.end();
	},

	_doErrorProcessing : function(e, errorCallback) {
		if (errorCallback && typeof errorCallback === "function") {
			errorCallback(e);
		}
	},

	_httpOptionsToHumanReadable: function(options) {
		if (typeof options === "string") {
			return 'GET ' + options;
		}
		return (options.method || "GET") + " " + options.host + (options.port ? ":" + options.port : "") + options.path;
	}
};

module.exports = HttpWrapper;
