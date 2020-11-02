// Copyright 2020 Julien Nury. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

'use strict';

var encodedChallenge = '';
var challengeResponse = null;
var simulation = false;
var challengeType = $("input[name='challengeType']:checked").val();

// Trap errors
window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {
    let message = '<pre>An error occured in: ' + url + '<br>On line: ' + lineNumber + '<br>Message: ' + errorMsg + '</pre>'
    $('#errorModalMessage').empty().append(message);
    $('#errorModal').modal('show')
    return false;
}

// Callback to retrieve the user identity
var GetIdentityCallback = function(userInfo) {
    let email = 'user@domain.com'
    if (userInfo.email) {
        email = userInfo.email
    }

    if (challengeType == 'device') {
        let lasta = email.lastIndexOf('@');
        if (lasta != -1) {
            $('#expectedIdentity').val(email.substring(lasta+1))
        } else {
            $('#expectedIdentity').val('domain.com')
        }
    }
    else {
        $('#expectedIdentity').val(email)
    }
};

// Callback to retrieve the challenge response
var ChallengeCallback = function(response) {
    if (chrome.extension.lastError) {
        $('#challengeResponse').empty().append('ERROR: ' + chrome.extension.lastError.message);
    } else {
        let responseAsString = ab2base64str(response);
        challengeResponse = decodeSignedData(responseAsString);
        $('#challengeResponse').empty().append(JSON.stringify(challengeResponse, null, 1));
    }
};

// Toggle to simulation mode if enterprise API is not available
if (!testPlatformKeysAvailability()) {
    $('#apiWarning').collapse('show');
    simulation = true;
}

// Init Expected identity field
chrome.identity.getProfileUserInfo(GetIdentityCallback);

// Load API Key from local storage
chrome.storage.sync.get('apiKey', function(data) {
    if (data) {
        $('#apiKey').val(data.apiKey)
    }
});

// Save the API Key to local storage (if changed)
$('#apiKey').on('input', function() {
    chrome.storage.sync.set({apiKey: $('#apiKey').val()}, function() {});
});

// Load custom API URL from local storage
chrome.storage.sync.get('customApiUrl', function(data) {
    if (data) {
        $('#customApiUrl').val(data.customApiUrl)
    }
});

// Save the custom API URL to local storage (if changed)
$('#customApiUrl').on('input', function() {
    chrome.storage.sync.set({customApiUrl: $('#customApiUrl').val()}, function() {});
});

// Update challenge type (when changed)
$("input[name='challengeType']").change(function(element) {
    challengeType = $("input[name='challengeType']:checked").val();
    chrome.identity.getProfileUserInfo(GetIdentityCallback);
});

// Request challenge from Google API
$('#requestChallenge').click(function(element) {
    let apiKey = $('#apiKey').val();
    $('#challenge').collapse('show');
    if (apiKey) {
        try {
            let challengeUrlString = 'https://verifiedaccess.googleapis.com/v1/challenge?key=' + apiKey;
            $('#challenge').empty().append('Requesting challenge ...');
            let xmlhttp = new XMLHttpRequest();
            xmlhttp.open('POST', challengeUrlString, true);
            xmlhttp.send();
            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState === 4) {
                    if (xmlhttp.status === 200) {
                        let response = JSON.parse(xmlhttp.responseText);
                        $('#challenge').empty().append(JSON.stringify(response.challenge, null, 1));
                        encodedChallenge = encodeSignedData(response.challenge);
                    } else {
                        $('#challenge').empty().append('ERROR: ' + xmlhttp.responseText);
                    }
                }
            };
        } catch (error) {
            $('#challenge').empty().append('ERROR: ' + error);
        }
    }
    else {
        $('#challenge').empty().append('ERROR: please enter your Google API Key (step 1)');
    }
});

// Generate challenge response
$('#generateResponse').click(function(element) {
    $('#challengeResponse').collapse('show');
    if (encodedChallenge != '') {
        try {
            if (challengeType == 'device') {
                if (simulation) {
                    challengeResponse = decodeSignedData("ChdBX0Zha2VfRGV2aWNlX1Jlc3BvbnNlChIhQV9GYWtlX0RldmljZV9SZXNwb25zZV9TaWduYXR1cmUK");
                    $('#challengeResponse').empty().append(JSON.stringify(challengeResponse, null, 1));
                } else {
                    $('#challengeResponse').empty().append('Generating Device response ...');
                    chrome.enterprise.platformKeys.challengeMachineKey(
                        decodestr2ab(encodedChallenge), true, ChallengeCallback);
                }
            } else {
                if (simulation) {
                    challengeResponse = decodeSignedData("ChVBX0Zha2VfVXNlcl9SZXNwb25zZQoSH0FfRmFrZV9Vc2VyX1Jlc3BvbnNlX1NpZ25hdHVyZQo=");
                    $('#challengeResponse').empty().append(JSON.stringify(challengeResponse, null, 1));
                } else {
                    $('#challengeResponse').empty().append('Generating User response ...');
                    chrome.enterprise.platformKeys.challengeUserKey(
                        decodestr2ab(encodedChallenge), true, ChallengeCallback);
                }
            }
        } catch (error) {
            $('#challengeResponse').empty().append('ERROR: ' + error);
        }
    }
    else {
        $('#challengeResponse').empty().append('ERROR: please request a challenge first (step 2)');
    }
});

// Call remote API
$('#sendResponse').click(function(element) {
    $('#remoteStatus').collapse('show');
    let customApiUrl = $('#customApiUrl').val();
    if (customApiUrl) {
        let expectedIdentity = $('#expectedIdentity').val();
        if (expectedIdentity) {
            if (challengeResponse) {
                $('#remoteStatus').empty().append('Calling ' + customApiUrl + ' ...');

                let data = new Object();
                data.challengeResponse = challengeResponse;
                data.expectedIdentity = expectedIdentity;

                $.ajax({
                    type: "POST",
                    url: customApiUrl,
                    data: JSON.stringify(data),
                    contentType : 'application/json',
                    dataType: "text",
                    success: function(data, status, xhr) { $('#remoteStatus').empty().append(data); },
                    error: function(request, status, error) { $('#remoteStatus').empty().append('ERROR: ' + request.responseText); }
                });
            }
            else {
                $('#remoteStatus').empty().append('ERROR: please generate a challenge response first (step 3)');
            }
        }
        else {
            $('#remoteStatus').empty().append('ERROR: please enter the expected identity (step 4)');
        }
    }
    else {
        $('#remoteStatus').empty().append('ERROR: please provide your custom API url (step 5)');
    }
});
