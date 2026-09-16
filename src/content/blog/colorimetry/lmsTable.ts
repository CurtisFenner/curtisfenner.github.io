import d65Tsv from "../../../../public/blog/colorimetry/CIE_std_illum_D65.tsv?raw";
import lmsTsv from "../../../../public/blog/colorimetry/lms-response.tsv?raw";
import xyz10Csv from "../../../../public/blog/colorimetry/ciexyz64.tsv?raw";

const lmsCells = lmsTsv.split("\n")
	.filter(line => line.trim() !== "")
	.map(line => line.split("\t"));

export const lmsTable = lmsCells.slice(1)
	.map(([wavelengthNm, energyL, energyM, energyS]) => {
		return Object.freeze({
			wavelengthNm: parseFloat(wavelengthNm),
			energyL: parseFloat(energyL || "0"),
			energyM: parseFloat(energyM || "0"),
			energyS: parseFloat(energyS || "0"),
		});
	});

const d65Cells = d65Tsv.split("\n")
	.filter(line => line.trim() !== "")
	.map(line => line.split("\t"));

export const d65Table = d65Cells.slice(1)
	.map(([wavelengthNm, energy]) => {
		return Object.freeze({
			wavelengthNm: parseFloat(wavelengthNm),
			energy: parseFloat(energy),
		});
	});

const xyz10Cells = xyz10Csv.split("\n")
	.filter(line => line.trim() !== "")
	.map(line => line.split("\t"));

export const xyz10Table = xyz10Cells.slice(1)
	.map(([wavelengthNm, x10, y10, z10]) => {
		return Object.freeze({
			wavelengthNm: parseFloat(wavelengthNm),
			x: parseFloat(x10),
			y: parseFloat(y10),
			z: parseFloat(z10),
		});
	});

export function fromChromaticity(p: { x: number, y: number, Y?: number }) {
	const Y = p.y ?? 1;
	return Object.freeze({
		x: p.x,
		y: p.y,
		X: p.x * Y / p.y,
		Y,
		Z: (1 - p.x - p.y) * Y / p.y,
	});
}

/**
 * A linear interpolation of the `lmsTable` data.
 */
export function lmsResponse(p: { wavelengthNm: number }) {
	// TODO: Optimize using binary search
	for (let i = 0; i + 1 < lmsTable.length; i++) {
		const a = lmsTable[i];
		const b = lmsTable[i + 1];
		const t = (p.wavelengthNm - a.wavelengthNm) / (b.wavelengthNm - a.wavelengthNm);
		if (0 <= t && t <= 1) {
			return {
				energyL: t * b.energyL + (1 - t) * a.energyL,
				energyM: t * b.energyM + (1 - t) * a.energyM,
				energyS: t * b.energyS + (1 - t) * a.energyS,
			}
		}
	}

	// TODO: Make ends continuous instead of jumping to 0
	return {
		energyL: 0,
		energyM: 0,
		energyS: 0,
	};
}

export function d65Energy(p: { wavelengthNm: number }) {
	// TODO: Optimize using binary search
	for (let i = 0; i + 1 < d65Table.length; i++) {
		const a = d65Table[i];
		const b = d65Table[i + 1];
		const t = (p.wavelengthNm - a.wavelengthNm) / (b.wavelengthNm - a.wavelengthNm);
		if (0 <= t && t <= 1) {
			return {
				energy: t * b.energy + (1 - t) * a.energy,
			}
		}
	}

	// TODO: Make ends continuous instead of jumping to 0
	return {
		energy: 0,
	};
}

export function integrateLmsResponse(
	f: (p: { wavelengthNm: number }) => { energy: number },
	options: { lowNm?: number, highNm?: number, stepNm?: number } = {},
) {
	const lowNm = options.lowNm ?? 300;
	const highNm = options.highNm ?? 830;
	const stepNm = options.stepNm ?? 5;

	let energyL = 0;
	let energyM = 0;
	let energyS = 0;
	for (let wavelengthNm = lowNm; wavelengthNm < highNm; wavelengthNm += stepNm) {
		const { energy } = f({ wavelengthNm });
		const lms = lmsResponse({ wavelengthNm });
		energyL += energy * lms.energyL;
		energyM += energy * lms.energyM;
		energyS += energy * lms.energyS;
	}
	return {
		energyL,
		energyM,
		energyS,
	};
}

const d65Integral = integrateLmsResponse(d65Energy);
const d65IntegralMax = d65Integral.energyL + d65Integral.energyM + d65Integral.energyS;

/**
 * (l = 0.417, m = 0.373, s = 0.209)
 *
 * This differs slightly from other published numbers, which are usually derived
 * from XYZ rather than directly from LMS responses...
 */
export const D65_WHITEPOINT = Object.freeze({
	energyL: d65Integral.energyL / d65IntegralMax,
	energyM: d65Integral.energyM / d65IntegralMax,
	energyS: d65Integral.energyS / d65IntegralMax,
});
