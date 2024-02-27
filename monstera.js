

// The angle is APPROXIMATELY:
// Y   Angle               Length
//  1     -pi/4 (up-right)    157 = 0.29 height
//  4    0 (right)          266 = 0.85 height
// 14    1 pi/4 (down-right)  316 = 0.59 height
//    1.32 pi/4 (down-down right) 250 = 0.46 height
//     1.5 pi/4            135 = 0.25 height
// 54    2 pi/4 (down)      0   = 0 height

// This can be simplified to roughly
// Y   Angle         p
// k^0   -1 pi/4     (k^-3 - k^-3)/(1 - k^-3) = 0
// k^1    0 pi/4     (k^-2 - k^-3)/(1 - k^-3)
// k^u  u-1 pi/4     (k^(u-3) - k^-3) / (1 - k^-3)
// k^2    1 pi/4     (k^-1 - k^-3)/(1 - k^-3)
// k^3    2 pi/4     (k^ 0 - k^-3)/(1 - k^-3) = 1
// for k about 3.7

// p = (k^(u-3) - k^-3) / (1 - k^-3)
// p * (1 - k^-3) + k^-3 = k^(u - 3)
// log[ p * (1 - k^-3) + k^-3 ] = (u - 3)(log k)
// log[ p * (1 - k^-3) + k^-3 ] / log(k) + 3 = u

// For Y ranging between 0 (tip) and 1 (base)
// the radius is approximately
// -Y * (Y - sqrt(4/3)) * 20 * LENGTH_OF_STEM.

// There are 6 ish alternating stems on either side.

class MonsteraCurve {
	K = 3.7;

	radius(fraction) {
		const u = Math.log(fraction * (1 - this.K ** -3) + this.K ** -3) / Math.log(this.K) + 3;
		const d = u - 1;
		return -0.25 * d ** 2 + 0.125 * d + 0.75;
	}

	angle(fraction) {
		const u = Math.log(fraction * (1 - this.K ** -3) + this.K ** -3) / Math.log(this.K) + 3;
		return (u - 1) * Math.PI / 4;
	}

	pointOnSpine(fraction) {
		const radius = this.radius(fraction);
		const angle = this.angle(fraction);

		return {
			x: radius * Math.cos(angle),
			y: fraction + radius * Math.sin(angle),
		};
	}

	approximateExteriorHalf() {
		const stops = [
			{ "x": 0, "y": 0, "tangent": { "x": 0.25, "y": -1 }, "after": 0.13, "before": 0 },
			{ "x": 0.27, "y": -0.27, "tangent": { "x": 18, "y": -6 }, "before": 0.2, "after": 0.08 },
			{ "x": 0.57, "y": -0.23, "tangent": { "x": 37, "y": 27 }, "before": 0.13, "after": 0.18 },
			{ "x": 0.77, "y": 0.22, "tangent": { "x": -4, "y": 20 }, "before": 0.18, "after": 0.33 },
			{ "x": 0.44, "y": 0.72, "tangent": { "x": -16, "y": 11 }, "before": 0.13, "after": 0.2 },
			{ "x": 0.1, "y": 0.89, "tangent": { "x": -19, "y": 11 }, "before": 0.06, "after": 0.05 },
			{ "x": 0, "y": 1, "tangent": { "x": 0, "y": 1 }, "before": 0.04, "after": 0 },
		];

		return stops.map(v => {
			const tangent = V2unit(v.tangent);
			return {
				position: {
					x: v.x,
					y: v.y,
				},
				before: V2addScaled(v, -v.before, tangent),
				after: V2addScaled(v, v.after, tangent),
			};
		});
	}

