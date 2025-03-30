export const GRADIENT = [
	"#A0A2AA",
	"#B8BCC8",
	"#CCD0D6",
	"#E0DDDA",
	"#FFF4D6",
];

/**
 * The width/height of the (square) diamonds making up the background,
 * measured from tip-to-tip.
 */
export const DIAMOND_SIZE_VH = 9 * 0.51234567;

export type SunTransition = {
	i0: number;
	/** position, in vh */
	y0: number;
	i1: number;
	/** position, in vh */
	y1: number;
};

export const TRANSITIONS: SunTransition[] = [
	{
		i0: 0,
		y0: 12.5,
		i1: 1,
		y1: 25,
	},
	{
		i0: 1,
		i1: 2,
		y0: 37.5,
		y1: 50,
	},
	{
		i0: 2,
		i1: 3,
		y0: 62.5,
		y1: 75,
	},
	{
		i0: 3,
		i1: 4,
		y0: 87.5,
		y1: 100,
	},
];

export function yProbs(y: number): Map<string, number> {
	const transition = TRANSITIONS.find(t => y <= t.y1)
		|| TRANSITIONS[TRANSITIONS.length - 1];

	const t = (y - transition.y0) / (transition.y1 - transition.y0);
	if (t <= 0) {
		return new Map([[GRADIENT[transition.i0], 1]]);
	} else if (t >= 1) {
		return new Map([[GRADIENT[transition.i1], 1]]);
	} else {
		return new Map([
			[GRADIENT[transition.i0], 1 - t],
			[GRADIENT[transition.i1], t],
		]);
	}
}

export function chooseWeighted<K>(m: Map<K, number>): K {
	let sum = 0;
	for (const v of m.values()) {
		sum += v;
	}

	let p = Math.random() * sum;
	for (const [k, v] of m) {
		p -= v;
		if (p <= 0 && v > 0) {
			return k;
		}
	}
	throw new Error("unreachable");
}
