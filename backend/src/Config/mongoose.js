'use strict';

/**
 * Global Mongoose settings. This file MUST be required before any model is loaded
 * (server.js, the scripts and the tests do it first), because a global plugin only
 * applies to models created after it is registered.
 */
const mongoose = require('mongoose');
const toJSON = require('../models/plugins/toJSON');

mongoose.set('strictQuery', true);
mongoose.plugin(toJSON);