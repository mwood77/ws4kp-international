const SIGNING_SALT = 'thisisasupersecretsaltthatissuperdupersecret';

async function simpleHash(message) {
	if (SIGNING_SALT == null || SIGNING_SALT === '') console.warn('secret not set');
	const msgUint8 = new TextEncoder().encode(SIGNING_SALT + message);
	const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
	return Array.from(new Uint8Array(hashBuffer))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
		.slice(0, 16);
}

async function createToken() {
	const uuid = crypto.randomUUID();
	const signature = await simpleHash(uuid);
	return `${uuid}.${signature}`;
}

export default createToken;
