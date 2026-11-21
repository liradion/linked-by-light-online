'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'mobile/ios/LinkedByLightPreview/GameWebView.swift'),'utf8');
const project=fs.readFileSync(path.join(root,'mobile/ios/project.yml'),'utf8');
test('v37: iOS preview shell requires HTTPS first-party host and no privileged JS bridge',()=>{
 assert.match(source,/PreviewOrigin.permitted\(url\)/);
 assert.match(source,/url.scheme\?\.lowercased\(\) == "https"/);
 assert.match(source,/linked-by-light-eu\.onrender\.com/);
 assert.match(source,/decisionHandler\(\.cancel\)/);
 assert.doesNotMatch(source,/addScriptMessageHandler|evaluateJavaScript|WKScriptMessageHandler/);
 assert.doesNotMatch(source,/SteamAppId|SteamAPIKey|AppStoreSharedSecret|api[_-]?key/);
});
test('v37: iOS preview stays unsigned, internal and landscape-only',()=>{
 assert.match(project,/CODE_SIGNING_ALLOWED: 'NO'/);
 assert.match(project,/PRODUCT_BUNDLE_IDENTIFIER: io.github.liradion.linkedbylight.preview/);
 assert.match(project,/UIInterfaceOrientationLandscapeLeft/);
 assert.match(project,/UIInterfaceOrientationLandscapeRight/);
});
