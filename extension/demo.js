// Copyright 2020 Julien Nury. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

'use strict';

var encodedChallenge = '';
var challengeResponse = '';
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
        var responseAsString = ab2base64str(response);
        challengeResponse = responseAsString;
        $('#challengeResponse').empty().append(responseAsString);
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
    chrome.storage.sync.set({apiKey: $('#apiKey').val()}, function() {
        console.log('API Key saved to local storage');
    });
});

// Load custom API URL from local storage
chrome.storage.sync.get('customApiUrl', function(data) {
    if (data) {
        $('#customApiUrl').val(data.customApiUrl)
    }
});

// Save the custom API URL to local storage (if changed)
$('#customApiUrl').on('input', function() {
    chrome.storage.sync.set({customApiUrl: $('#customApiUrl').val()}, function() {
        console.log('Custom API URL saved to local storage');
    });
});

// Update challenge type (when changed)
$("input[name='challengeType']").change(function(element) {
    challengeType = $("input[name='challengeType']:checked").val();
    chrome.identity.getProfileUserInfo(GetIdentityCallback);
});

// Request challenge from Google API
$('#requestChallenge').click(function(element) {
    let apiKey = $('#apiKey').val();
    $('#encodedChallenge').collapse('show');
    if (apiKey) {
        try {
            let challengeUrlString = 'https://verifiedaccess.googleapis.com/v1/challenge?key=' + apiKey;
            $('#encodedChallenge').empty().append('Requesting challenge ...');
            let xmlhttp = new XMLHttpRequest();
            xmlhttp.open('POST', challengeUrlString, true);
            xmlhttp.send();
            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState === 4) {
                    if (xmlhttp.status === 200) {
                        var challenge = xmlhttp.responseText;
                        encodedChallenge = encodeChallenge(challenge);
                        $('#encodedChallenge').empty().append(encodedChallenge);
                    } else {
                        $('#encodedChallenge').empty().append('ERROR: ' + xmlhttp.responseText);
                    }
                }
            };
        } catch (error) {
            $('#encodedChallenge').empty().append('ERROR: ' + error);
        }
    }
    else {
        $('#encodedChallenge').empty().append('ERROR: please enter your Google API Key (step 1)');
    }
});

// Generate challenge response
$('#generateResponse').click(function(element) {
    $('#challengeResponse').collapse('show');
    if (encodedChallenge != '') {
        try {
            if (challengeType == 'device') {
                if (simulation) {
                    challengeResponse = 'A_Fake_Device_Response'
                    $('#challengeResponse').empty().append(challengeResponse);
                } else {
                    $('#challengeResponse').empty().append('Generating Device response ...');
                    chrome.enterprise.platformKeys.challengeMachineKey(
                        decodestr2ab(encodedChallenge), true, ChallengeCallback);
                }
            } else {
                if (simulation) {
                    challengeResponse = 'A_Fake_User_Response'
                    $('#challengeResponse').empty().append(challengeResponse);
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

// CAll remote API
$('#sendResponse').click(function(element) {
    $('#remoteStatus').collapse('show');
    let customApiUrl = $('#customApiUrl').val();
    if (customApiUrl) {
        let expectedIdentity = $('#expectedIdentity').val();
        if (expectedIdentity) {
            if (challengeResponse != '') {
                $('#remoteStatus').empty().append('Calling ' + customApiUrl + ' ...');
                $.ajax({
                    type: "POST",
                    url: customApiUrl,
                    data: JSON.stringify({ "expectedIdentity": expectedIdentity, "challengeResponse": challengeResponse}),
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
