import * as asn1js from "./asn1.js";
import Certificate from "./pkijs/Certificate.js";

/**
 * Making UTC date from local date
 * @param {Date} date Date to convert from
 * @returns {Date}
 */
export function getUTCDate(date) {
	// noinspection NestedFunctionCallJS, MagicNumberJS
	return new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
}

/**
 * Get value for input parameters, or set a default value
 * @param {Object} parameters
 * @param {string} name
 * @param defaultValue
 */
export function getParametersValue(parameters, name, defaultValue)
{
	// noinspection ConstantOnRightSideOfComparisonJS, NonBlockStatementBodyJS
	if((parameters instanceof Object) === false)
		return defaultValue;
	
	// noinspection NonBlockStatementBodyJS
	if(name in parameters)
		return parameters[name];
	
	return defaultValue;
}

/**
 * Converts "ArrayBuffer" into a hexdecimal string
 * @param {ArrayBuffer} inputBuffer
 * @param {number} [inputOffset=0]
 * @param {number} [inputLength=inputBuffer.byteLength]
 * @param {boolean} [insertSpace=false]
 * @returns {string}
 */
export function bufferToHexCodes(inputBuffer, inputOffset = 0, inputLength = (inputBuffer.byteLength - inputOffset), insertSpace = false)
{
	let result = "";
	
	for(const item of (new Uint8Array(inputBuffer, inputOffset, inputLength)))
	{
		// noinspection ChainedFunctionCallJS
		const str = item.toString(16).toUpperCase();
		
		// noinspection ConstantOnRightSideOfComparisonJS, NonBlockStatementBodyJS
		if(str.length === 1)
			result += "0";
		
		result += str;
		
		// noinspection NonBlockStatementBodyJS
		if(insertSpace)
			result += " ";
	}
	
	return result.trim();
}

/**
 * Check input "ArrayBuffer" for common functions
 * @param {LocalBaseBlock} baseBlock
 * @param {ArrayBuffer} inputBuffer
 * @param {number} inputOffset
 * @param {number} inputLength
 * @returns {boolean}
 */
export function checkBufferParams(baseBlock, inputBuffer, inputOffset, inputLength)
{
	// noinspection ConstantOnRightSideOfComparisonJS
	if((inputBuffer instanceof ArrayBuffer) === false)
	{
		// noinspection JSUndefinedPropertyAssignment
		baseBlock.error = "Wrong parameter: inputBuffer must be \"ArrayBuffer\"";
		return false;
	}
	
	// noinspection ConstantOnRightSideOfComparisonJS
	if(inputBuffer.byteLength === 0)
	{
		// noinspection JSUndefinedPropertyAssignment
		baseBlock.error = "Wrong parameter: inputBuffer has zero length";
		return false;
	}
	
	// noinspection ConstantOnRightSideOfComparisonJS
	if(inputOffset < 0)
	{
		// noinspection JSUndefinedPropertyAssignment
		baseBlock.error = "Wrong parameter: inputOffset less than zero";
		return false;
	}
	
	// noinspection ConstantOnRightSideOfComparisonJS
	if(inputLength < 0)
	{
		// noinspection JSUndefinedPropertyAssignment
		baseBlock.error = "Wrong parameter: inputLength less than zero";
		return false;
	}
	
	// noinspection ConstantOnRightSideOfComparisonJS
	if((inputBuffer.byteLength - inputOffset - inputLength) < 0)
	{
		// noinspection JSUndefinedPropertyAssignment
		baseBlock.error = "End of input reached before message was fully decoded (inconsistent offset and length values)";
		return false;
	}
	
	return true;
}

/**
 * Convert number from 2^base to 2^10
 * @param {Uint8Array} inputBuffer
 * @param {number} inputBase
 * @returns {number}
 */
export function utilFromBase(inputBuffer, inputBase)
{
	let result = 0;
	
	// noinspection ConstantOnRightSideOfComparisonJS, NonBlockStatementBodyJS
	if(inputBuffer.length === 1)
		return inputBuffer[0];
	
	// noinspection ConstantOnRightSideOfComparisonJS, NonBlockStatementBodyJS
	for(let i = (inputBuffer.length - 1); i >= 0; i--)
		result += inputBuffer[(inputBuffer.length - 1) - i] * Math.pow(2, inputBase * i);
	
	return result;
}

/**
 * Convert number from 2^10 to 2^base
 * @param {!number} value The number to convert
 * @param {!number} base The base for 2^base
 * @param {number} [reserved=0] Pre-defined number of bytes in output array (-1 = limited by function itself)
 * @returns {ArrayBuffer}
 */