	/**
	 * @param {number} y recommended between about 0.1 and 0.5 for cuts
	 */
	veinPath(p0, resolution = 20) {
		const angle0 = this.angle(p0);
		const length0 = this.radius(p0);

		const iStep = 0.5 / Math.cos(angle0);

		const p1 = p0 + (iStep * 0.75) / 11;
		const angle1 = this.angle(p1);
		const length1 = this.radius(p1);

		const vein = [];
		for (let k = 0; k <= resolution * 1.3; k++) {
			const t = k / resolution;

			const point0 = {
				x: 0 + Math.cos(angle0) * length0 * t,
				y: p0 + Math.sin(angle0) * length0 * t,
			};
			const point1 = {
				x: 0 + Math.cos(angle1) * length1 * t,
				y: p1 + Math.sin(angle1) * length1 * t,
			};
			const mix = t ** 3;
			const point = {
				t,
				x: (1 - mix) * point0.x + mix * point1.x,
				y: (1 - mix) * point0.y + mix * point1.y,
			}
			vein.push(point);
		}

		const middle = vein.findIndex(x => x.t > 0.5);
		const middleSlope = {
			x: vein[middle].x - vein[middle - 1].x,
			y: vein[middle].y - vein[middle - 1].y,
		};
		const middleMagnitude = Math.sqrt(middleSlope.x ** 2 + middleSlope.y ** 2);
		middleSlope.x /= middleMagnitude;
		middleSlope.y /= middleMagnitude;

		const oneStep = 0.5 / middleSlope.x;
		return {
			vein,
			oneStep,
		};
	}

	leafCut(p0, radius) {
		const vein = this.veinPath(p0, 10);

		const low = radius * (2.5 + Math.random() * 1) / Math.cos(this.angle(p0));
		const high = 1.2 - 0.3 * Math.random();

		const section = vein.vein.filter(v => {
			return low <= v.t && v.t <= high;
		});

		return {
			vein: vein.vein,
			curve: makeSlug(section, radius, radius * (1.75 + 1 * Math.random()), -0.75),
			oneStep: vein.oneStep,
		};
	}

	veinStarts(count, offset = 0.1 + Math.random()) {
		const veins = [];
		for (let i = offset; i < count * 0.5;) {
			const v = this.leafCut(i / count, 0.5 / count * (0.75 + 0.5 * Math.random()));

			veins.push({
				i,
				veinPath: v.vein,
				leafCut: v.curve,
			});

			i += v.oneStep;
		}
		return veins;
	}
}

/**
 *
 * @typedef {{x: number, y: number}} V2
 */

/**
 * @param {V2[]} spine
 * @param {number} endRadius
 * @param {number} middleRadius
 * @param {number} asymmetry the amount that the increase from
 *                           `endRadius` to `middleRadius` should be biased to
 *                           one side.
 * @returns {{position: V2, before: V2, after: V2}[]}
 */
function makeSlug(spine, endRadius, middleRadius, asymmetry) {
	const leftBump = (middleRadius - endRadius) * (asymmetry * 0.5 + 0.5);
	const rightBump = (middleRadius - endRadius) - leftBump;

	const parallel0 = V2unit(V2subtract(spine[1], spine[0]));
	const cap0 = {
		position: V2addScaled(
			spine[0],
			-endRadius,
			parallel0,
		),
	};
	const perpendicular0 = { x: -parallel0.y, y: parallel0.x };
	cap0.before = V2addScaled(cap0.position, -endRadius * 0.75, perpendicular0);
	cap0.after = V2addScaled(cap0.position, endRadius * 0.75, perpendicular0);

	const parallel1 = V2unit(V2subtract(spine[spine.length - 2], spine[spine.length - 1]));
	const cap1 = {
		position: V2addScaled(
			spine[spine.length - 1],
			-endRadius,
			parallel1,
		),
	};
	const perpendicular1 = { x: -parallel1.y, y: parallel1.x };
	cap1.before = V2addScaled(cap1.position, -endRadius * 0.75, perpendicular1);
	cap1.after = V2addScaled(cap1.position, endRadius * 0.75, perpendicular1);

	return [
		cap0,
		...makeSlugHalf(spine, endRadius, endRadius + leftBump),
		cap1,
		...makeSlugHalf(spine.slice(0).reverse(), endRadius, endRadius + rightBump),
	];
}

/**
 * @param {V2} a
 * @param {V2} b
 */
function V2subtract(a, b) {
	return {
		x: a.x - b.x,
		y: a.y - b.y,
	};
}

