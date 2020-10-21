// Copyright 2020 Julien Nury. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

'use strict';

var encodedChallenge = '';
var challengeResponse = '';
let apiKeyField = document.getElementById('apiKey');
let requestChallenge = document.getElementById('requestChallenge');
let generateDeviceResponse = document.getElementById('generateDeviceResponse');
let generateUserResponse = document.getElementById('generateUserResponse');
let verifyChallengeResponse = document.getElementById('verifyChallengeResponse');

// Load API Key from local storage
chrome.storage.sync.get('apiKey', function(data) {
    if (data) {
        apiKeyField.value = data.apiKey;
    }
});

// Save the API Key to local storage (if changed)
apiKeyField.onchange = function(element) {
    chrome.storage.sync.set({apiKey: apiKeyField.value}, function() {
        console.log('API Key saved to local storage');
    });
};

// Request challenge from URL
requestChallenge.onclick = function(element) {
    let apiKey = apiKeyField.value;
    if (apiKey != '') {
        let challengeUrlString = 'https://verifiedaccess.googleapis.com/v1/challenge?key=' + apiKey;
        $('#encodedChallenge').empty().append('Requesting challenge ...');
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.open('POST', challengeUrlString, true);
        xmlhttp.send();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4) {
                var challenge = xmlhttp.responseText;
                encodedChallenge = encodeChallenge(challenge);
                $('#encodedChallenge').empty().append('Encoded Challenge: ' + encodedChallenge);
            }
        };
    }
    else {
        $('#encodedChallenge').empty().append('ERROR: please enter your Google API key in the form above');
    }
    
};

// Generate challenge response
var generateResponse = function(isDeviceVerification) {
    if (encodedChallenge != '') {
        if (testPlatformKeysAvailability()) {
            try {
                if (isDeviceVerification) {
                    $('#challengeResponse').empty().append('Generating Device response ...');
                    chrome.enterprise.platformKeys.challengeMachineKey(
                        decodestr2ab(encodedChallenge), true, ChallengeCallback);
                } else {
                    $('#challengeResponse').empty().append('Generating User response ...');
                    chrome.enterprise.platformKeys.challengeUserKey(
                        decodestr2ab(encodedChallenge), true, ChallengeCallback);
                }
            } catch (error) {
                $('#challengeResponse').empty().append('ERROR: ' + error);
            }
        }
        else {
            $('#challengeResponse').empty().append('ERROR: TPM API not available. Please check prerequisites');
        }
    }
    else {
        $('#challengeResponse').empty().append('ERROR: please request a challenge first');
    }
}

// Generate challenge events
generateDeviceResponse.onclick = function(element) { generateResponse(true); };
generateUserResponse.onclick = function(element) { generateResponse(false); };

// Callback to retreive the challenge response
var ChallengeCallback = function(response) {
    if (chrome.extension.lastError) {
        $('#challengeResponse').empty().append('ERROR: ' + chrome.extension.lastError.message);
    } else {
        var responseAsString = ab2base64str(response);
        challengeResponse = responseAsString;
        $('#challengeResponse').empty().append('Challenge response: ' + responseAsString);
    }
};

// Verify challenge response
verifyChallengeResponse.onclick = function(element) {
    let expectedIdentity = document.getElementById('expectedIdentity');
    if (expectedIdentity.value != '') {
        if (challengeResponse != '') {
            let apiKey = document.getElementById('apiKey').value;
            let challengeUrlString = 'https://verifiedaccess.googleapis.com/v1/challenge:verify?key=' + apiKey;
            $('#verifyResult').empty().append('Verifying challenge response ...');
        }
        else {
            $('#verifyResult').empty().append('ERROR: please generate a challenge response first');
        }
    }
    else {
        $('#verifyResult').empty().append('ERROR: please enter an expected identity (domain for device or username for user)');
    }
}
