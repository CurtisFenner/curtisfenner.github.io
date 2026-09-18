import { useState } from "react";
import { cieXYZ64Response, srgbLinearToMapped } from "./lmsTable.ts";
import { cieXYZTosRGB } from "./srgb.ts";

export function Spectrum(p: {}) {
	const LOW_NM = 380;
	const HIGH_NM = 700;
	const STEP = 1;

	const bars = [];
	for (let wavelengthNm = LOW_NM; wavelengthNm < HIGH_NM; wavelengthNm += STEP) {
		bars.push({
			wavelengthNm,
			sRGB: cieXYZTosRGB(cieXYZ64Response({ wavelengthNm })),
		});
	}

	const values = [
		...bars.map(c => c.sRGB.linearR),
		...bars.map(c => c.sRGB.linearG),
		...bars.map(c => c.sRGB.linearB),
	];
	const whiteNeeded = -Math.min(0, ...values);
	const max = Math.max(...values);

	const barToCssColor = (bar: { linearR: number, linearG: number, linearB: number }) => {
		const r = 100 * srgbLinearToMapped((whiteNeeded + bar.linearR) / (max + whiteNeeded));
		const g = 100 * srgbLinearToMapped((whiteNeeded + bar.linearG) / (max + whiteNeeded));
		const b = 100 * srgbLinearToMapped((whiteNeeded + bar.linearB) / (max + whiteNeeded));

		return `rgb(${r.toFixed(1)}% ${g.toFixed(1)}% ${b.toFixed(1)}%)`;
	};

	const cssColors = bars.map(bar => {
		return {
			wavelengthNm: bar.wavelengthNm,
			cssColor: barToCssColor(bar.sRGB),
		};
	});
	const blackCssColor = barToCssColor({ linearR: 0, linearG: 0, linearB: 0 });

	const svgViewBox = { width: 640, height: 100 };
	const [gradientId] = useState(`spectrum-${crypto.randomUUID()}`);
	return <svg
		viewBox={`0 0 ${svgViewBox.width} ${svgViewBox.height}`}
		xmlns="http://www.w3.org/2000/svg"
		style={{ background: blackCssColor, border: "1px solid black", display: "block" }}>
		<defs>
			<linearGradient id={gradientId}>
				<stop offset="0%" stopColor={blackCssColor} />
				{
					cssColors.map(x => {
						const offset = (x.wavelengthNm - LOW_NM) / (HIGH_NM - LOW_NM);
						return <stop
							key={x.wavelengthNm}
							offset={`${(100 * offset).toFixed(2)}%`}
							stopColor={x.cssColor}
						/>;
					})
				}
				<stop offset="100%" stopColor={blackCssColor} />
			</linearGradient>
		</defs>
		<rect width={svgViewBox.width} height={svgViewBox.height} fill={`url(#${gradientId})`} />
	</svg>;
}
