
var fs = require('fs');
var http = require('http');
var path = require('path');
var connect = require('connect');
var request = require('request');
var expect = require('chai').expect;
var React = require('react-tools');
var jsx = require('../connect-jsx');

describe('connect-jsx middleware', function() {
    var app;
    it('can be installed', function(done) {
        app = connect()
            .use(connect.logger('dev'))
            .use(jsx(path.join(__dirname, 'root')));

        http.createServer(app).listen(9000, function() {
            done();
        });
    });

    it('converts valid jsx files', function(done) {
        var jsx = fs.readFileSync(path.join(__dirname, 'root/test1.jsx'),
                                  {encoding: 'utf8'});
        var js = React.transform(jsx);

        request('http://localhost:9000/test1.js', function(err, res, body) {
            expect(res.statusCode).equal(200);
            expect(res.headers['connect-jsx-source-path']).equals('/test1.js');
            expect(body).eql(js);
            done();
        });
    });

    it('does not convert requests with .jsx extension', function(done) {
        request('http://localhost:9000/test1.jsx', function(err, res, body) {
            expect(res.statusCode).equal(404);
            expect(res.headers['connect-jsx-source-path']).is.undefined;
            done();
        });
    });

    it('does not convert requests for .js files without jsx', function(done) {
        request('http://localhost:9000/test2.js', function(err, res, body) {
            expect(res.statusCode).equal(404);
            expect(res.headers['connect-jsx-source-path']).is.undefined;
            done();
        });
    });

    it('allows static middleware to be chained after', function() {
        // Add a regular static middleware so that requests for .jsx
        // are properly handled.
        app.use(connect.static(path.join(__dirname, 'root')));
    });

    it('passes through requests with .jsx extension', function(done) {
        var jsx = fs.readFileSync(path.join(__dirname, 'root/test1.jsx'),
                                  {encoding: 'utf8'});

        request('http://localhost:9000/test1.jsx', function(err, res, body) {
            expect(res.statusCode).equal(200);
            expect(res.headers['connect-jsx-source-path']).is.undefined;
            expect(body).equal(jsx);
            done();
        });
    });

    it('passes through requests for .js files', function(done) {
        var js = fs.readFileSync(path.join(__dirname, 'root/test2.js'),
                                 {encoding: 'utf8'});

        request('http://localhost:9000/test2.js', function(err, res, body) {
            expect(res.statusCode).equal(200);
            expect(res.headers['connect-jsx-source-path']).is.undefined;
            expect(body).equal(js);
            done();
        });
    });

    it('handles conversion errors', function(done) {
        request('http://localhost:9000/bad1.js', function(err, res, body) {
            expect(res.statusCode).equal(200);
            expect(body).match(/throw new Error/);
            done();
        });
    });

    it('converts properly if jsx files contain special characters', function(done) {
        var jsx = fs.readFileSync(path.join(__dirname, 'root/test-special.jsx'),
                                  {encoding: 'utf8'});
        var js = React.transform(jsx);

        request('http://localhost:9000/test-special.js', function(err, res, body) {
            expect(res.statusCode).equal(200);
            expect(res.headers['connect-jsx-source-path']).equals('/test-special.js');
            expect(body).eql(js);
            done();
        });
    });


});
