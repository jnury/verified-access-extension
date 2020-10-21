// Copyright 2020 Julien Nury. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

'use strict';

chrome.browserAction.onClicked.addListener(function(activeTab) {
    let newURL = chrome.extension.getURL('demo.html');
    chrome.tabs.create({ url: newURL });
});
