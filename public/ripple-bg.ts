// z(x, y) = f(r(x, y)) = f(sqrt(x * x + y * y))
// d/dx z(x, y) = d/dx f(sqrt(x * x + y * y))
//              = f'(sqrt(x*x + y*y)) * x / sqrt(x * x + y * y)
//              = f'(R) * x / R

function rippleGradient(p: {
	/** Start of gradient (height = 0) */
	r0px: number,
	/** End of ripple radius (height = 0) */
	r1px: number,
}) {
	//             ----
	//  f(r)     -/    \-
	//          /        \
	//     r0 /-   sin    -\ r1
	// <----*-              -*---->
	//
	// f(r) = -cos(2 * pi * (r - r0) / (r1 - r0))
	//      = -cos([2 * pi / (r1 - r0)] * (r - r0))
	//      in [-1, 1]
	// (and 0 outside [r0, r1])
	//
	// f'(r) = d/dr -cos([2 * pi / (r1 - r0)] * (r - r0))
	//       = [2 * pi / (r1 - r0)] * sin([2 * pi / (r1 - r0)] * (r - r0))
	//       in [-2 * pi / (r1 - r0), 2 * pi / (r1 - r0)]
	// (and 0 outside [r0, r1])
	const rippleRadiusDerivSteps: string[] = [];
	const inverseRadiusDerivSteps: string[] = [];
	const resolution = 8;
	for (let k = 0; k <= resolution; k++) {
		const alpha = k / resolution;
		const r = p.r0px + alpha * (p.r1px - p.r0px);
		const theta = 2 * Math.PI * (r - p.r0px) / (p.r1px - p.r0px);
		const df = Math.sin(theta);
		const range = 1;

		{
			const channel = 255 * (df + range) / (2 * range);
			const color = cssColorFromGrayLevel(channel);
			rippleRadiusDerivSteps.push(`${color} ${r.toFixed(0)}px`);
		}
		{
			const unscaled = p.r0px / r;
			const white = 1;
			const black = p.r0px / p.r1px;
			const channel = 255 * (unscaled - black) / (white - black);
			const color = cssColorFromGrayLevel(channel);
			inverseRadiusDerivSteps.push(`${color} ${r.toFixed(0)}px`);
		}
	}
	const midGray = "#808080";
	const initialStep = `${midGray} 0`;
	const finalStep = `${midGray} 100%`;
	const fDerGradient =
		`radial-gradient(circle at center, ${[initialStep, ...rippleRadiusDerivSteps, finalStep].join(", ")})`;

	return {
		fDerGradient: {
			css: fDerGradient,
			black: -1,
			white: 1,
		},
		inverseRadius: {
			black: 1 / p.r1px,
			white: 1 / p.r0px,
			css: `radial-gradient(circle at center,
				${inverseRadiusDerivSteps.join(", ")}
			)`,
		},
		xscale: {
			black: -p.r1px,
			white: p.r1px,
			css: `linear-gradient(90deg, black calc(50% - ${p.r1px.toFixed(0)}px), #FF0 calc(50% + ${p.r1px.toFixed(0)}px))`,
		},
		yscale: {
			black: -p.r1px,
			white: p.r1px,
			css: `linear-gradient(0deg, black calc(50% - ${p.r1px.toFixed(0)}px), #0F0 calc(50% + ${p.r1px.toFixed(0)}px))`,
		},
	};
}

function createSVGElement<K extends keyof SVGElementTagNameMap>(s: K): SVGElementTagNameMap[K] {
	return document.createElementNS("http://www.w3.org/2000/svg", s);
}

function gradientSVG(p: {
	kind: "linear" | "radial"
	width: number,
	height: number,
	stops: { percent: number, color: string }[],
	angleDeg?: number,
}): SVGElement {
	const uniq = Math.random().toFixed(12).substring(2);
	const linearGradient = createSVGElement(
		p.kind === "linear"
			? "linearGradient"
			: "radialGradient"
	);
	linearGradient.id = "grad" + uniq;
	if (p.angleDeg) {
		linearGradient.setAttribute("gradientTransform", `rotate(${p.angleDeg})`);
	}

	for (const stopSpec of p.stops) {
		const stop = createSVGElement("stop");
		stop.setAttribute("offset", stopSpec.percent.toFixed(1) + "%");
		stop.setAttribute("stop-color", stopSpec.color);
		linearGradient.appendChild(stop);
	}

	const rect = createSVGElement("rect");
	rect.setAttribute("width", p.width.toString());
	rect.setAttribute("height", p.height.toString());
	rect.setAttribute("fill", `url(${JSON.stringify("#" + linearGradient.id)})`);

	const defs = createSVGElement("defs");
	defs.appendChild(linearGradient);

	const root = createSVGElement("svg");
	root.appendChild(defs);
	root.appendChild(rect);
	root.setAttribute("width", p.width.toString());
	root.setAttribute("height", p.height.toString());
	root.setAttribute("viewbox", `0 0 ${p.width} ${p.height}`);
	root.setAttribute("xmlns", "http://www.w3.org/2000/svg");

	return root;
}

