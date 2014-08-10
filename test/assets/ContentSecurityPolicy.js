/*global describe, it*/
var expect = require('../unexpected-with-plugins'),
    AssetGraph = require('../../lib'),
    errors = require('../../lib/errors');

describe('assets/ContentSecurityPolicy', function () {
    it('should handle a test case with existing Content-Security-Policy meta tags', function (done) {
        var warnings = [];
        new AssetGraph({root: __dirname + '/../../testdata/assets/ContentSecurityPolicy/'})
            .on('warn', function (err) {
                warnings.push(err);
            })
            .loadAssets('index.html')
            .populate()
            .queue(function (assetGraph) {
                expect(assetGraph, 'to contain assets', 3);
                expect(assetGraph, 'to contain asset', 'Html');
                expect(assetGraph, 'to contain assets', 'ContentSecurityPolicy', 2);

                expect(assetGraph, 'to contain relations', 'HtmlContentSecurityPolicy', 2);

                var contentSecurityPolicies = assetGraph.findAssets({type: 'ContentSecurityPolicy'});
                expect(contentSecurityPolicies[0].parseTree, 'to equal', {
                    defaultSrc: '\'self\'',
                    styleSrc: '\'unsafe-inline\'',
                    reportUri: 'http://example.com/tellyouwhat'
                });

                expect(contentSecurityPolicies[1].parseTree, 'to equal', {
                    defaultSrc: '\'self\'',
                    reportUri: 'http://example.com/gossip'
                });

                contentSecurityPolicies[0].parseTree.reportUri = 'http://somewhereelse.com/tellyouwhat';
                contentSecurityPolicies[0].markDirty();

                expect(assetGraph.findAssets({type: 'Html'})[0].text, 'to contain', 'report-uri http://somewhereelse.com/tellyouwhat');

                expect(warnings, 'to equal', [
                    new errors.SyntaxError('Could not parse directive: fooBarQuux')
                ]);
            })
            .run(done);
    });
});
