const sampleText = await (await fetch("samples.txt")).text();

/**
 * @type {Array<{ title: string, content: string[], comments: string[], directives: string[]}>}
 */
const samples = [];
for (const line of sampleText.split("\n")) {
	if (line.startsWith("#")) {
		samples.push({
			title: line.substring(1).trim(),
			content: [],
			comments: [],
			directives: [],
		});
	} else if (line.startsWith("//")) {
		samples[samples.length - 1].comments.push(line.substring(2));
	} else if (line.match(/^[a-z]+$/)) {
		samples[samples.length - 1].directives.push(line);
	} else if (line.trim() !== "") {
		samples[samples.length - 1].content.push(line);
	}
}

const container = document.getElementById("text-samples");
for (const sample of samples) {
	const box = document.createElement("div");
	box.className = "sample-box";
	const tableWrapper = document.createElement("div");
	tableWrapper.className = "table-wrapper";
	const label = document.createElement("div");
	label.textContent = sample.title;
	label.className = "label";
	box.appendChild(label);

	if (sample.directives.includes("counterclockwise")) {
		const ring = createTextRing(sample.content.join(""));
		tableWrapper.appendChild(ring);
	} else {
		const table = createTextGridTable(sample.content);
		tableWrapper.appendChild(table);
		table.style.setProperty("--border-color", "transparent");
	}
	tableWrapper.className = "zonai";
	box.appendChild(tableWrapper);
	container.appendChild(box);
}

/**
 * @param lines {string[]}
 * @return {HTMLTableElement}
 */
function createTextGridTable(lines) {
	const table = document.createElement("table");
	for (const line of lines) {
		const tr = document.createElement("tr");
		for (const c of line) {
			const td = document.createElement("td");
			td.textContent = c;
			tr.appendChild(td);
		}
		table.appendChild(tr);
	}
	return table;
}

function readColumnsRightToLeft(lines) {
	let widest = Math.max(...lines.map(x => x.length));
	let columns = [];
	for (let c = widest - 1; c >= 0; c--) {
		let column = "";
		for (let r = 0; r < lines.length; r++) {
			if (lines[r][c]) {
				column += lines[r][c];
			}
		}
		columns.push(column);
	}
	return columns;
}

/**
 * @param line {string | string[]}
 */
function createTextRing(line) {
	const characterSpaceEm = 2;
	const circumferenceEm = line.length * characterSpaceEm;
	const radiusEm = circumferenceEm / (2 * Math.PI);
	const div = document.createElement("div");
	const canvasSize = 2 * radiusEm + 2.5 * characterSpaceEm;
	div.style.width = canvasSize.toFixed(2) + "em";
	div.style.height = canvasSize.toFixed(2) + "em";
	div.style.position = "relative";
	const center = document.createElement("div");
	center.className = "center";
	center.style.position = "absolute";
	center.style.textAlign = "center";
	div.appendChild(center);
	let i = 0;
	for (const c of line) {
		const cell = document.createElement("div");
		cell.style.display = "inline-block";
		cell.style.position = "absolute";
		cell.style.textAlign = "center";
		cell.textContent = c;
		const angleDeg = (i / line.length) * 360;
		cell.className = "radial";
		cell.style.setProperty("--radial-angle", -angleDeg.toFixed(2) + "deg");
		cell.style.setProperty("--radial-radius", (radiusEm + 0.5 * characterSpaceEm).toFixed(2) + "em");
		i++;
		center.appendChild(cell);
	}
	return div;
}

////////////////////////////////////////////////////////////////////////////////

function el(tag, content = [], attributes = {}) {
	if (!Array.isArray(content)) {
		return el(tag, [content], attributes);
	}

	const e = document.createElement(tag);
	for (const c of content.flat(100)) {
		if (typeof c === "string") {
			e.appendChild(document.createTextNode(c));
		} else if (typeof c === "number" || typeof c === "boolean") {
			e.appendChild(document.createTextNode(String(c)));
		} else {
			if (!(c instanceof Node)) {
				console.error("attempting to append non node", c, "to", e);
			}
			e.appendChild(c);
		}
	}

	for (const [k, v] of Object.entries(attributes)) {
		e.setAttribute(k, v);
	}
	for (const [p, v] of Object.entries(attributes.style || {})) {
		e.style.setProperty(p, v);
	}
	return e;
}

/**
 * @param ngrams {{entries: {ngram: string, count: number}[], total: number}}
 */
