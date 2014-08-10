var util = require('util'),
    _ = require('lodash'),
    errors = require('../errors'),
    extendWithGettersAndSetters = require('../util/extendWithGettersAndSetters'),
    Text = require('./Text');

function toCamelCase(str) {
    return str.replace(/-([a-z])/g, function ($0, ch) {
        return ch.toUpperCase();
    });
}

function fromCamelCase(str) {
    return str.replace(/[A-Z]/g, function ($0) {
        return '-' + $0.toLowerCase();
    });
}

function ContentSecurityPolicy(config) {
    Text.call(this, config);
}

util.inherits(ContentSecurityPolicy, Text);

extendWithGettersAndSetters(ContentSecurityPolicy.prototype, {
    contentType: null,

    supportedExtensions: [],

    get parseTree() {
        if (!this._parseTree) {
            var parseTree = {},
                syntaxErrors = [];
            this.text.split(/\s*;\s*/).forEach(function (directiveStr) {
                var fragments = directiveStr.split(/\s+/);
                if (fragments.length >= 2) {
                    var directiveName = toCamelCase(fragments.shift());
                    parseTree[directiveName] = fragments.join(' ');
                } else {
                    syntaxErrors.push(new errors.SyntaxError('Could not parse directive: ' + directiveStr));
                }
            }, this);
            if (syntaxErrors.length > 0) {
                if (this.assetGraph) {
                    syntaxErrors.forEach(function (syntaxError) {
                        this.assetGraph.emit('warn', syntaxError);
                    }, this);
                } else {
                    throw new Error(_.pluck(syntaxErrors, 'message').join('\n'));
                }
            }
            this._parseTree = parseTree;
        }
        return this._parseTree;
    },

    set parseTree(parseTree) {
        this.unload();
        this._parseTree = parseTree;
        this.markDirty();
    },

    get text() {
        if (!('_text' in this)) {
            if (this._parseTree) {
                this._text = '';
                Object.keys(this._parseTree).forEach(function (directiveName) {
                    this._text += (this._text ? '; ' : '') + fromCamelCase(directiveName) + ' ' + this._parseTree[directiveName];
                }, this);
            } else {
                this._text = this._getTextFromRawSrc();
            }
        }
        return this._text;
    }
});

// Grrr...
ContentSecurityPolicy.prototype.__defineSetter__('text', Text.prototype.__lookupSetter__('text'));

module.exports = ContentSecurityPolicy;
