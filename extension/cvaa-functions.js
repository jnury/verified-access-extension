// Copyright 2020 Julien Nury. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

// Functions from https://developers.google.com/chrome/verified-access/developer-guide with some adaptations + utility functions

/**
 * encodeChallenge convert JSON challenge into base64 encoded byte array
 * @param {string} challenge JSON encoded challenge protobuf
 * @return {string} base64 encoded challenge protobuf
 */
var encodeChallenge = function(challenge) {
    var jsonChallenge = JSON.parse(challenge);
    var challengeData = jsonChallenge.challenge.data;
    var challengeSignature = jsonChallenge.challenge.signature;

    var protobufBinary = protoEncodeChallenge(
        window.atob(challengeData), window.atob(challengeSignature));

    return window.btoa(protobufBinary);
};
  
/**
 * protoEncodeChallenge produce binary encoding of the challenge protobuf
 * @param {string} dataBinary binary data field
 * @param {string} signatureBinary binary signature field
 * @return {string} binary encoded challenge protobuf
 */
var protoEncodeChallenge = function(dataBinary, signatureBinary) {
    var protoEncoded = '';

    // See https://developers.google.com/protocol-buffers/docs/encoding
    // for encoding details.

    // 0x0A (00001 010, field number 1, wire type 2 [length-delimited])
    protoEncoded += '\u000A';

    // encode length of the data
    protoEncoded += varintEncode(dataBinary.length);
    // add data
    protoEncoded += dataBinary;

    // 0x12 (00010 010, field number 2, wire type 2 [length-delimited])
    protoEncoded += '\u0012';
    // encode length of the signature
    protoEncoded += varintEncode(signatureBinary.length);
    // add signature
    protoEncoded += signatureBinary;

    return protoEncoded;
};
  
/**
 * varintEncode produce binary encoding of the integer number
 * @param {number} number integer number
 * @return {string} binary varint-encoded number
 */
var varintEncode = function(number) {
    // This only works correctly for numbers 0 through 16383 (0x3FFF)
    if (number <= 127) {
        return String.fromCharCode(number);
    } else {
        return String.fromCharCode(128 + (number & 0x7f), number >>> 7);
    }
};

/**
 * testPlatformKeysAvailability test if required local APIs are available (these APIs are only available on ChromeBooks)
 * @return {boolean} binary varint-encoded number
 */
function testPlatformKeysAvailability() {
    if (typeof chrome.enterprise !== 'undefined') {
        return (typeof chrome.enterprise.platformKeys !== 'undefined');
    } else {
        return false
    }
}

/**
 * ab2base64str convert an ArrayBuffer to base64 string
 * @param {ArrayBuffer} buf ArrayBuffer instance
 * @return {string} base64 encoded string representation
 * of the ArrayBuffer
 */
var ab2base64str = function(buf) {
    var binary = '';
    var bytes = new Uint8Array(buf);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

/**
 * decodestr2ab convert a base64 encoded string to ArrayBuffer
 * @param {string} str string instance
 * @return {ArrayBuffer} ArrayBuffer representation of the string
 */
var decodestr2ab = function(str) {
    var binary_string =  window.atob(str);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}
