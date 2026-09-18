import { useCallback, useState } from "react";
import { cieXYZ64Response, rec709Primaries, srgbLinearToMapped } from "./lmsTable.ts";
import { cieXYZTosRGB } from "./srgb.ts";

export type LampSliderProps = {
	name: string,
	color: string,
	onChange: (x: number) => void,
	value: number,
	min?: number,
	max?: number,
};

export function LampSlider(p: LampSliderProps) {
	const [datalistId] = useState(crypto.randomUUID());
	return <>
		<tr>
			<th>
				<label htmlFor={`${datalistId}-input`}>
					<span>{p.name}:</span>
				</label>
			</th>
			<td>
				<input
					id={`${datalistId}-input`}
					list={datalistId}

					type="range" min={p.max ?? -1} max={p.max ?? 1} step={0.1}
					value={p.value}
					onInput={e => {
						const value = parseFloat(e.currentTarget.value);
						p.onChange(value);
					}}
				/>
				<datalist id={datalistId}>
					<option value={0} label="0%" />
				</datalist>
			</td>
			<td>
				<label style={{ display: "inline-block", textAlign: "right", width: "3em" }} htmlFor={`${datalistId}-input`}>
					<span>{(p.value * 100).toFixed(0)}%</span>
				</label>
			</td>
		</tr>
	</>;
}


export interface LampBoxProps {
	color: LinearSRGB,
}

const barToCssColor = (bar: LinearSRGB) => {
	const r = 100 * srgbLinearToMapped(bar.linearR);
	const g = 100 * srgbLinearToMapped(bar.linearG);
	const b = 100 * srgbLinearToMapped(bar.linearB);

	return `rgb(${r.toFixed(1)}% ${g.toFixed(1)}% ${b.toFixed(1)}%)`;
};

export function LampBox(p: LampBoxProps) {
	return <div style={{
		border: "1px solid white",
		background: barToCssColor(p.color),
		display: "block",
		width: "6em",
		height: "6em",
	}}>
	</div>;
}

export interface LinearSRGB {
	linearR: number,
	linearG: number,
	linearB: number,
}

function linearMix(...colors: [x: number, c: LinearSRGB][]): LinearSRGB {
	let linearR = 0;
	let linearG = 0;
	let linearB = 0;
	for (const [x, c] of colors) {
		linearR += x * c.linearR;
		linearG += x * c.linearG;
		linearB += x * c.linearB;
	}
	return { linearR, linearG, linearB };
}

interface ExperimentResultsGraphProps {
	data: {
		wavelengthNm: number,
		red: number,
		green: number,
		blue: number,
	}[],
}

export function ExperimentResultsGraph(p: ExperimentResultsGraphProps) {
	// Scale to have consistent area
	let valueMin = -1.1;
	let valueMax = 1.1;

	const svgViewBox = { width: 400, height: 200 };
	const svgY = (v: number) => {
		const t = (v - valueMin) / (valueMax - valueMin);
		return (svgViewBox.height * (0.9 - 0.8 * t)).toFixed(2);
	};

	const MIN_NM = 360;
	const MAX_NM = 720;
	const svgX = (l: number) => {
		const t = (l - MIN_NM) / (MAX_NM - MIN_NM);
		return (svgViewBox.width * (0.1 + 0.8 * t)).toFixed(2);
	};

	const radius = 3;

	return <svg viewBox={`0 0 ${svgViewBox.width} ${svgViewBox.height}`} xmlns="http://www.w3.org/2000/svg">
		{
			p.data.map((c, i) => {
				const cx = svgX(c.wavelengthNm);
				return <>
					<ellipse key={`r${i}`} cx={cx} cy={svgY(c.red)} rx={radius} ry={radius} fill="red" stroke="none" />
					<ellipse key={`g${i}`} cx={cx} cy={svgY(c.green)} rx={radius} ry={radius} fill="lime" stroke="none" />
					<ellipse key={`b${i}`} cx={cx} cy={svgY(c.blue)} rx={radius} ry={radius} fill="blue" stroke="none" />
				</>;
			})
		}

		<path d={[
			`M 0 ${svgY(0)} L ${svgViewBox.width} ${svgY(0)}`,
		].join("\n")} strokeWidth={0.5} stroke="black" fill="none" />
	</svg>;
}

interface ColorMatchingExperimentProps {
	record: (point: {
		wavelengthNm: number,
		red: number,
		green: number,
		blue: number,
	}) => void,
}

export function ColorMatchingExperiment(p: ColorMatchingExperimentProps) {
	const MIN_NM = 380;
	const MAX_NM = 700;

	const [targetWavelength, setTargetWavelength] = useState(Math.random() * (MAX_NM - MIN_NM) + MIN_NM);
	const [redSlider, setRedSlider] = useState(0);
	const [greenSlider, setGreenSlider] = useState(0);
	const [blueSlider, setBlueSlider] = useState(0);

	const submit = () => {
		p.record({
			wavelengthNm: targetWavelength,
			red: redSlider,
			green: greenSlider,
			blue: blueSlider,
		});
		setRedSlider(0);
		setGreenSlider(0);
		setBlueSlider(0);
		setTargetWavelength(Math.random() * (MAX_NM - MIN_NM) + MIN_NM);
	};

	// The amount of linearR/linearG/linearB to add.
	const grayLevel = 0.3;
	const gray = { linearR: grayLevel, linearG: grayLevel, linearB: grayLevel };

	const strengths = {
		target: 0.3,
		blue: 0.6,
		green: 0.5,
		red: 0.7,
	};

	const redPrimary = cieXYZTosRGB(rec709Primaries.red);
	const greenPrimary = cieXYZTosRGB(rec709Primaries.green);
	const bluePrimary = cieXYZTosRGB(rec709Primaries.blue);
	const targetPrimary = cieXYZTosRGB(cieXYZ64Response({ wavelengthNm: targetWavelength }));

	const left = linearMix(
		[1, gray],
		[strengths.target, targetPrimary],
		[strengths.red * Math.max(0, -redSlider), redPrimary],
		[strengths.green * Math.max(0, -greenSlider), greenPrimary],
		[strengths.blue * Math.max(0, -blueSlider), bluePrimary],
	);

	const right = linearMix(
		[1, gray],
		[strengths.red * Math.max(0, redSlider), redPrimary],
		[strengths.green * Math.max(0, greenSlider), greenPrimary],
		[strengths.blue * Math.max(0, blueSlider), bluePrimary],
	);

	return <>
		<table>
			<tbody>
				<tr>
					<td>
						<LampBox color={left} />
					</td>
					<td>
						<LampBox color={right} />
					</td>
				</tr>
			</tbody>
		</table>
		<table>
			<tbody>
				<LampSlider name="Red (700 nm)" color="red" value={redSlider} onChange={setRedSlider} />
				<LampSlider name="Green (546.1 nm)" color="lime" value={greenSlider} onChange={setGreenSlider} />
				<LampSlider name="Blue (435.8 nm)" color="blue" value={blueSlider} onChange={setBlueSlider} />
				<tr>
					<td colSpan={3}>
						<button onClick={submit} style={{
							width: "100%"
						}}>
							Record match
						</button>
					</td>
				</tr>
			</tbody>
		</table>
	</>;
}

export function ColorMatchingLab() {
	const [results, setResults] = useState<Array<{
		red: number,
		green: number,
		blue: number,
		wavelengthNm: number,
	}>>([]);

	return <>
		<ColorMatchingExperiment record={v => setResults(x => [...x, v])} />
		<ExperimentResultsGraph data={results} />
	</>;
}
