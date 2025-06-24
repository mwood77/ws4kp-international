const SIGNING_SALT = 'thisisasupersecretsaltthatissuperdupersecret';

async function simpleHash(message) {
	const encoder = new TextEncoder();
	const data = encoder.encode(SIGNING_SALT + message);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	return hashHex.slice(0, 16);
}

// This is not secure as the client knows the "secret."
// This is just a lightweight consistency check between client and proxy.
async function createToken() {
	const uuid = crypto.randomUUID();
	const signature = await simpleHash(uuid);
	return `${uuid}.${signature}`;
}

export default createToken;
