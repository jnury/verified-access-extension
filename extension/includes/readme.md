# Library lists

## General libraries and stylsheets
These libraries are used for UI rendering and interactions:

* **bootstrap.bundle.min.js** Bootstrap functions, from [Get Bootstrap](https://getbootstrap.com/)
* **bootstrap.min.css** Bootstrap stylesheet, from [Get Bootstrap](https://getbootstrap.com/)
* **jquery-3.5.1.min.js** jQuery functions, from [jQuery](https://jquery.com/)

## Chrome Verified Access API

This library handle some of Chrome Verified Access data transformations:

* **cvaa.js** Chrome Verified Access dedicated functions, from [Chrome Verified Access Developer's Guide](https://developers.google.com/chrome/verified-access/developer-guide) + some adaptations

## X509 certificates

These libraries are only needed if you want to handle X509 certificates (as Chrome Verified Access can handle the generation of a CSR):

* **pkijs folder** pure JavaScript library implementing the formats that are used in PKI applications, from [PKI.js](https://pkijs.org/)
* **asn1.js** pure JavaScript library implementing ASN.1 standard, from [ASN1js](https://github.com/PeculiarVentures/asn1.js#readme)
* **bytestream.js** functions for making search for patterns and data transformation, from [ByteStream.js](https://github.com/PeculiarVentures/ByteStream.js#readme)
* **utils.js** prerequisite functions for previous libraries, compiled by J.P.Combe (thank you ;-))  
