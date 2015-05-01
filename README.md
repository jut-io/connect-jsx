connect-jsx [![Build Status: Linux](https://travis-ci.org/jut-io/connect-jsx.png?branch=master)](https://travis-ci.org/jut-io/connect-jsx)
===========

Middleware to convert react jsx files to javascript on the fly.

Overview
--------

In response to an HTTP `GET` for a file ending in `.js`, the module
looks for a corresponding file with a `.jsx` extension, and if found,
compiles it into the javascript equivalent.

This is useful with [require.js](http://requirejs.org) or similar
front-end javascript loaders as an alternative to having to do the jsx
compilation in the browser.

Uses [react-tools](https://github.com/facebook/react) to do the actual
transformation and [send](https://github.com/visionmedia/send) to do
the heavy lifting of the actual static file serving.


Installation
------------

    npm install --save connect-jsx

Usage
-----

Similar usage to [connect.static](http://www.senchalabs.org/connect/static.html):

    var jsx = require('connect-jsx');
    var connect = require('connect');

    var root = __dirname; // base directory with .jsx files
    var app = connect();
    app.use(jsx(root));