export function utilToBase(value, base, reserved = (-1)) {
	const internalReserved = reserved;
	let internalValue = value;
	
	let result = 0;
	let biggest = Math.pow(2, base);
	
	// noinspection ConstantOnRightSideOfComparisonJS
	for(let i = 1; i < 8; i++) {
		if(value < biggest) {
			let retBuf;
			
			// noinspection ConstantOnRightSideOfComparisonJS
			if(internalReserved < 0) {
				retBuf = new ArrayBuffer(i);
				result = i;
			}
			else
			{
				// noinspection NonBlockStatementBodyJS
				if(internalReserved < i)
					return (new ArrayBuffer(0));
				
				retBuf = new ArrayBuffer(internalReserved);
				
				result = internalReserved;
			}
			
			const retView = new Uint8Array(retBuf);
			
			// noinspection ConstantOnRightSideOfComparisonJS
			for(let j = (i - 1); j >= 0; j--)
			{
				const basis = Math.pow(2, j * base);
				
				retView[result - j - 1] = Math.floor(internalValue / basis);
				internalValue -= (retView[result - j - 1]) * basis;
			}
			
			return retBuf;
		}
		
		biggest *= Math.pow(2, base);
	}
	
	return new ArrayBuffer(0);
}

/**
 * Concatenate two ArrayBuffers
 * @param {...ArrayBuffer} buffers Set of ArrayBuffer
 */
export function utilConcatBuf(...buffers) {
	//region Initial variables
	let outputLength = 0;
	let prevLength = 0;
	//endregion
	
	//region Calculate output length
	
	// noinspection NonBlockStatementBodyJS
	for(const buffer of buffers)
		outputLength += buffer.byteLength;
	//endregion
	
	const retBuf = new ArrayBuffer(outputLength);
	const retView = new Uint8Array(retBuf);
	
	for(const buffer of buffers)
	{
		// noinspection NestedFunctionCallJS
		retView.set(new Uint8Array(buffer), prevLength);
		prevLength += buffer.byteLength;
	}
	
	return retBuf;
}

/**
 * Concatenate two Uint8Array
 * @param {...Uint8Array} views Set of Uint8Array
 */
export function utilConcatView(...views) {
	//region Initial variables
	let outputLength = 0;
	let prevLength = 0;
	//endregion
	
	//region Calculate output length
	// noinspection NonBlockStatementBodyJS
	for(const view of views)
		outputLength += view.length;
	//endregion
	
	const retBuf = new ArrayBuffer(outputLength);
	const retView = new Uint8Array(retBuf);
	
	for(const view of views)
	{
		retView.set(view, prevLength);
		prevLength += view.length;
	}
	
	return retView;
}

/**
 * Decoding of "two complement" values
 * The function must be called in scope of instance of "hexBlock" class ("valueHex" and "warnings" properties must be present)
 * @returns {number}
 */
export function utilDecodeTC() {
	const buf = new Uint8Array(this.valueHex);
	
	// noinspection ConstantOnRightSideOfComparisonJS
	if(this.valueHex.byteLength >= 2)
	{
		//noinspection JSBitwiseOperatorUsage, ConstantOnRightSideOfComparisonJS, LocalVariableNamingConventionJS, MagicNumberJS, NonShortCircuitBooleanExpressionJS
		const condition1 = (buf[0] === 0xFF) && (buf[1] & 0x80);
		// noinspection ConstantOnRightSideOfComparisonJS, LocalVariableNamingConventionJS, MagicNumberJS, NonShortCircuitBooleanExpressionJS
		const condition2 = (buf[0] === 0x00) && ((buf[1] & 0x80) === 0x00);
		
		// noinspection NonBlockStatementBodyJS
		if(condition1 || condition2)
			this.warnings.push("Needlessly long format");
	}
	
	//region Create big part of the integer
	const bigIntBuffer = new ArrayBuffer(this.valueHex.byteLength);
	const bigIntView = new Uint8Array(bigIntBuffer);
	// noinspection NonBlockStatementBodyJS
	for(let i = 0; i < this.valueHex.byteLength; i++)
		bigIntView[i] = 0;
	
	// noinspection MagicNumberJS, NonShortCircuitBooleanExpressionJS
	bigIntView[0] = (buf[0] & 0x80); // mask only the biggest bit
	
	const bigInt = utilFromBase(bigIntView, 8);
	//endregion
	
	//region Create small part of the integer
	const smallIntBuffer = new ArrayBuffer(this.valueHex.byteLength);
	const smallIntView = new Uint8Array(smallIntBuffer);
	// noinspection NonBlockStatementBodyJS
	for(let j = 0; j < this.valueHex.byteLength; j++)
		smallIntView[j] = buf[j];
	
	// noinspection MagicNumberJS
	smallIntView[0] &= 0x7F; // mask biggest bit
	
	const smallInt = utilFromBase(smallIntView, 8);
	//endregion
	
	return (smallInt - bigInt);
}

