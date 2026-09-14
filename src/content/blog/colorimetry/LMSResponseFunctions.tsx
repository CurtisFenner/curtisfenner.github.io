import { D65_WHITEPOINT, d65Energy, integrateLmsResponse, lmsResponse } from "./lmsTable.ts";

export type Props = {
};

export function LMSResponseFunctions(p: Props) {
	const LOW_NM = 380;
	const HIGH_NM = 700;
	const STEP = 4;

	const bars = [];
	for (let wavelengthNm = LOW_NM; wavelengthNm < HIGH_NM; wavelengthNm += STEP) {
		const lms = lmsResponse({ wavelengthNm: wavelengthNm + STEP / 2 });
		bars.push({
			leftLabel: wavelengthNm,
			rightLabel: wavelengthNm + STEP,
			lms,
		});
	}

	const RANGE_NM = HIGH_NM - LOW_NM;
	return <div style={{
		position: "relative",
		height: "6em",
		background: "black",
		border: "1px solid black",
	}}>
		{bars.map(bar => {
			return <div key={bar.leftLabel} style={{
				position: "absolute",
				left: (100 * (bar.leftLabel - LOW_NM) / RANGE_NM).toFixed(2) + "%",
				right: (100 - 100 * (bar.rightLabel - LOW_NM) / RANGE_NM).toFixed(2) + "%",
				height: "100%",
			}}>
				<div title={(100 * bar.lms.energyS).toFixed(1) + "%"} style={{
					position: "absolute",
					bottom: 0,
					height: (100 * bar.lms.energyS).toFixed(1) + "%",
					background: "blue",
					width: "100%",
					mixBlendMode: "lighten",
				}}></div>
				<div title={(100 * bar.lms.energyM).toFixed(1) + "%"} style={{
					position: "absolute",
					bottom: 0,
					height: (100 * bar.lms.energyM).toFixed(1) + "%",
					background: "lime",
					width: "100%",
					mixBlendMode: "lighten",
				}}></div>

				<div title={(100 * bar.lms.energyL).toFixed(1) + "%"} style={{
					position: "absolute",
					bottom: 0,
					height: (100 * bar.lms.energyL).toFixed(1) + "%",
					background: "red",
					width: "100%",
					mixBlendMode: "lighten",
				}}></div>
			</div>;
		})}
	</div>;
}
