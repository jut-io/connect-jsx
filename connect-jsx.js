var path = require('path');
var url = require('url');

var mime = require('mime');
var send = require('send');
var React = require('react-tools');
var Buffer = require('buffer').Buffer;

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
    options = options || {};

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

        var _write = res.write;
        var _end = res.end;

        function error(err) {
            res.write = _write;
            res.end = _end;

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
        res.write = function(chunk, encoding) {
            _encoding = encoding;
            jsx += chunk;
        };

        res.end = function() {
            var js;
            var source_path = url.parse(req.url).pathname;
            try {
                js = React.transform(jsx, {
                    harmony: !!options.harmony,
                    sourceMap: !!options.sourceMap,
                    sourceFilename: options.sourceMap ? pathname : null
                });
            } catch (err) {
                js = 'throw new Error("Connect-Jsx transforming ' + source_path + ': ' + err.message + '");';
            }
            res.setHeader('Content-Length', Buffer.byteLength(js));
            res.setHeader('Connect-Jsx-Source-Path', source_path);
            res.setHeader('Content-Type', content_type + (charset ? '; charset=' + charset : ''));
            _write.call(res, js, _encoding);
            _end.call(res);
        };

        send(req, pathname, {root: root})
            .on('error', error)
            .on('directory', error)
            .pipe(res);
    };
};