/**
 * Encode integer value to "two complement" format
 * @param {number} value Value to encode
 * @returns {ArrayBuffer}
 */
export function utilEncodeTC(value) {
	// noinspection ConstantOnRightSideOfComparisonJS, ConditionalExpressionJS
	const modValue = (value < 0) ? (value * (-1)) : value;
	let bigInt = 128;
	
	// noinspection ConstantOnRightSideOfComparisonJS
	for(let i = 1; i < 8; i++)
	{
		if(modValue <= bigInt)
		{
			// noinspection ConstantOnRightSideOfComparisonJS
			if(value < 0)
			{
				const smallInt = bigInt - modValue;
				
				const retBuf = utilToBase(smallInt, 8, i);
				const retView = new Uint8Array(retBuf);
				
				// noinspection MagicNumberJS
				retView[0] |= 0x80;
				
				return retBuf;
			}
			
			let retBuf = utilToBase(modValue, 8, i);
			let retView = new Uint8Array(retBuf);
			
			//noinspection JSBitwiseOperatorUsage, MagicNumberJS, NonShortCircuitBooleanExpressionJS
			if(retView[0] & 0x80)
			{
				//noinspection JSCheckFunctionSignatures
				const tempBuf = retBuf.slice(0);
				const tempView = new Uint8Array(tempBuf);
				
				retBuf = new ArrayBuffer(retBuf.byteLength + 1);
				// noinspection ReuseOfLocalVariableJS
				retView = new Uint8Array(retBuf);
				
				// noinspection NonBlockStatementBodyJS
				for(let k = 0; k < tempBuf.byteLength; k++)
					retView[k + 1] = tempView[k];
				
				// noinspection MagicNumberJS
				retView[0] = 0x00;
			}
			
			return retBuf;
		}
		
		bigInt *= Math.pow(2, 8);
	}
	
	return (new ArrayBuffer(0));
}

/**
 * Compare two array buffers
 * @param {!ArrayBuffer} inputBuffer1
 * @param {!ArrayBuffer} inputBuffer2
 * @returns {boolean}
 */
export function isEqualBuffer(inputBuffer1, inputBuffer2) {
	// noinspection NonBlockStatementBodyJS
	if(inputBuffer1.byteLength !== inputBuffer2.byteLength)
		return false;
	
	// noinspection LocalVariableNamingConventionJS
	const view1 = new Uint8Array(inputBuffer1);
	// noinspection LocalVariableNamingConventionJS
	const view2 = new Uint8Array(inputBuffer2);
	
	for(let i = 0; i < view1.length; i++)
	{
		// noinspection NonBlockStatementBodyJS
		if(view1[i] !== view2[i])
			return false;
	}
	
	return true;
}

/**
 * Pad input number with leade "0" if needed
 * @returns {string}
 * @param {number} inputNumber
 * @param {number} fullLength
 */
export function padNumber(inputNumber, fullLength) {
	const str = inputNumber.toString(10);
	
	// noinspection NonBlockStatementBodyJS
	if(fullLength < str.length)
		return "";
	
	const dif = fullLength - str.length;
	
	const padding = new Array(dif);
	// noinspection NonBlockStatementBodyJS
	for(let i = 0; i < dif; i++)
		padding[i] = "0";
	
	const paddingString = padding.join("");
	
	return paddingString.concat(str);
}

//**************************************************************************************
const base64Template = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
const base64UrlTemplate = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=";
//**************************************************************************************

/**
 * Encode string into BASE64 (or "base64url")
 * @param {string} input
 * @param {boolean} useUrlTemplate If "true" then output would be encoded using "base64url"
 * @param {boolean} skipPadding Skip BASE-64 padding or not
 * @param {boolean} skipLeadingZeros Skip leading zeros in input data or not
 * @returns {string}
 */