/**
 * @param {V2} a
 */
function V2unit(a) {
	const m = Math.sqrt(a.x ** 2 + a.y ** 2);
	return {
		x: a.x / m,
		y: a.y / m,
	};
}

/**
 * @param {V2} a
 * @param {V2} b
 */
function V2distance(a, b) {
	const d = V2subtract(a, b);
	return Math.sqrt(d.x ** 2 + d.y ** 2);
}

/**
 * @param {V2} a
 * @param {number} c
 * @param {V2} b
 */
function V2addScaled(a, c, b) {
	return {
		x: a.x + c * b.x,
		y: a.y + c * b.y,
	};
}

/**
 * @param {V2[]} spine
 * @param {number} endRadius
 * @param {number} middleRadius
 * @returns {{position: V2, before: V2, after: V2}[]}
 */
function makeSlugHalf(spine, endRadius, middleRadius) {
	if (spine.length < 2) {
		throw new Error("slug must be at least 2 long");
	}

	const edges = [];
	for (let i = 0; i < spine.length; i++) {
		const parallel = V2unit(V2subtract(
			spine[Math.min(spine.length - 1, i + 1)],
			spine[Math.max(0, i - 1)]
		));
		const perpendicular = { x: -parallel.y, y: parallel.x };
		// 0 1 2 3 4
		//     ^
		const t = Math.abs(i - (spine.length - 1) / 2) / ((spine.length - 1) / 2);
		const radius = middleRadius * (1 - t) + t * endRadius;
		edges.push({
			position: {
				x: spine[i].x + perpendicular.x * radius,
				y: spine[i].y + perpendicular.y * radius,
			},
			spine: spine[i],
		});
	}

	for (let i = 0; i < edges.length; i++) {
		const before = edges[Math.max(0, i - 1)].position;
		const after = edges[Math.min(edges.length - 1, i + 1)].position;
		let gap = V2distance(after, before);
		if (i === 0 || i === edges.length - 1) {
			gap *= 2;
		}
		const parallel = V2unit(V2subtract(after, before));
		edges[i].before = V2addScaled(edges[i].position, -gap / 8, parallel);
		edges[i].after = V2addScaled(edges[i].position, gap / 8, parallel);
		edges[i].parallel = parallel;
		edges[i].perpendicular = {
			x: -parallel.y,
			y: parallel.x,
		};
	}

	return edges;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{position: V2, after: V2, before: V2}[]} curve
 */
function drawClosedCurve(ctx, curve, scale, offset = { x: 0, y: 0 }) {
	let previous = curve[curve.length - 1];
	ctx.moveTo(scale * previous.position.x, scale * previous.position.y);
	for (let i = 0; i < curve.length; i++) {
		const now = curve[i];
		ctx.bezierCurveTo(
			scale * previous.after.x + offset.x,
			scale * previous.after.y + offset.y,
			scale * now.before.x + offset.x,
			scale * now.before.y + offset.y,
			scale * now.position.x + offset.x,
			scale * now.position.y + offset.y,
		);
		previous = now;
	}
	ctx.closePath();
}

function toSVGPath(curve, scale, offset = { x: 0, y: 0 }) {
	const words = []
	let previous = curve[curve.length - 1];
	words.push(
		"M",
		scale.x * previous.position.x + offset.x,
		",",
		scale.y * previous.position.y + offset.y,
	);
	for (let i = 0; i < curve.length; i++) {
		const now = curve[i];
		words.push(
			"C",
			scale.x * previous.after.x + offset.x,
			",",
			scale.y * previous.after.y + offset.y,
			" ",
			scale.x * now.before.x + offset.x,
			",",
			scale.y * now.before.y + offset.y,
			" ",
			scale.x * now.position.x + offset.x,
			",",
			scale.y * now.position.y + offset.y,
		);
		previous = now;
	}
	words.push("Z");

	return words.map(x => {
		if (typeof x === "number") {
			return x.toFixed(3);
		}
		return x;
	}).join("");
}

/**
 * @param {V2} a
 * @param {V2} b
 */
