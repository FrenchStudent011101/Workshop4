import {webcrypto} from "crypto";

// #############
// ### Utils ###
// #############

// Function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    return Buffer.from(buffer).toString("base64");
}

// Function to convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    var buff = Buffer.from(base64, "base64");
    return buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength);
}

// ################
// ### RSA keys ###
// ################

// Generates a pair of private / public RSA keys
type GenerateRsaKeyPair = {
    publicKey: webcrypto.CryptoKey;
    privateKey: webcrypto.CryptoKey;
};
export async function generateRsaKeyPair(): Promise<GenerateRsaKeyPair> {
    // TODO implement this function using the crypto package to generate a public and private RSA key pair.
    //      the public key should be used for encryption and the private key for decryption. Make sure the
    //      keys are extractable.

    return await webcrypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: {name: "SHA-256"},
        },
        true,
        ["encrypt", "decrypt"]
    );
}
export async function exportPubKey(key: webcrypto.CryptoKey): Promise<string> {
    const exportedKey = await webcrypto.subtle.exportKey("spki", key);
    return arrayBufferToBase64(exportedKey);
}
export async function exportPrvKey(
    key: webcrypto.CryptoKey | null
): Promise<string | null> {

    if (!key) {
        return null;
    }
    const exportedKey = await webcrypto.subtle.exportKey("pkcs8", key);
    return arrayBufferToBase64(exportedKey);
}
export async function importPubKey(
    strKey: string
): Promise<webcrypto.CryptoKey> {
    const keyBuffer = base64ToArrayBuffer(strKey);
    return await webcrypto.subtle.importKey(
        "spki",
        keyBuffer,
        {
            name: "RSA-OAEP",
            hash: {name: "SHA-256"},
        },
        true,
        ["encrypt"]
    );
}

// Import a base64 string private key to its native format
export async function importPrvKey(
    strKey: string
): Promise<webcrypto.CryptoKey> {
    const keyBuffer = base64ToArrayBuffer(strKey);
    return await webcrypto.subtle.importKey(
        "pkcs8",
        keyBuffer,
        {
            name: "RSA-OAEP",
            hash: {name: "SHA-256"},
        },
        true,
        ["decrypt"]
    );
}
export async function rsaEncrypt(
    b64Data: string,
    strPublicKey: string
): Promise<string> {
    const data = base64ToArrayBuffer(b64Data);
    const publicKey = await importPubKey(strPublicKey);
    const encryptedData = await webcrypto.subtle.encrypt(
        {
            name: "RSA-OAEP",
        },
        publicKey,
        data
    );
    return arrayBufferToBase64(encryptedData);
}
export async function rsaDecrypt(
    data: string,
    privateKey: webcrypto.CryptoKey
): Promise<string> {
    const encryptedData = base64ToArrayBuffer(data);
    const decryptedData = await webcrypto.subtle.decrypt(
        {
            name: "RSA-OAEP",
        },
        privateKey,
        encryptedData
    );
    return arrayBufferToBase64(decryptedData);
}


// ######################
// ### Symmetric keys ###
// ######################

export async function createRandomSymmetricKey(): Promise<webcrypto.CryptoKey> {
    // Generate a random 256-bit AES key with extractable: true
    return await webcrypto.subtle.generateKey(
        {
            name: 'AES-CBC', // Choose a suitable algorithm (e.g., AES-GCM for authenticated encryption)
            length: 256,
        },
        true, // Enable extractability
        ['encrypt', 'decrypt'] // Specify intended key usages
    );

}

// Export a crypto symmetric key to a base64 string format
export async function exportSymKey(key: webcrypto.CryptoKey): Promise<string> {
    const exportedKey = await webcrypto.subtle.exportKey("raw", key);
    return arrayBufferToBase64(exportedKey);
}

// Import a base64 string format to its crypto native format
export async function importSymKey(
    strKey: string
): Promise<webcrypto.CryptoKey> {
    const keyBuffer = base64ToArrayBuffer(strKey);
    return await webcrypto.subtle.importKey(
        "raw",
        keyBuffer,
        {
            name: "AES-CBC",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

// Encrypt a message using a symmetric key
export async function symEncrypt(
    key: webcrypto.CryptoKey,
    data: string
): Promise<string> {
    const dataUint8Array = new TextEncoder().encode(data);

    const iv = crypto.getRandomValues(new Uint8Array(16));

    const encryptedData = await webcrypto.subtle.encrypt(
        {
            name: "AES-CBC",
            iv: iv,
        },
        key,
        dataUint8Array
    );

    const concatenatedData = new Uint8Array([...iv, ...new Uint8Array(encryptedData)]);
    return arrayBufferToBase64(concatenatedData.buffer);
}

export async function symDecrypt(
    strKey: string,
    encryptedData: string
): Promise<string> {
    const key = await importSymKey(strKey);

    const encryptedDataBuffer = base64ToArrayBuffer(encryptedData);

    const iv = encryptedDataBuffer.slice(0, 16);

    const decryptedDataBuffer = await webcrypto.subtle.decrypt(
        {
            name: "AES-CBC",
            iv: iv,
        },
        key,
        encryptedDataBuffer.slice(16)
    );
    return new TextDecoder().decode(decryptedDataBuffer);
}