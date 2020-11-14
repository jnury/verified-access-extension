// Copyright 2020 Julien Nury. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

'use strict';

// Handle click on extension icon
chrome.browserAction.onClicked.addListener(function(activeTab) {
    let newURL = chrome.extension.getURL('demo.html');
    chrome.tabs.create({ url: newURL });
});

// Load application policy into local storage
chrome.runtime.onInstalled.addListener(function() {    
    chrome.storage.managed.get(["settings"], function(result) {
        if (result["settings"] !== undefined) {
            if (result["settings"]["apiKey"] !== undefined) {
                apiKey = result["settings"]["apiKey"];
                chrome.storage.local.set({apiKey: apiKey});
            }

            if (result["settings"]["customApiUrl"] !== undefined) {
                customApiUrl = result["settings"]["customApiUrl"];
                chrome.storage.local.set({customApiUrl: customApiUrl});
            }
        }
    });
});