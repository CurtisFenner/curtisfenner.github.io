import { D65_WHITEPOINT, lmsResponse } from "./lmsTable.ts";


export function Spectrum(p: {}) {
	const LOW_NM = 380;
	const HIGH_NM = 700;
	const STEP = 4;

	const bars = [];
	for (let wavelengthNm = LOW_NM; wavelengthNm < HIGH_NM; wavelengthNm += STEP) {
		const nm = wavelengthNm + STEP / 2;
		const lms = lmsResponse({ wavelengthNm: nm });
		const rgb = {
			r: lms.energyL / D65_WHITEPOINT.energyL,
			g: lms.energyM / D65_WHITEPOINT.energyM,
			b: lms.energyS / D65_WHITEPOINT.energyS,
		};
		bars.push({
			nm,
			leftLabel: wavelengthNm,
			rightLabel: wavelengthNm + STEP,
			lms,
			rgb,
		});
	}

	const max = Math.max(
		...bars.map(b => b.rgb.r),
		...bars.map(b => b.rgb.g),
		...bars.map(b => b.rgb.b),
	);

	const RANGE_NM = HIGH_NM - LOW_NM;
	return <div style={{
		position: "relative",
		height: "6em",
		background: "gray",
		border: "1px solid black",
	}}>
		{bars.map(bar => {
			const r = 100 * bar.rgb.r / max;
			const g = 100 * bar.rgb.g / max;
			const b = 100 * bar.rgb.b / max;
			const color = `rgb(${r.toFixed(1)}% ${g.toFixed(1)}% ${b.toFixed(1)}%)`;
			return <div key={bar.leftLabel} style={{
				position: "absolute",
				background: color,
				left: (100 * (bar.leftLabel - LOW_NM) / RANGE_NM).toFixed(2) + "%",
				right: (100 - 100 * (bar.rightLabel - LOW_NM) / RANGE_NM).toFixed(2) + "%",
				height: "100%",
			}}
				title={`${bar.nm.toFixed(0)} nm`}>
			</div>;
		})}
	</div>;
}
