import { pageHeightVh, pageWidthVh } from "./sun-tile.svg";

export async function GET(context: any) {
	const css = `
.bg {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	overflow: hidden;

	--sun00: #A0A2AA;
	--sun25: #B8BCC8;
	--sun50: #CCD0D6;
	--sun75: #E0DDDA;
	--sun100: #FFF4D6;

	/*
	background: linear-gradient(
		var(--sun00),
		var(--sun25) 25vh,
		var(--sun50) 50vh,
		var(--sun75) 75vh,
		var(--sun100) 100vh
	);*/

	/*
	background: url("/styles/sun-tile.svg")
		top / ${pageWidthVh.toFixed(2)}vh ${pageHeightVh.toFixed(2)}vh repeat-x;
	*/
}
`;

	return new Response(css, {
		status: 200,
		headers: { "Content-Type": "text/css" },
	});
}
