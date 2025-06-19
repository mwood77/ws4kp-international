export default class ExperimentalFeatures {
	static getExperimentalFlag() {
		const experimentalFeatures = document.documentElement.getAttribute('experimental-features');

		if (experimentalFeatures === 'true') return true;
		return false;
	}
}
