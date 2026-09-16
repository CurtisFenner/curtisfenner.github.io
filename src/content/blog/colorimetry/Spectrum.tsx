import { mat3, vec3 } from "gl-matrix";
import { cieXYZ64Response, D65_WHITEPOINT, lmsResponse, rec709Primaries, srgbLinearToMapped } from "./lmsTable.ts";


export function Spectrum(p: {}) {
	const LOW_NM = 380;
	const HIGH_NM = 700;
	const STEP = 4;

	const sRGBColorPrimary = mat3.fromValues(
		rec709Primaries.red.X,
		rec709Primaries.red.Y,
		rec709Primaries.red.Z,
		rec709Primaries.green.X,
		rec709Primaries.green.Y,
		rec709Primaries.green.Z,
		rec709Primaries.blue.X,
		rec709Primaries.blue.Y,
		rec709Primaries.blue.Z,
	);

	const cieXYZTosRGB = mat3.invert(mat3.create(), sRGBColorPrimary)!;

	const bars = [];
	for (let wavelengthNm = LOW_NM; wavelengthNm < HIGH_NM; wavelengthNm += STEP) {
		const nm = wavelengthNm + STEP / 2;
		const { X, Y, Z } = cieXYZ64Response({ wavelengthNm });
		const [linearR, linearG, linearB] = vec3.transformMat3(
			vec3.create(),
			vec3.fromValues(X, Y, Z),
			cieXYZTosRGB
		);

		bars.push({
			nm,
			leftLabel: wavelengthNm,
			rightLabel: wavelengthNm + STEP,
			linearR,
			linearG,
			linearB,
		});
	}

	const values = [
		...bars.map(c => c.linearR),
		...bars.map(c => c.linearG),
		...bars.map(c => c.linearB),
	];
	const whiteNeeded = -Math.min(0, ...values);
	const max = Math.max(...values);

	const RANGE_NM = HIGH_NM - LOW_NM;
	return <div style={{
		position: "relative",
		height: "6em",
		background: "black",
		border: "1px solid black",
	}}>
		{bars.flatMap(bar => {
			const out = [];
			{
				// Add gray to avoid negative values.
				const r = 100 * srgbLinearToMapped((whiteNeeded + bar.linearR) / (max + whiteNeeded));
				const g = 100 * srgbLinearToMapped((whiteNeeded + bar.linearG) / (max + whiteNeeded));
				const b = 100 * srgbLinearToMapped((whiteNeeded + bar.linearB) / (max + whiteNeeded));

				const color = `rgb(${r.toFixed(1)}% ${g.toFixed(1)}% ${b.toFixed(1)}%)`;
				const onGray = <div key={bar.leftLabel} style={{
					position: "absolute",
					background: color,
					left: (100 * (bar.leftLabel - LOW_NM) / RANGE_NM).toFixed(2) + "%",
					right: (100 - 100 * (bar.rightLabel - LOW_NM) / RANGE_NM).toFixed(2) + "%",
					height: "100%",
				}}
					title={`${bar.nm.toFixed(0)} nm`}>
				</div>;
				out.push(onGray);
			}

			return out;
		})}
	</div>;
}
