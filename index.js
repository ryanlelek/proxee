
'use strict';

// Modules
var otto     = require('otto');
var request  = require('request');
var Entities = require('html-entities').XmlEntities;
var html     = new Entities();

// Cookies
var request = request.defaults({ jar : true });

// Otto App
// Based on Express
var app = otto.app({

  // Static Files (HTML, JS, CSS, JPEG, PNG, etc)
  // We store them in public/ for now
  // All matching static files will stop execution here.
  // We use the static html file "iframe.html"
  // It's located here: http://localhost:3000/iframe.html
  static : 'public/',

  // ===================================
  // But if there isn't a static file...
  // it will fall through to the Routes
  // ===================================

  // Routes is an array
  // Each takes a function - function (app) {}
  // Then, you can use: app.get(), app.post(), etc
  // Example:
  // app.post('/login', function (request, response, done) {
  //   response.status(200); // HTTP OK Status
  //   response.send({ some : 'data' }); // JSON object data
  //   done();
  // });
  routes : [
    // We get an "app" object passed
    // You could put this nested routing code in its own file
    function (app) {

      // Proxy All Requests
      app.get('*', function (req, res, next) {

        // Query Parameters
        // req.query holds all URL query parameters
        //
        // So, to get the post_id in this url:
        // http://mydomain.com/view?post_id=1932
        // you would access: req.query.post_id
        //
        var url_to_proxy = false;
        if (req.query.proxy_url) {
          // Decode URL
          url_to_proxy = decodeURIComponent(req.query.proxy_url);
        }

        // A URL wasn't requested?
        // Then it's a bad request
        if (url_to_proxy === false) {
          return res.status(400).send('Bad Request');
          // You could have also done it this way:
          // res.status(400);
          // res.send('Bad Request');
        }

        // Get Root Domain
        // http://stackoverflow.com/questions/8498592/extract-root-domain-name-from-string
        var domain_matches = url_to_proxy.match(/^(https?)\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
        var protocol = domain_matches && domain_matches[1];
        var domain   = domain_matches && domain_matches[2];

        // Make Request to URL
        request({
          method  : 'GET',
          url     : url_to_proxy,
          headers : {
            'cache-control'   : 'max-age=0',
            'accept'          : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'user-agent'      : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.111 Safari/537.36',
            'accept-language' : 'en-US,en;q=0.8',
          },
          gzip : true
        }, function (error, response, body) {
          if (error) { return next(error); }

          // Remove X-FRAME-OPTIONS
          body = body.replace(/<meta(.*)http-equiv=["']X-FRAME-OPTIONS["'](.*)\/?>/gi, '');

          // Replace "data-image" with "src"
          // Replace "data-html" with [HTML]
          // Problematic Links:
          // - http://blog.strategyzer.com/posts/2015/1/27/de-risking-innovation-by-taking-risks-with-customers
          // - http://blog.strategyzer.com/posts/2015/2/17/roadmap-to-test-your-value-proposition
          body = body.replace(/data\-image=["']([\:\/\+\-\.0-9a-zA-Z]+)["']/g, 'src="$1"');
          body = body.replace(/<[^<>]+data\-html=["']([\ \:\\\/\+\-\.\&\;\=\?<>0-9a-zA-Z]+)["'][^<>]+><\/[a-zA-z]+>/g, function (match, capture) {
            return html.decode(capture);
          });

          // Replace "Relative" Protocols (//) on Assets
          body = body.replace(/href=(["'])\/\//g, 'href=$1' + protocol + '://');
          body = body.replace(/src=(["'])\/\//g, 'src=$1' + protocol + '://');

          // Replace Calls to "root" (/) for CSS/JS/IMG
          body = body.replace(/href=["']\/([\/\-\.0-9a-zA-Z]+)["']/g, 'href="' + protocol + '://' + domain + '/$1"');
          body = body.replace(/src=["']\/([\/\-\.0-9a-zA-Z]+)["']/g, 'src="' + protocol + '://' + domain + '/$1"');

          // Very quick and lazy replacing of code
          // that causes the breakouts of iFrames
          // This replaces all "window.top" instances with 1
          body = body.replace(/window.top/g, '1');

          // If the code tried to access window.top.location,
          // then we mark it as a variable "block breakout"
          // because people usually set the breakout as follows:
          // window.top.location = window.self.location.href;
          // So with our replacement, that becomes...
          // var block_breakout = window.self.location.href;
          body = body.replace(/1.location/g, 'var block_breakout');

          // Send Response to Client
          res.status(200).send(body);

        });

      });

    }
  ]

});

// Exports
module.exports = app;