function renderUnigramTable(ngrams, style) {
	const most = ngrams.entries[0].count;
	return el(
		"table",
		[
			el("tr", [el("th", "Letter"), el("th", "Relative frequency", { colspan: 2 })]),
			ngrams.entries.map(({ ngram, count }) =>
				el("tr", [
					el("th", ngram, { class: "ngram" }),
					el("td", count.toFixed(0)),
					el("td",
						el(
							"span",
							[el("span", ["-"], { style: { visibility: "hidden" } }), (100 * count / ngrams.total).toFixed(0) + "%"],
							{
								style: {
									background: "black",
									width: (count / most * 100).toFixed(1) + "%",
									display: "inline-block",
									color: "white",
									"padding-top": "0.25em",
									"padding-bottom": "0.25em",
									overflow: "hidden",
								},
							},
						)
					),
				]),
			)
		],
		{
			style: {
				...style
			},
		},
	);
}

function flexTableCell(element) {
	return el("div", [element.e], {
		class: "flex-cell",
		style: {
			position: "relative",
			"flex-basis": 0,
			"flex-grow": element.size,
		},
	});
}

/**
 * @param row {{ size: number, key: string, elements: {size: number, e: HTMLElement}[] }}
 */
function flexTableRow(row) {
	return el("div",
		row.elements.map(element => flexTableCell(element)),
		{
			class: "flex-row",
			style: {
				// As a parent of flex-cell
				display: "flex",
				"flex-direction": "row",
				"flex-wrap": "nowrap",
				"justify-content": "space-between",

				// As a child of flex-table
				"flex-basis": 0,
				"flex-grow": row.size,
			},
		}
	);
}

/**
 * @param rows {Array<{ size: number, key: string, elements: {size: number, e: HTMLElement}[] }>}
 * @return {HTMLDivElement}
 */
function flexTable(rows) {
	return el("div",
		rows.map(row => flexTableRow(row)),
		{
			class: "flex-table",
			style: {
				display: "flex",
				"flex-direction": "column",
				"flex-wrap": "nowrap",
				"justify-content": "space-between",
			},
		},
	)
}

/**
 * @returns {HTMLTableElement}
 */
function tableTable(bigrams, letterOrder, makeTh = (text, side) => el("th", text)) {
	let max = Math.max(...Object.values(bigrams));
	const heading = el("tr",
		[el("th"), letterOrder.map(trailing => makeTh(trailing, "column"))]
	);
	const body = letterOrder.map(leading =>
		el("tr", [
			makeTh(leading, "row"),
			letterOrder.map(trailing => {
				const bigram = leading + trailing;
				const occurrences = bigrams[bigram] || 0;
				const percentage = [(occurrences * 100).toFixed(0), el("sup", "%", { style: { "vertical-align": "text-top" } })];
				return el(
					"td",
					[occurrences > 0 ? percentage : ""],
					{
						"data-table-max": max,
						"data-table-value": occurrences,
						"data-table-shade": occurrences / max,

						style: {
							"--table-shade": occurrences / max,
						},
					},
				);
			}),
		])
	);

	return el("table", [heading, body]);
}

/**
 * @param text {string}
 * @param n {number}
 * @returns { {frequency: Record<string, number>, entries: {ngram: string, count: number}[], total: number} }
 */
function ngrams(text, n) {
	let total = 0;
	const frequency = {};
	const dense = text.replace(/[^a-zA-Z|]/g, "");
	for (let i = 0; i + n < dense.length; i++) {
		const s = dense.substring(i, i + n);
		if (s.indexOf("|") >= 0) {
			continue;
		}
		frequency[s] = (frequency[s] || 0) + 1;
		total += 1;
	}
	return {
		frequency,
		total,
		entries: Object.entries(frequency)
			.map(([ngram, count]) => ({ ngram, count }))
			.sort((a, b) => b.count - a.count),
	};
}

/**
 * @param text {string}
 */
function makeBigramTable(text, makeTh) {
	const unigrams = ngrams(text, 1);
	const bigrams = ngrams(text, 2);

	const letterOrder = unigrams.entries.map(({ ngram }) => ngram);
	const relative = {};
	for (const leading of letterOrder) {
		for (const trailing of letterOrder) {
			const bigram = leading + trailing;
			const bigramFraction = (bigrams.frequency[bigram] || 0) / bigrams.total;
			relative[bigram] = bigramFraction;
		}
	}

	const flexy = tableTable(relative, letterOrder, makeTh);
	flexy.classList.add("bigrams", "heatmap", "square-cell-1-5");
	return flexy;
}

