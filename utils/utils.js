const _sodium = require('libsodium-wrappers');

async function signMessage(signingString, privateKey) {
    await _sodium.ready;
    const sodium = _sodium;
    const signedMessage = sodium.crypto_sign_detached(
      signingString,
      sodium.from_base64(privateKey, _sodium.base64_variants.ORIGINAL)
    );
    const signature = sodium.to_base64(
      signedMessage,
      _sodium.base64_variants.ORIGINAL
    );
    return signature;
  }

  
  module.exports = signMessage