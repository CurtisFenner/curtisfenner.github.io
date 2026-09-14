import { mat3, vec3 } from "gl-matrix";
import { lmsResponse } from "./lmsTable.ts";

/**
 * Derive the color-matching-functions from LMS (rather than reporting the
 * raw experimental CMFs)
 */
export function ColorMatchingFromLMS(p: {}) {
	const primaries = {
		redNm: 700,
		greenNm: 546.1,
		blueNm: 435.8,
	};
	const redPrimary = lmsResponse({ wavelengthNm: primaries.redNm });
	const greenPrimary = lmsResponse({ wavelengthNm: primaries.greenNm });
	const bluePrimary = lmsResponse({ wavelengthNm: primaries.blueNm });

	const rgbPrimariesToLms = mat3.fromValues(
		redPrimary.energyL,
		redPrimary.energyM,
		redPrimary.energyS,
		greenPrimary.energyL,
		greenPrimary.energyM,
		greenPrimary.energyS,
		bluePrimary.energyL,
		bluePrimary.energyM,
		bluePrimary.energyS,
	);

	const lmsToRgbPrimaries = mat3.invert(mat3.create(), rgbPrimariesToLms)!;

	const LOW_NM = 380;
	const HIGH_NM = 700;
	const STEP = 4;

	const plot = [];
	let rSum = 0;
	let gSum = 0;
	let bSum = 0;
	for (let wavelengthNm = LOW_NM; wavelengthNm <= HIGH_NM; wavelengthNm += STEP) {
		const toMatch = lmsResponse({ wavelengthNm });
		// Which linear mix of redPrimary/greenPrimary/bluePrimary will equal
		// toMatch?
		const lms3 = vec3.fromValues(
			toMatch.energyL,
			toMatch.energyM,
			toMatch.energyS,
		);
		const [r, g, b] = vec3.transformMat3(vec3.create(), lms3, lmsToRgbPrimaries);
		plot.push({ wavelengthNm, r, g, b });
		rSum += r;
		gSum += g;
		bSum += b;
	}
	// Scale to have consistent area
	let min = 0;
	let max = 0;
	for (const coordinate of plot) {
		coordinate.r /= rSum;
		coordinate.g /= gSum;
		coordinate.b /= bSum;

		min = Math.min(min, coordinate.r, coordinate.g, coordinate.b);
		max = Math.max(max, coordinate.r, coordinate.g, coordinate.b);
	}

	const svgViewBox = { width: 200, height: 100 };
	const svgY = (v: number) => {
		const t = (v - min) / (max - min);
		return (svgViewBox.height * (0.9 - 0.8 * t)).toFixed(2);
	};
	const MIN_NM = 360;
	const MAX_NM = 830;
	const svgX = (l: number) => {
		const t = (l - MIN_NM) / (MAX_NM - MIN_NM);
		return (svgViewBox.width * (0.1 + 0.8 * t)).toFixed(2);
	};

	const redPath = plot.map((c, i) => {
		return `${i === 0 ? "M" : "L"} ${svgX(c.wavelengthNm)} ${svgY(c.r)}`;
	}).join(" ");
	const greenPath = plot.map((c, i) => {
		return `${i === 0 ? "M" : "L"} ${svgX(c.wavelengthNm)} ${svgY(c.g)}`;
	}).join(" ");
	const bluePath = plot.map((c, i) => {
		return `${i === 0 ? "M" : "L"} ${svgX(c.wavelengthNm)} ${svgY(c.b)}`;
	}).join(" ");

	return <svg viewBox={`0 0 ${svgViewBox.width} ${svgViewBox.height}`} xmlns="http://www.w3.org/2000/svg">
		<path d={redPath} stroke="red" fill="none" strokeWidth={1} />
		<path d={greenPath} stroke="lime" fill="none" strokeWidth={1} />
		<path d={bluePath} stroke="blue" fill="none" strokeWidth={1} />

		<path d={[
			`M 0 ${svgY(0)} L ${svgViewBox.width} ${svgY(0)}`,
		].join("\n")} strokeWidth={0.5} stroke="black" fill="none" />
	</svg>;
}