// Determine letter frequency
function sectionLetterFrequency() {
	const section = document.getElementById("letter-frequency");

	const zonaiCorpus = samples.map(sample => sample.content.join("")).join("");
	const zonaiUnigrams = ngrams(zonaiCorpus, 1);
	const japaneseUnigrams = ngrams(processedRomaji, 1);

	section.appendChild(
		el("p", `The samples included in this page include ${zonaiUnigrams.total} Zonai letters total.`)
	);

	const least = zonaiUnigrams.entries[zonaiUnigrams.entries.length - 1];
	const most = zonaiUnigrams.entries[0];

	section.appendChild(
		el("p", [
			"The letter with the least occurrences is ",
			el("span", least.ngram, { class: "zonai" }),
			", with ",
			least.count,
			" occurrences.",
		])
	);

	section.appendChild(
		el("p", [
			"The letter with the most occurrences is ",
			el("span", most.ngram, { class: "zonai" }),
			", with " + most.count + " occurrences.",
		])
	);

	const zonaiTable = renderUnigramTable(zonaiUnigrams, {
		"min-width": "10em",
		"flex-grow": "1",
		"flex-basis": "10em",
	});
	zonaiTable.classList.add("zonai-ngram");

	const japaneseTable = renderUnigramTable(japaneseUnigrams, {
		"min-width": "10em",
		"flex-grow": "1",
		"flex-basis": "10em",
	});

	const sideBySide = el("div",
		[zonaiTable, japaneseTable],
		{
			style: {
				display: "flex",
				"flex-direction": "row",
				"flex-wrap": "wrap",
				"justify-content": "space-between",
				gap: "1em",
			},
		},
	);

	section.appendChild(sideBySide);
}

function sectionBigramFrequency() {
	const section = document.getElementById("bigram-frequency");

	let zonaiColumnized = [];
	for (const sample of samples) {
		if (sample.directives.length === 0) {
			const c = readColumnsRightToLeft(sample.content);
			zonaiColumnized.push({ title: sample.title, text: c });
		} else if (sample.directives.includes("counterclockwise")) {
			console.log(sample);
			zonaiColumnized.push({ title: sample.title, text: sample.content });
		}
	}

	const zonaiTh = (text, side) => {
		return el("th", side === "row" ? text + "_" : "_" + text, {
			class: "zonai",
			style: {
				"font-size": "65%",
			},
		});
	};
	const jTh = (text, side) => {
		return el("th", side === "row" ? text + "_" : "_" + text, {
			style: {
				"font-size": "75%",
			},
		});
	};

	const zonaiCorpus = zonaiColumnized.map(t => t.text.join("|")).join("|");
	const zonaiTable = makeBigramTable(zonaiCorpus, zonaiTh);
	const romajiTable = makeBigramTable(processedRomaji, jTh);

	const sideBySide = el("div",
		[zonaiTable, romajiTable],
		{
			style: {
				display: "flex",
				"flex-direction": "row",
				"flex-wrap": "wrap",
				"justify-content": "space-between",
				gap: "1em",
			},
		},
	);
	section.appendChild(sideBySide);

	function toLetterBox(s) {
		return el("span", s, {
			style: {
				width: "1.7em",
				"text-align": "center",
				display: "inline",
				"letter-spacing": "0.25em",
			},
		});
	}

	function toLetterBoxes(s) {
		const out = [];
		for (const c of s) {
			if ("A" <= c && c <= "Z") {
				out.push(toLetterBox(c));
			} else {
				out.push(c);
			}
		}
		return out;
	}

	container.appendChild(
		el("details", [
			el("summary", "Zonai corpus for ngrams"),
			el("p", "Below is the text, read as columns, right-to-left, for all of the samples."),
			el(
				"blockquote",
				zonaiColumnized.map((z, i) => [
					i === 0 ? [] : el("hr"),
					el(
						"p", [
						el("span", toLetterBoxes(z.text.join(" - ")), { class: "zonai" }),
						el("br"),
						el("small", z.title, { style: { opacity: 0.75 } }),
					]
					)
				]
				),
			)
		])
	);
}

let processedRomaji = "";

function processRomajiSample() {
	const romaji = document.getElementById("romaji-sample").textContent.trim();

	const processed = romaji
		.replace(/fu/g, "hu")
		.replace(/ch([aeuo])/g, "tiy$1")
		.replace(/(?:sh|j)([aeuo])/g, "siy$1")
		.replace(/shi/g, "si")
		.replace(/chi/g, "ti")
		.replace(/tsu/g, "tu")
		.replace(/d/g, "t")
		.replace(/[jz]/g, "s")
		.replace(/g/g, "k")
		.replace(/[pb]/g, "h")
		.replace(/([kshnmr])y/g, "$1iy")
		.replace(/([skth])\1/g, "tu$1")
		.replace(/([aeiou])\1/g, "$1");

	document.getElementById("romaji-sample-processed").textContent = processed;
	processedRomaji = processed;
}

processRomajiSample();
sectionLetterFrequency();
sectionBigramFrequency();
