// Copyright 2020 Julien Nury. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

'use strict';

// Handle click on extension icon
chrome.browserAction.onClicked.addListener(function(activeTab) {

    // All this code is to avoid openning same tab twice, don't hesitate to propose a better solution ;-)
    let openNewTab = function(){
        let newURL = chrome.extension.getURL('demo.html');
        chrome.tabs.create({ url: newURL }, function(tab){
            chrome.storage.local.set({tabId: tab.id})
        });
    };

    chrome.storage.local.get(["tabId"], function(result) {
        let tabId = 0;
        if (result != undefined) {
            if (result.tabId != undefined) {
                tabId = result.tabId;
            }
        } 
        
        if (tabId != 0) {
            chrome.tabs.query({currentWindow: true}, function(tabs){
                for (let i = 0; i < tabs.length; i++) {
                    if (tabs[i].id == tabId) {
                        let index = tabs[i].index;
                        chrome.tabs.highlight({tabs: index});
                        return;
                    }
                }
                openNewTab();
            });
        } else {
            openNewTab();
        }
    });
});
