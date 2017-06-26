/*
 * Copyright 2014 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of lwm2m-node-lib
 *
 * lwm2m-node-lib is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * lwm2m-node-lib is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with lwm2m-node-lib.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[contacto@tid.es]
 */

'use strict';

var async = require('async');
var errors = require('../errors');
var debug = require('debug')('lwm2m');
var utils = require('../utils');
var objectAssign = require('object.assign');

/**
 *  Generates the end of request handler that will generate the final response to the COAP Client.
 */
function endRegistration(req, res) {
  return function (error, result) {
    if (error) {
      debug('Registration request ended up in error [%s] with code [%s]', 
        error.name, error.code);

      res.code = error.code;
      res.end(error.name);
    } else {
      debug('Registration request ended successfully');
      res.code = '2.01';
      res.setOption('Location-Path', 'rd/' + result[2]);
      res.end('');
    }
  };
}

/**
 * Invoke the user handler for this operation, with all the information from the query parameters as its arguments.
 *
 * @param {Object} queryParams      Object containing all the query parameters.
 * @param {Function} handler        User handler to be invoked.
 */
function applyHandler(queryParams, payload, handler, callback) {
  var params = Object.assign({}, queryParams);
  params.payload = payload
  debug('paramas are %O', params);
  handler(params, callback);
}

/**
 * Creates the device object to be stored in the registry and stores it.
 *
 * @param {Object} queryParams      Object containing all the query parameters.
 * @param {Object} req              Arriving COAP Request.
 */
var storeDevice = function(req, queryParams, callback) {
  var registry = this.getRegistry();
  var device = {
    name: queryParams.ep,
    lifetime: queryParams.lt,
    address: req.rsinfo.address,
    port: req.rsinfo.port,
    path: req.urlObj.pathname,
    payload: req.payload.toString(),
    creationDate: Date.now()
  };

  debug('Storing device %o', device);

  registry.register(device, callback);
};

/**
 * Handle the registration operation.
 *
 * @param {Object} req          Arriving COAP Request to be handled.
 * @param {Object} res          Outgoing COAP Response.
 * @param {Function} handler    User handler to be executed if everything goes ok.
 */
exports.handle = function (req, res, handler) {
  var queryParams = utils.extractQueryParams(req);

  debug('Handling registration request');

  async.series([
    async.apply(utils.checkMandatoryQueryParams, ['ep'], queryParams),
    async.apply(applyHandler, queryParams, req.payload.toString(), handler),
    storeDevice.bind(this, req, queryParams)
  ], endRegistration(req, res));
};
