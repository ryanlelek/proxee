
'use strict';

// Modules
var otto   = require('otto');
var proxee = require('./index.js');

// HTTP Server
// It will listen on port 3000 by default
// Go to: http://localhost:3000/
otto.server(proxee);