export function toBase64(input, useUrlTemplate = false, skipPadding = false, skipLeadingZeros = false) {
	let i = 0;
	
	// noinspection LocalVariableNamingConventionJS
	let flag1 = 0;
	// noinspection LocalVariableNamingConventionJS
	let flag2 = 0;
	
	let output = "";
	
	// noinspection ConditionalExpressionJS
	const template = (useUrlTemplate) ? base64UrlTemplate : base64Template;
	
	if(skipLeadingZeros)
	{
		let nonZeroPosition = 0;
		
		for(let i = 0; i < input.length; i++)
		{
			// noinspection ConstantOnRightSideOfComparisonJS
			if(input.charCodeAt(i) !== 0)
			{
				nonZeroPosition = i;
				// noinspection BreakStatementJS
				break;
			}
		}
		
		// noinspection AssignmentToFunctionParameterJS
		input = input.slice(nonZeroPosition);
	}
	
	while(i < input.length)
	{
		// noinspection LocalVariableNamingConventionJS, IncrementDecrementResultUsedJS
		const chr1 = input.charCodeAt(i++);
		// noinspection NonBlockStatementBodyJS
		if(i >= input.length)
			flag1 = 1;
		// noinspection LocalVariableNamingConventionJS, IncrementDecrementResultUsedJS
		const chr2 = input.charCodeAt(i++);
		// noinspection NonBlockStatementBodyJS
		if(i >= input.length)
			flag2 = 1;
		// noinspection LocalVariableNamingConventionJS, IncrementDecrementResultUsedJS
		const chr3 = input.charCodeAt(i++);
		
		// noinspection LocalVariableNamingConventionJS
		const enc1 = chr1 >> 2;
		// noinspection LocalVariableNamingConventionJS, MagicNumberJS, NonShortCircuitBooleanExpressionJS
		const enc2 = ((chr1 & 0x03) << 4) | (chr2 >> 4);
		// noinspection LocalVariableNamingConventionJS, MagicNumberJS, NonShortCircuitBooleanExpressionJS
		let enc3 = ((chr2 & 0x0F) << 2) | (chr3 >> 6);
		// noinspection LocalVariableNamingConventionJS, MagicNumberJS, NonShortCircuitBooleanExpressionJS
		let enc4 = chr3 & 0x3F;
		
		// noinspection ConstantOnRightSideOfComparisonJS
		if(flag1 === 1)
		{
			// noinspection NestedAssignmentJS, AssignmentResultUsedJS, MagicNumberJS
			enc3 = enc4 = 64;
		}
		else
		{
			// noinspection ConstantOnRightSideOfComparisonJS
			if(flag2 === 1)
			{
				// noinspection MagicNumberJS
				enc4 = 64;
			}
		}
		
		// noinspection NonBlockStatementBodyJS
		if(skipPadding)
		{
			// noinspection ConstantOnRightSideOfComparisonJS, NonBlockStatementBodyJS, MagicNumberJS
			if(enc3 === 64)
				output += `${template.charAt(enc1)}${template.charAt(enc2)}`;
			else
			{
				// noinspection ConstantOnRightSideOfComparisonJS, NonBlockStatementBodyJS, MagicNumberJS
				if(enc4 === 64)
					output += `${template.charAt(enc1)}${template.charAt(enc2)}${template.charAt(enc3)}`;
				else
					output += `${template.charAt(enc1)}${template.charAt(enc2)}${template.charAt(enc3)}${template.charAt(enc4)}`;
			}
		}
		else
			output += `${template.charAt(enc1)}${template.charAt(enc2)}${template.charAt(enc3)}${template.charAt(enc4)}`;
	}
	
	return output;
}

/**
 * Decode string from BASE64 (or "base64url")
 * @param {string} input
 * @param {boolean} [useUrlTemplate=false] If "true" then output would be encoded using "base64url"
 * @param {boolean} [cutTailZeros=false] If "true" then cut tailing zeroz from function result
 * @returns {string}
 */
