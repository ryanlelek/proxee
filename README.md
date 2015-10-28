Proxee
======

# About

A small, simple (and hacky) proxy server used to:
- remove X-Frame-Options headers
- remove frame busters
- bypass real-browser detection (sites that prevent curl for example)
- rewrite the HTML to not be relative ("/image.jpg") and instead be absolute ("http://www.site.com/image.jpg")

# Example

1. Start Proxee with `node index.js`
2. Navigate to [http://localhost:3000/example.html](http://localhost:3000/example.html)
3. See how iframing works with and without Proxee

# Issues

Each site is different so there are lots of improvements that can be made.  
If you find a broken site or have a suggestion, [please create an issue here.](https://github.com/ryanlelek/proxee/issues)
