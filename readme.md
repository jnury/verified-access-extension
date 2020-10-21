# Chrome Verified Access API demo extension

This Chrome extension demonstrates how to authenticate in web application based on the [Chrome Verified Access API](https://developers.google.com/chrome/verified-access).

From the documentation: The Chrome Verified Access API allows network services, such as VPNs, intranet pages, and so on to cryptographically verify that their clients are genuine and conform to corporate policy.

![Suggested implementation](https://github.com/jnury/verified-access-extension/blob/main/doc/suggested-implementation.svg?raw=true)

To do so you need to deploy a Chrome extension on your managed devices. This extension will detect when the user browse a website that need authentication and handle communication with the Verified Access API then generate a token (sort of) and send it to the website. The website will then need to verify the token against the Verified Access API. You can find a demo server application here: ...