export function fromBase64(input, useUrlTemplate = false, cutTailZeros = false) {
	// noinspection ConditionalExpressionJS
	const template = (useUrlTemplate) ? base64UrlTemplate : base64Template;
	
	//region Aux functions
	// noinspection FunctionWithMultipleReturnPointsJS, NestedFunctionJS
	function indexof(toSearch)
	{
		// noinspection ConstantOnRightSideOfComparisonJS, MagicNumberJS
		for(let i = 0; i < 64; i++)
		{
			// noinspection NonBlockStatementBodyJS
			if(template.charAt(i) === toSearch)
				return i;
		}
		
		// noinspection MagicNumberJS
		return 64;
	}
	
	// noinspection NestedFunctionJS
	function test(incoming)
	{
		// noinspection ConstantOnRightSideOfComparisonJS, ConditionalExpressionJS, MagicNumberJS
		return ((incoming === 64) ? 0x00 : incoming);
	}
	//endregion
	
	let i = 0;
	
	let output = "";
	
	while(i < input.length)
	{
		// noinspection NestedFunctionCallJS, LocalVariableNamingConventionJS, IncrementDecrementResultUsedJS
		const enc1 = indexof(input.charAt(i++));
		// noinspection NestedFunctionCallJS, LocalVariableNamingConventionJS, ConditionalExpressionJS, MagicNumberJS, IncrementDecrementResultUsedJS
		const enc2 = (i >= input.length) ? 0x00 : indexof(input.charAt(i++));
		// noinspection NestedFunctionCallJS, LocalVariableNamingConventionJS, ConditionalExpressionJS, MagicNumberJS, IncrementDecrementResultUsedJS
		const enc3 = (i >= input.length) ? 0x00 : indexof(input.charAt(i++));
		// noinspection NestedFunctionCallJS, LocalVariableNamingConventionJS, ConditionalExpressionJS, MagicNumberJS, IncrementDecrementResultUsedJS
		const enc4 = (i >= input.length) ? 0x00 : indexof(input.charAt(i++));
		
		// noinspection LocalVariableNamingConventionJS, NonShortCircuitBooleanExpressionJS
		const chr1 = (test(enc1) << 2) | (test(enc2) >> 4);
		// noinspection LocalVariableNamingConventionJS, MagicNumberJS, NonShortCircuitBooleanExpressionJS
		const chr2 = ((test(enc2) & 0x0F) << 4) | (test(enc3) >> 2);
		// noinspection LocalVariableNamingConventionJS, MagicNumberJS, NonShortCircuitBooleanExpressionJS
		const chr3 = ((test(enc3) & 0x03) << 6) | test(enc4);
		
		output += String.fromCharCode(chr1);
		
		// noinspection ConstantOnRightSideOfComparisonJS, NonBlockStatementBodyJS, MagicNumberJS
		if(enc3 !== 64)
			output += String.fromCharCode(chr2);
		
		// noinspection ConstantOnRightSideOfComparisonJS, NonBlockStatementBodyJS, MagicNumberJS
		if(enc4 !== 64)
			output += String.fromCharCode(chr3);
	}
	
	if(cutTailZeros)
	{
		const outputLength = output.length;
		let nonZeroStart = (-1);
		
		// noinspection ConstantOnRightSideOfComparisonJS
		for(let i = (outputLength - 1); i >= 0; i--)
		{
			// noinspection ConstantOnRightSideOfComparisonJS
			if(output.charCodeAt(i) !== 0)
			{
				nonZeroStart = i;
				// noinspection BreakStatementJS
				break;
			}
		}
		
		// noinspection NonBlockStatementBodyJS, NegatedIfStatementJS
		if(nonZeroStart !== (-1))
			output = output.slice(0, nonZeroStart + 1);
		else
			output = "";
	}
	
	return output;
}

export function arrayBufferToString(buffer) {
	let resultString = "";
	const view = new Uint8Array(buffer);
	
	// noinspection NonBlockStatementBodyJS
	for(const element of view)
		resultString += String.fromCharCode(element);
	
	return resultString;
}

export function stringToArrayBuffer(str) {
	const stringLength = str.length;
	
	const resultBuffer = new ArrayBuffer(stringLength);
	const resultView = new Uint8Array(resultBuffer);
	
	// noinspection NonBlockStatementBodyJS
	for(let i = 0; i < stringLength; i++)
		resultView[i] = str.charCodeAt(i);
	
	return resultBuffer;
}

/**
 * Get nearest to input length power of 2
 * @param {number} length Current length of existing array
 * @returns {number}
 */
export function nearestPowerOf2(length) {
	const base = (Math.log(length) / Math.log(2));
	
	const floor = Math.floor(base);
	const round = Math.round(base);
	
	// noinspection ConditionalExpressionJS
	return ((floor === round) ? floor : round);
}

/**
 * Delete properties by name from specified object
 * @param {Object} object Object to delete properties from
 * @param {Array.<string>} propsArray Array of properties names
 */
export function clearProps(object, propsArray) {
	for(const prop of propsArray)
		delete object[prop];
}

/**
 * encodeSignedData convert SignedData into base64 encoded SignedData protobuf
 * @param {object} signedData SignedData object
 * @return {string} base64 encoded SignedData protobuf
 */
export function encodeSignedData(signedData) {
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
export function decodeSignedData(base64SignedData) {
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
function varintEncode(number) {
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
function varintDecode(string) {
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
export function testPlatformKeysAvailability() {
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
export function ab2base64str(buf) {
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
export function decodestr2ab(str) {
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
export function decodeDerCertificate(derCertificate) {
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
