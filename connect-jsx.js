var path = require('path');
var url = require('url');

var mime = require('mime');
var send = require('send');
var React = require('react-tools');

/*
 * jsx: Automatically convert .jsx files to .js files when requested.
 *
 * For an incoming request for a .js file, the middleware modifies the
 * url to end in .jsx, then invokes `send` to read the .jsx file.
 *
 * Then once the file is read from disk, it runs the react converter.
 *
 * Modeled heavily after connect.static
 */
module.exports = function connect_jsx(root, options) {

    return function jsx(req, res, next) {
        if ('GET' !== req.method && 'HEAD' !== req.method) {
            return next();
        }

        var pathname = url.parse(req.url).pathname;

        // TODO: make extension configurable in options
        var ext = path.extname(pathname);
        if (ext !== '.js') {
            return next();
        }

        var content_type = mime.lookup(pathname);
        var charset = mime.charsets.lookup(content_type);

        pathname += 'x';

        function error(err) {
            if (err.status === 404) {
                next();
            } else {
                next(err);
            }
        }

        // Override .write and .end in the response object to cons
        // together the .jsx original source, then once the response
        // is complete, convert to js and send it to the real
        // response.
        var jsx = '';
        var _encoding;
        var _write = res.write;
        res.write = function(chunk, encoding) {
            _encoding = encoding;
            jsx += chunk;
        };

        var _end = res.end;
        res.end = function() {
            try {
                var js = React.transform(jsx);
                res.setHeader('Content-Length', js.length);
                res.setHeader('Content-Type', content_type + (charset ? '; charset=' + charset : ''));
                _write.call(res, js, _encoding);

            } catch (err) {
                var body = err.toString();
                res.setHeader('Content-Length', body.length);
                res.statusCode = 500;
                _write.call(res, body);
            }

            _end.call(res);
        };

        send(req, pathname)
            .root(root)
            .on('error', error)
            .on('directory', error)
            .pipe(res);
    };
};
