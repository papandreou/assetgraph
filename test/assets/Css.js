/*global describe, it*/
var expect = require('../unexpected-with-plugins'),
    sinon = require('sinon'),
    AssetGraph = require('../../lib');

describe('assets/Css', function () {
    it('should handle a test case with a parse error in an inline Css asset', function (done) {
        var err;
        new AssetGraph({root: __dirname + '/../../testdata/assets/Css/parseErrors/'})
            .on('warn', function (_err) {
                err = _err;
            })
            .loadAssets('parseErrorInInlineCss.html')
            .queue(function () {
                expect(err, 'to be an', Error);
                expect(err.message, 'to match', /parseErrorInInlineCss\.html/);
            })
            .run(done);
    });

    it('should handle a test case with a parse error in an external Css asset', function (done) {
        var err;
        new AssetGraph({root: __dirname + '/../../testdata/assets/Css/parseErrors/'})
            .on('warn', function (_err) {
                err = _err;
            })
            .loadAssets('parseErrorInExternalCss.html')
            .populate()
            .queue(function (assetGraph) {
                expect(err, 'to be an', Error);
                expect(err.message, 'to match', /parseError\.css/);
            })
            .run(done);
    });

    it('should handle a test case that has multiple neighbour @font-face rules', function (done) {
        new AssetGraph({root: __dirname + '/../../testdata/assets/Css/multipleFontFaceRules/'})
            .loadAssets('index.css')
            .populate()
            .queue(function (assetGraph) {
                expect(assetGraph, 'to contain asset', 'Css');
                expect(assetGraph.findAssets({type: 'Css'})[0].text.match(/@font-face/g), 'to have length', 3);

                assetGraph.findAssets({type: 'Css'})[0].markDirty();
                expect(assetGraph.findAssets({type: 'Css'})[0].text.match(/@font-face/g), 'to have length', 3);
            })
            .run(done);
    });

    it('should get the default encoding when there is no other way to determine encoding', function () {
        var asset = new AssetGraph.Css({});

        expect(asset.encoding, 'to be', AssetGraph.Text.prototype.defaultEncoding);
    });

    it('should get set a new encoding correctly', function () {
        var asset = new AssetGraph.Css({
            encoding: 'utf-8',
            text: 'body:before { content: "🐮"; }'
        });

        var markDirtySpy = sinon.spy(asset, 'markDirty');

        asset.encoding = 'iso-8859-1';

        expect(markDirtySpy, 'was called once');
        expect(asset.encoding, 'to be', 'iso-8859-1');
    });

    it('should minify Css text', function () {
        var cssText = 'body {\n    background: red;\n}\n';
        var asset = new AssetGraph.Css({
            text: cssText
        });

        expect(asset.text, 'to be', cssText);

        asset.minify();
        expect(asset.text, 'to be', 'body{background:red}');
    });

    it('should pretty print Css text', function () {
        var cssText = 'body{background:red}';
        var asset = new AssetGraph.Css({
            text: cssText
        });

        expect(asset.text, 'to be', cssText);

        asset.prettyPrint();
        expect(asset.text, 'to be', 'body {background: red;}\n');
    });

    it('should throw an error on completely invalid CSS', function () {
        var asset = new AssetGraph.Css({
            text: 'body {}'
        });
        function getParseTree() {
            return asset.parseTree;
        }

        expect(getParseTree, 'not to throw');

        asset.text = '}';

        expect(getParseTree, 'to throw');
    });

    it('should emit an error on completely invalid CSS if the asset is part of an assetGraph', function () {
        var assetGraph = new AssetGraph();
        var asset = new AssetGraph.Css({
            text: 'body {}'
        });
        function getParseTree() {
            return asset.parseTree;
        }

        assetGraph.addAsset(asset);
        var emitter = sinon.spy(assetGraph, 'emit');

        expect(getParseTree, 'not to throw');
        expect(emitter, 'was not called');

        asset.text = '}';

        expect(emitter, 'was called once');
    });

    it('should update the text of a Css asset when setting parseTree', function () {
        var cssText = 'h1{color:hotpink}';
        var first = new AssetGraph.Css({
            text: 'h1{color:red}'
        });
        var second = new AssetGraph.Css({
            text: cssText
        });

        var unloadSpy = sinon.spy(first, 'unload');
        var markDirtySpy = sinon.spy(first, 'markDirty');

        first.parseTree = second.parseTree;

        expect(unloadSpy, 'was called once');
        expect(markDirtySpy, 'was called once');

        expect(first.text, 'to be', cssText);
    });
});
