// Copyright 2020 Julien Nury. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

// Functions inspired of https://developers.google.com/chrome/verified-access/developer-guide with some adaptations + utility functions

import * as asn1js from "./includes/asn1.js";
import Certificate from "./includes/pkijs/Certificate.js";

/**
 * encodeSignedData convert SignedData into base64 encoded SignedData protobuf
 * @param {object} signedData SignedData object
 * @return {string} base64 encoded SignedData protobuf
 */
var encodeSignedData = function(signedData) {
    let dataBinary = window.atob(signedData.data);
    let signatureBinary = window.atob(signedData.signature);
    let protoEncoded = '';

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

    return window.btoa(protoEncoded);
};

/**
 * decodeSignedData convert base64 encoded SignedData protobuf into SignedData object
 * @param {string} base64SignedData base64 encoded SignedData protobuf
 * @return {object} SignedData object
 */
var decodeSignedData = function(base64SignedData) {
    let data = '';
    let signature = '';
    let binary = window.atob(base64SignedData);

    if (binary[0] == '\u000A') {

        // Get len of the data part
        let index = 0;
        let len = binary[index + 1];
        let start = index + 2;
        let stop = start + varintDecode(len);
        if (binary[stop] != '\u0012') {
            // Data length may be 2 bytes long
            len = binary[index + 1] + binary[index + 2];
            start = index + 3;
            stop = start + varintDecode(len);
            if (binary[stop] != '\u0012') {
                console.log("Decoding error: bad data length")
                return ''
            }
        }

        // Get the data part
        for (var i = start; i < stop; i++) {
            data += binary[i];
        }

        // Get signature length
        index = stop;
        len = binary[index + 1]
        start = index + 2
        stop = start + varintDecode(len)
        if (stop != binary.length) {
            // Signature length may be 2 bytes long
            len = binary[index + 1] + binary[index + 2];
            start = index + 3;
            stop = start + varintDecode(len)
            if (stop != binary.length) {
                console.log("Decoding error: bad signature length")
                return ''
            }
        }

        // Get the signature part
        for (var i = start; i < stop; i++) {
            signature += binary[i];
        }
        
    }
    else {
        console.log("Decoding error: first byte is not 0A")
        return ''
    }

    let signedData = new Object();
    signedData.data = window.btoa(data);
    signedData.signature  = window.btoa(signature);

    return signedData;
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
 * varintDecode retrieve integer number from the binary encoding
 * @param {string} string binary varint-encoded number
 * @return {number} integer number 
 */
var varintDecode = function(string) {
    // This only works correctly for numbers 0 through 16383 (0x3FFF)
    if (string.length == 1) {
        return string.charCodeAt(0);
    } else {
        return ((string.charCodeAt(1) << 7) + (string.charCodeAt(0) - 128));
    }
};

/**
 * testPlatformKeysAvailability test if required local APIs are available (these APIs are only available on ChromeBooks)
 * @return {boolean} Required APIs availability
 */
var testPlatformKeysAvailability = function() {
    if (typeof chrome.enterprise !== 'undefined') {
        return (typeof chrome.enterprise.platformKeys !== 'undefined');
    } else {
        return false;
    }
};

/**
 * ab2base64str convert an ArrayBuffer to base64 string
 * @param {ArrayBuffer} buf ArrayBuffer instance
 * @return {string} base64 encoded string representation
 * of the ArrayBuffer
 */
var ab2base64str = function(buf) {
    let binary = '';
    let bytes = new Uint8Array(buf);
    let len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

/**
 * decodestr2ab convert a base64 encoded string to ArrayBuffer
 * @param {string} str string instance
 * @return {ArrayBuffer} ArrayBuffer representation of the string
 */
var decodestr2ab = function(str) {
    let binary_string =  window.atob(str);
    let len = binary_string.length;
    let bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
};

/**
 * decodeDerCertificate convert a DER encoded X.509 certificate into an object
 * @param {ArrayBuffer} derCertificate DER encoded X.509 certificate
 * @return {Object} certificate details
 */
var decodeDerCertificate = function(derCertificate) {
    let certificateAsn1 = asn1js.fromBER(certificateDer);
    let certificate = new Certificate({ schema: certificateAsn1.result });

    // Display certificate in JSON format
    if (debugFlag) {
        console.log("Certificates found in security chip");
        console.log(certificate.toJSON());
    }

    let attributeTypeAndValue;

    // Retrieve issuer CN
    let issuerCN = "Not defined";
    for(let j=0; j < certificate.issuer.typesAndValues.length; j++) {
        attributeTypeAndValue = certificate.issuer.typesAndValues[j];
        if (attributeTypeAndValue.type == "2.5.4.3") {
            issuerCN = attributeTypeAndValue.value.valueBlock.value;
        }
    }

    // Retrieve certificate CN
    let certificateCN = "Not defined";
    for(let j=0; j < certificate.subject.typesAndValues.length; j++) {
        attributeTypeAndValue = certificate.subject.typesAndValues[j];
        if (attributeTypeAndValue.type == "2.5.4.3") {
            certificateCN = attributeTypeAndValue.value.valueBlock.value;
        }
    }

    return {
        'cn': certificateCN,
        'issuer': issuerCN,
        'expiration': 'unknown'
    }
};
