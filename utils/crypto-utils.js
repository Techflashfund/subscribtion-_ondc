const crypto = require('crypto');
const _sodium = require('libsodium-wrappers');

function createSharedKey(privateKeyB64, publicKeyB64) {
    try {
        // Convert base64 keys to DER format
        const privateKey = crypto.createPrivateKey({
            key: Buffer.from(privateKeyB64, 'base64'),
            format: 'der',
            type: 'pkcs8'
        });

        const publicKey = crypto.createPublicKey({
            key: Buffer.from(publicKeyB64, 'base64'),
            format: 'der',
            type: 'spki'
        });

        // Compute the shared secret
        const sharedSecret = crypto.diffieHellman({
            privateKey: privateKey,
            publicKey: publicKey
        });

        // Use only first 32 bytes for AES-256
        return sharedSecret.slice(0, 32);
    } catch (error) {
        console.error('Shared key creation error:', error);
        throw error;
    }
}

function decryptAES256ECB(key, encryptedB64) {
    try {
        // Convert base64 to buffer
        const encrypted = Buffer.from(encryptedB64, 'base64');
        
        // Log key and encrypted data for debugging
        console.log('Key length:', key.length);
        console.log('Encrypted data length:', encrypted.length);
        
        // Create decipher with null IV (ECB mode)
        const decipher = crypto.createDecipheriv('aes-256-ecb', key, null);
        
        // Disable auto padding
        decipher.setAutoPadding(false);
        
        // Decrypt
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        // Remove PKCS7 padding manually
        const padLength = decrypted[decrypted.length - 1];
        const unpadded = decrypted.slice(0, decrypted.length - padLength);
        
        return unpadded.toString('utf8');
    } catch (error) {
        console.error('Decryption error details:', {
            keyLength: key ? key.length : 'no key',
            encryptedLength: encryptedB64 ? Buffer.from(encryptedB64, 'base64').length : 'no data'
        });
        throw error;
    }
}

async function signMessage(signingString, privateKeyB64) {
    await _sodium.ready;
    const sodium = _sodium;
    
    try {
        const signedMessage = sodium.crypto_sign_detached(
            signingString,
            sodium.from_base64(privateKeyB64, sodium.base64_variants.ORIGINAL)
        );
        
        return sodium.to_base64(signedMessage, sodium.base64_variants.ORIGINAL);
    } catch (error) {
        console.error('Signing error:', error);
        throw error;
    }
}

module.exports = {
    createSharedKey,
    decryptAES256ECB,
    signMessage
};