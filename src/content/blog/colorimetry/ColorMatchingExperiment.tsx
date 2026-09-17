import { useState } from "react";

export type LampSliderProps = {
	name: string,
	color: string,
	onChange: (x: number) => void,
	initial: number,
	min?: number,
	max?: number,
};

export function LampSlider(p: LampSliderProps) {
	const [labelValue, setLabelValue] = useState(p.initial);

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
					value={labelValue}
					onInput={e => {
						const value = parseFloat(e.currentTarget.value);
						setLabelValue(value);
						p.onChange(value);
					}}
				/>
				<datalist id={datalistId}>
					<option value={0} label="0%" />
				</datalist>
			</td>
			<td>
				<label style={{ display: "inline-block", textAlign: "right", width: "3em" }} htmlFor={`${datalistId}-input`}>
					<span>{(labelValue * 100).toFixed(0)}%</span>
				</label>
			</td>
		</tr>
	</>;
}

export function ColorMatchingExperiment(p: {}) {
	const [redSlider, setRedSlider] = useState(0);
	const [greenSlider, setGreenSlider] = useState(0);
	const [blueSlider, setBlueSlider] = useState(0);

	return <>
		<table>
			<tbody>
				<LampSlider name="Red (700 nm)" color="red" initial={redSlider} onChange={setRedSlider} />
				<LampSlider name="Green (546.1 nm)" color="lime" initial={greenSlider} onChange={setGreenSlider} />
				<LampSlider name="Blue (435.8 nm)" color="blue" initial={blueSlider} onChange={setBlueSlider} />
			</tbody>
		</table>
	</>;
}
