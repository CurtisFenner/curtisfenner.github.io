import { chooseWeighted, DIAMOND_SIZE_VH, yProbs } from "./sun-bg";

const tiles: { x: number, y: number, color: string }[] = [];
const rows = 89;
const columns = 23;

export const pageWidthVh = columns * DIAMOND_SIZE_VH;
export const pageHeightVh = rows * DIAMOND_SIZE_VH / 2;

for (let row = 0; row < rows; row++) {
	for (let column = 0; column < columns; column++) {
		const y = row * DIAMOND_SIZE_VH / 2;
		const x = (column + (row % 2) / 2) * DIAMOND_SIZE_VH;

		const color = chooseWeighted(yProbs(y));
		tiles.push({
			x,
			y,
			color,
		});
		if (x === 0) {
			tiles.push({
				x: x + columns * DIAMOND_SIZE_VH,
				y,
				color,
			});
		}
	}
}


export function GET(context: any): Response {

	function p(x: number, y: number): string {
		return `${x.toFixed(2)} ${y.toFixed(2)}`;
	}

	const paths = [];
	for (const { x, y, color } of tiles) {
		const r = DIAMOND_SIZE_VH / 2;
		paths.push(`
			<path
				d="M ${p(x - r, y)} L ${p(x, y - r)} L ${p(x + r, y)} L ${p(x, y + r)} Z"
				fill="${color}" stroke="${color}" />
		`);
	}

	const svg = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
	width="${pageWidthVh.toFixed(1)}vh"
	height="${pageHeightVh.toFixed(1)}vh"
	viewBox="0 0 ${pageWidthVh.toFixed(1)} ${pageHeightVh.toFixed(1)}"
	style="height: ${pageHeightVh.toFixed(1)}vh;">
<g>
	${paths.join("\n")}
</g>
</svg>
`;
	return new Response(svg, {
		status: 200,
		headers: {
			"Content-Type": "image/svg+xml",
		},
	});
}
