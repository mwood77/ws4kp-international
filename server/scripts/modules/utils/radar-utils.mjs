/* eslint-disable no-restricted-syntax */
/* eslint-disable no-plusplus */
/* eslint-disable no-underscore-dangle */

export default class RadarUtils {
	static earthRadius = 6378137;

	static getMaxOverlapWithMarkers(newLatLng, iconSize = [140, 120], threshold = 0) {
		if (!window._leafletMap) return 0;

		const newPoint = window._leafletMap.latLngToLayerPoint(newLatLng);
		const [newWidth, newHeight] = iconSize;

		const newRect = {
			left: newPoint.x - newWidth / 2,
			right: newPoint.x + newWidth / 2,
			top: newPoint.y - newHeight / 2,
			bottom: newPoint.y + newHeight / 2,
		};

		let maxOverlapArea = 0;

		const layers = Object.values(window._leafletMap._layers);
		layers.forEach((layer) => {
			if (!(layer instanceof window.L.Marker)) return;

			const existingLatLng = layer.getLatLng();
			if (!existingLatLng) return;

			const existingPoint = window._leafletMap.latLngToLayerPoint(existingLatLng);
			const [existingWidth, existingHeight] = iconSize;

			const existingRect = {
				left: existingPoint.x - existingWidth / 2 - threshold,
				right: existingPoint.x + existingWidth / 2 + threshold,
				top: existingPoint.y - existingHeight / 2 - threshold,
				bottom: existingPoint.y + existingHeight / 2 + threshold,
			};

			// Calculate intersection rectangle
			const intersectLeft = Math.max(newRect.left, existingRect.left);
			const intersectRight = Math.min(newRect.right, existingRect.right);
			const intersectTop = Math.max(newRect.top, existingRect.top);
			const intersectBottom = Math.min(newRect.bottom, existingRect.bottom);

			const intersectWidth = intersectRight - intersectLeft;
			const intersectHeight = intersectBottom - intersectTop;

			if (intersectWidth > 0 && intersectHeight > 0) {
				const overlapArea = intersectWidth * intersectHeight;
				maxOverlapArea = Math.max(maxOverlapArea, overlapArea);
			}
		});

		const newArea = newWidth * newHeight;
		return maxOverlapArea / newArea;
	}

	static offsetLatLng(latlng, dxMeters, dyMeters) {
		const earthRadius = 6378137; // in meters
		const dLat = dyMeters / earthRadius;
		const dLng = dxMeters / (earthRadius * Math.cos(Math.PI * latlng.lat / 180));

		return window.L.latLng(
			latlng.lat + dLat * (180 / Math.PI),
			latlng.lng + dLng * (180 / Math.PI),
		);
	}

	static jitterAwayFromOverlaps(originalLatLng, iconSize = [140, 120], threshold = 0, maxTries = 20, moveMeters = 2) {
		let latLng = originalLatLng;
		let tries = 0;

		while (tries < maxTries) {
			const overlapData = RadarUtils.getOverlappingMarkers(latLng, iconSize, threshold);

			if (overlapData.length === 0) break; // No overlaps, done

			// Compute average displacement vector (dx, dy in meters)
			let avgDx = 0;
			let avgDy = 0;

			for (const otherLatLng of overlapData) {
				// Vector from other marker to current marker in meters
				const dx = RadarUtils.lngDistanceMeters(latLng.lng, otherLatLng.lng, latLng.lat);
				const dy = RadarUtils.latDistanceMeters(latLng.lat, otherLatLng.lat);

				// Normalize vector length
				const length = Math.sqrt(dx * dx + dy * dy) || 1;

				// Push away from other marker
				avgDx += dx / length;
				avgDy += dy / length;
			}

			// Average direction
			avgDx /= overlapData.length;
			avgDy /= overlapData.length;

			// Scale displacement by moveMeters
			const length = Math.sqrt(avgDx * avgDx + avgDy * avgDy) || 1;
			const moveDx = (avgDx / length) * moveMeters;
			const moveDy = (avgDy / length) * moveMeters;

			// Apply displacement to latLng
			latLng = RadarUtils.offsetLatLng(latLng, moveDx, moveDy);

			tries++;
		}

		return latLng;
	}

	// Helper: find overlapping markers (return array of LatLng of markers overlapping with given position)
	static getOverlappingMarkers(newLatLng, iconSize = [140, 120], threshold = 0) {
		if (!window._leafletMap) return [];

		const newPoint = window._leafletMap.latLngToLayerPoint(newLatLng);
		const [newWidth, newHeight] = iconSize;

		const newRect = {
			left: newPoint.x - newWidth / 2,
			right: newPoint.x + newWidth / 2,
			top: newPoint.y - newHeight / 2,
			bottom: newPoint.y + newHeight / 2,
		};

		const overlappingMarkers = [];

		const layers = Object.values(window._leafletMap._layers);
		layers.forEach((layer) => {
			if (!(layer instanceof window.L.Marker)) return;

			const existingLatLng = layer.getLatLng();
			if (!existingLatLng) return;

			const existingPoint = window._leafletMap.latLngToLayerPoint(existingLatLng);
			const [existingWidth, existingHeight] = iconSize;

			const existingRect = {
				left: existingPoint.x - existingWidth / 2 - threshold,
				right: existingPoint.x + existingWidth / 2 + threshold,
				top: existingPoint.y - existingHeight / 2 - threshold,
				bottom: existingPoint.y + existingHeight / 2 + threshold,
			};

			// Calculate intersection rectangle
			const intersectLeft = Math.max(newRect.left, existingRect.left);
			const intersectRight = Math.min(newRect.right, existingRect.right);
			const intersectTop = Math.max(newRect.top, existingRect.top);
			const intersectBottom = Math.min(newRect.bottom, existingRect.bottom);

			const intersectWidth = intersectRight - intersectLeft;
			const intersectHeight = intersectBottom - intersectTop;

			if (intersectWidth > 0 && intersectHeight > 0) {
				overlappingMarkers.push(existingLatLng);
			}
		});

		return overlappingMarkers;
	}

	// Helpers to convert lat/lng distances to meters approx
	static latDistanceMeters(lat1, lat2) {
		return (lat1 - lat2) * (Math.PI / 180) * RadarUtils.earthRadius;
	}

	static lngDistanceMeters(lng1, lng2, lat) {
		return (lng1 - lng2) * (Math.PI / 180) * RadarUtils.earthRadius * Math.cos(lat * Math.PI / 180);
	}
}