function createRippleGradientSVG(p: {
	boxpx: number,
	/** Start of gradient (height = 0) */
	r0px: number,
	/** End of ripple radius (height = 0) */
	r1px: number,
}) {
	const box = Math.ceil(p.boxpx);
	// Radial gradient
	// Inverse radius
	// dx gradient
	// dy gradient

	const yellowGradient = createSVGElement("linearGradient");
	yellowGradient.id = "g-yellow";

	{
		const yellow0 = createSVGElement("stop");
		yellow0.setAttribute("offset", "0");
		yellow0.setAttribute("stop-color", "black");

		const yellow1 = createSVGElement("stop");
		yellow1.setAttribute("offset", "100%");
		yellow1.setAttribute("stop-color", "yellow");

		yellowGradient.appendChild(yellow0);
		yellowGradient.appendChild(yellow1);
	}

	const feImageYellow = createSVGElement("feImage");
	feImageYellow.setAttribute("href", "#g-yellow");

	const filter = createSVGElement("filter");
	filter.id = "f-ripple";
	filter.appendChild(feImageYellow);

	const rect = createSVGElement("rect");
	rect.setAttribute("width", box.toString());
	rect.setAttribute("height", box.toString());
	// rect.setAttribute("filter", "url(#f-ripple)");
	rect.setAttribute("fill", "url(#g-yellow)");

	const defs = createSVGElement("defs");
	defs.appendChild(yellowGradient);
	defs.appendChild(filter);

	const root = createSVGElement("svg");
	root.appendChild(defs);
	root.appendChild(rect);
	root.setAttribute("width", box.toFixed(0));
	root.setAttribute("height", box.toFixed(0));
	root.setAttribute("viewbox", `0 0 ${box.toFixed(0)} ${box.toFixed(0)}`);

	return root;
}

function cssColorFromGrayLevel(level: number) {
	const integer = Math.round(Math.max(0, Math.min(255, level)));
	return "#" + integer.toString(16).padStart(2, "0").repeat(3);
}

type ShadedDiv = {
	div: HTMLElement,
	black: number,
	white: number,
};

function multiplyDivs(
	a: ShadedDiv,
	b: ShadedDiv,
): ShadedDiv {
	// F = f_m * f + f_b in [0, 1]
	// G = g_m * g + g_b in [0, 1]

	// [f_m g_m]/[1 + f_b + g_b] * F * G
	//     - g_b/[1 + f_b + g_b] * F
	//     - f_b/[1 + f_b + g_b] * G
	//     + [f_b + g_b]/[1 + f_b + g_b]
	// in [0, 1]

	const filter = document.createElement("div");
	filter.style.position = "absolute";
	filter.style.backdropFilter = `url("/multiplier.svg#mulfil")`;
	filter.style.top = "0";
	filter.style.left = "0";
	filter.appendChild(b.div);

	const container = document.createElement("div");
	container.style.position = "relative";
	container.style.isolation = "isolate";
	container.appendChild(a.div);
	container.appendChild(filter);

	return {
		div: container,
		black: NaN,
		white: NaN,
	};
}

const div = document.getElementById("koi-bg") as HTMLDivElement;
console.log({ div });

const grad = rippleGradient({
	r0px: 100,
	r1px: 150,
});
console.log(grad);

// const mySvg = createRippleGradientSVG({
// 	boxpx: 200,
// 	r0px: 100,
// 	r1px: 150,
// });
// div.appendChild(mySvg);

const yellowSVG = gradientSVG({
	kind: "linear",
	width: 200,
	height: 200,
	stops: [
		{ percent: 0, color: "black" },
		{ percent: 100, color: "red" },
	],
	angleDeg: 0,
});
div.appendChild(yellowSVG);

const limeSVG = gradientSVG({
	kind: "radial",
	width: 200,
	height: 200,
	stops: [
		{ percent: 0, color: "black" },
		{ percent: 100, color: "lime" },
	],
});
div.appendChild(limeSVG);

{
	const yellowBox = document.createElement("div");
	yellowBox.style.width = "400px";
	yellowBox.style.height = "400px";
	yellowBox.style.border = "5px solid blue";
	yellowBox.style.background = grad.xscale.css;
	div.appendChild(yellowBox);

	const greenBox = document.createElement("div");
	greenBox.style.width = "400px";
	greenBox.style.height = "400px";
	greenBox.style.border = "5px solid blue";
	greenBox.style.background = grad.yscale.css;
	div.appendChild(greenBox);
}

{
	const box = document.createElement("div");
	box.style.width = "400px";
	box.style.height = "400px";
	box.style.border = "5px solid blue";
	box.style.background = grad.fDerGradient.css;
	div.appendChild(box);
}

{
	const box = document.createElement("div");
	box.style.width = "400px";
	box.style.height = "400px";
	box.style.border = "5px solid blue";
	box.style.background = grad.inverseRadius.css;
	div.appendChild(box);
	console.log(grad);
}