function V2dot(a, b) {
	return a.x * b.x + a.y * b.y;
}

/**
 * @param {number} c
 * @param {V2} v
 */
function V2scale(c, v) {
	return {
		x: c * v.x,
		y: c * v.y,
	};
}

/**
 * @param {{position: V2, after: V2, before: V2}[]} curve
 * @param {(v: V2, absolute: boolean) => V2} bumps
 * @return {{position: V2, after: V2, before: V2}[]}
 */
function bumpyCurve(curve, bumps) {
	return curve.map(point => {
		const spin = bumps(point.position, false);
		const bumpedBefore = V2addScaled(point.before, 1, spin);
		const bumpedAfter = V2addScaled(point.after, 1, spin);
		const newAxis = V2unit(V2addScaled(V2subtract(bumpedAfter, point.position), 1, V2subtract(point.position, bumpedBefore)));

		const newPosition = V2addScaled(point.position, 1, bumps(point.position, true));

		return {
			position: newPosition,
			before: V2addScaled(newPosition, V2dot(newAxis, V2subtract(bumpedBefore, point.position)), newAxis),
			after: V2addScaled(newPosition, V2dot(newAxis, V2subtract(bumpedAfter, point.position)), newAxis),
		};
	});
}

/**
 * @param {{position: V2, after: V2, before: V2}[]} curve
 * @return {{position: V2, after: V2, before: V2}[]}
 */
function reverseCurve(curve) {
	return curve.slice(0).reverse().map(point => {
		return { ...point, before: point.after, after: point.before };
	});
}

function V2multiply(a, b) {
	return {
		x: a.x * b.x,
		y: a.y * b.y,
	};
}

/**
 * @param {{position: V2, after: V2, before: V2}[]} curve
 * @param {V2} scale
 * @return {{position: V2, after: V2, before: V2}[]}
 */
function scaleCurve(curve, scale) {
	return curve.map(point => {
		return {
			position: V2multiply(scale, point.position),
			before: V2multiply(scale, point.before),
			after: V2multiply(scale, point.after),
		};
	});
}

const mon = new MonsteraCurve();

function randomNormal() {
	const a = Math.random();
	const b = Math.random();
	return {
		x: Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b),
		y: Math.sqrt(-2 * Math.log(a)) * Math.sin(2 * Math.PI * b),
	};
}

const basicSize = 70 + 70 * Math.random();
const size = {
	x: basicSize,
	y: basicSize - 10 + 40 * Math.random(),
};
const dimensions = 250;

let clipPath = "";

clipPath += `M0,0 L${dimensions},0 L${dimensions},${dimensions} L0,${dimensions} Z`;

const slotCount = size.y * 0.08 + 3 * Math.random() ** 1.5;
const rightCuts = mon.veinStarts(slotCount);
const offset = { x: dimensions / 2, y: dimensions / 3 };
for (let i = 0; i < rightCuts.length; i++) {
	const sign = i % 2 === 0 ? +1 : -1;
	clipPath += toSVGPath(rightCuts[i].leafCut, { x: size.x * sign, y: size.y }, offset);
}

const plainExteriorHalf = mon.approximateExteriorHalf();

const bumper = (v, absolute) => {
	if (absolute) {
		return V2scale(Math.abs(v.x) * 0.05, randomNormal());
	} else {
		return V2scale(size.x * 0.0000125, randomNormal());
	}
};

const exterior = [
	...plainExteriorHalf,
	...scaleCurve(reverseCurve(plainExteriorHalf), { x: -1, y: 1 }),
];

const outerPath = toSVGPath(exterior, size, offset);

const outer = document.createElement("div");

const inner = document.createElement("div");
inner.style.background = "green";
inner.style.width = dimensions + "px";
inner.style.height = dimensions + "px";
inner.style.clipPath = "path(evenodd, " + JSON.stringify(clipPath) + ")";
outer.appendChild(inner);


outer.style.width = dimensions + "px";
outer.style.height = dimensions + "px";
outer.style.clipPath = "path(" + JSON.stringify(outerPath) + ")";

document.body.appendChild(outer);
