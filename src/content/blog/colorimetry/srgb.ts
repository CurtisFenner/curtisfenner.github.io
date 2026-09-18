import { mat3, vec3 } from "gl-matrix";
import { rec709Primaries } from "./lmsTable.ts";

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

const cieXYZTosRGBMatrix = mat3.invert(mat3.create(), sRGBColorPrimary)!;

export function cieXYZTosRGB(color: { X: number, Y: number, Z: number }) {
	const [linearR, linearG, linearB] = vec3.transformMat3(
		vec3.create(),
		vec3.fromValues(color.X, color.Y, color.Z),
		cieXYZTosRGBMatrix,
	);
	return {
		linearR,
		linearG,
		linearB,
	};
}
