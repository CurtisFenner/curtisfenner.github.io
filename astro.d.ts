// Source - https://stackoverflow.com/a/75543975
// Posted by David Abell
// Retrieved 2026-01-23, License - CC BY-SA 4.0

import "astro/astro-jsx";

declare global {
	namespace JSX {
		type Element = HTMLElement
		// type Element = astroHTML.JSX.Element // We want to use this, but it is defined as any.
		type IntrinsicElements = astroHTML.JSX.IntrinsicElements
	}
}
