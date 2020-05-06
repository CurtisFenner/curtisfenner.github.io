"use strict";

var CodeLines = {};
CodeLines.KEYPRESS = 20; // ms delay per character typed
CodeLines.CHAR = 10; // px width of character
CodeLines.MARGIN = 1; // px width of space between spans
CodeLines.stack = ["block", Break()];

// Randomness helpers
function Many(lo, hi, n) {
	return function () {
		var x = [];
		var r = Math.random() * (hi - lo) + lo;
		if (CodeLines.stack.length > 10) {
			r = lo;
		}
		for (var i = 0; i < r; i++) {
			x.push(n);
		}
		return x;
	};
}

function Maybe(p, n) {
	return function () {
		if (Math.random() < p) {
			return [n];
		} else {
			return [];
		}
	};
}

function Weight(map) {
	return function () {
		var s = 0;
		for (var n in map) {
			s += map[n];
		}
		s *= Math.random();
		for (var n in map) {
			s -= map[n];
			if (s <= 0) {
				return n;
			}
		}
	};
}

////////////////////////////////////////////////////////////////////////////////

function Open() {
	return {
		type: "open",
	}
}

function Close() {
	return {
		type: "close",
	}
}

function bar(w, kind, q) {
	if (typeof w === "string") {
		return bar(w.length, kind, w);
	}
	return {
		type: "bar",
		width: w,
		text: q || "_",
		kind: kind,
	};
}

function Break() {
	return {
		type: "break",
	}
}

////////////////////////////////////////////////////////////////////////////////

// Source: https://www.lua.org/manual/5.1/manual.html#8
// A specification of the probabilistic grammar the simulation uses
// (based on Lua 5.1)
var grammar = {
	// keyword
	"for": bar("for", "keyword"),
	"in": bar("in", "keyword"),
	"repeat": bar("repeat", "keyword"),
	"until": bar("until", "keyword"),
	"while": bar("while", "keyword"),
	"function": bar("function", "keyword"),
	"if": bar("if", "keyword"),
	"then": bar("then", "keyword"),
	"else": bar("else", "keyword"),
	"elseif": bar("elseif", "keyword"),
	"return": bar("return", "keyword"),
	"local": bar("local", "keyword"),
	"break": bar("break", "keyword"),
	"do": bar("do", "keyword"),
	"end": bar("end", "keyword"),
	// value literal
	"nil": bar("nil", "value"),
	"false": bar("false", "value"),
	"true": bar("true", "value"),
	"...": bar("...", "value"),
	// operator
	"-": bar("-", "operator"),
	"#": bar("-", "operator"),
	"not": bar("-", "operator"),
	"and": bar("-", "operator"),
	"or": bar("-", "operator"),
	"+": bar("+", "operator"),
	"=": bar("=", "operator"),
	"==": bar("==", "operator"),
	"*": bar("*", "operator"),
	// brackets & indices
	",": bar(",", "bracket"),
	".": bar(".", "bracket"),
	":": bar(":", "bracket"),
	"(": bar("(", "bracket"),
	")": bar(")", "bracket"),
	"[": bar("[", "bracket"),
	"]": bar("]", "bracket"),
	"{": bar("{", "bracket"),
	"}": bar("}", "bracket"),
	////////////////////////////////////////////////////////////////////////////
	name: function () {
		var n = "a";
		for (var i = 0; i * i < Math.random() * 64; i++) {
			n += "a";
		}
		return bar(n, "name");
	},
	number: function () {
		var n = "9";
		for (var i = 0; i * i < Math.random() * 64; i++) {
			n += i;
		}
		return bar(n, "number");
	},
	string: "number",
	////////////////////////////////////////////////////////////////////////////
	chunk: [
		Many(1, 5, "stat"), Many(0, 5, "stat"), Many(0, 5, "stat"), Maybe(0.1, "laststat")
	],
	////////////////////////////////////////////////////////////////////////////
	block: [Open(), "chunk", Close(), Break()],
	stat: [Break(), Maybe(0.1, Break()), Maybe(0.1, Break()), Weight({
		"assignment": 20,
		"functioncall": 10,
		"doblock": 1,
		"whileblock": 3,
		"repeatblock": 1,
		"ifblock": 5,
		"fornumeric": 2,
		"forgeneric": 5,
		"functionblock": 6,
		"localfunction": 2,
		"localstatement": 10,
	})],
	//
	assignment: ["varlist", "=", "explist"],
	doblock: ["do", "block", "end"],
	whileblock: ["while", "exp", "do", "block", "end"],
	repeatblock: ["repeat", "block", "until", "exp"],
	ifblock: [
		"if", "exp", "then", "block",
		Maybe(0.5, Many(0, 3, ["elseif", "exp", "then", "block"])),
		Maybe(0.5, ["else", "block"]),
		"end",
	],
	fornumeric: ["for", "name", "=", "exp", "$,", "exp", Maybe(0.2, ["$,", "exp"]), "do", "block", "end"],
	forgeneric: ["for", "namelist", "in", "explist", "do", "block", "end"],
	functionblock: ["function", "funcname", "funcbody"],
	localfunction: ["local", "function", "name", "funcbody"],
	localstatement: ["local", "namelist", Maybe(0.9, ["=", "explist"])],
	//
	laststat: [Break(), Weight({
		"returnstat": 10,
		"breakstat": 2,
	})],
	returnstat: ["return", Maybe(0.7, "explist")],
	breakstat: "break",
	funcname: [
		"name",
		Maybe(0.2, Many(0, 3, ["$.$", "name"])),
		Maybe(0.2, ["$:$", "name"])
	],
	//
	varlist: [
		"var", Many(0, 2, [",", "var"]),
	],
	var: Weight({ "name": 5, "varcomplex1": 1, "varcomplex2": 1 }),
	varcomplex1: ["prefixexp", "$[$", "exp", "$]$"],
	varcomplex2: ["prefixexp", "$.$", "name"],
	//
	namelist: ["name", Many(0, 2, ["$,", "name"])],
	explist: ["exp", Many(0, 2, ["$,", "exp"])],
	//
	exp: Weight({
		"nil": 1,
		"false": 1,
		"true": 1,
		"number": 1,
		"string": 1,
		"...": 0.1,
		"anonymousfunction": 1,
		"prefixexp": 1,
		"tableconstructor": 1,
		"binop": 2,
		"unop": 1,
	}),
	prefixexp: Weight({
		"var": 5,
		"functioncall": 2,
		"parened": 1,
	}),
	parened: ["$($", "exp", "$)$"],
	//
	functioncall: Weight({
		"normalcall": 2,
		"methodcall": 1,
	}),
	normalcall: ["prefixexp", "args"],
	methodcall: ["prefixexp", "$:$", "name", "args"],
	//
	args: ["$($", "explist", "$)$"], // no table / string calls
	anonymousfunction: ["function", "funcbody"],
	funcbody: ["$($", Weight({ "parlist": 3, "...": 1 }), "$)", "block", "end"],
	parlist: ["namelist", Maybe(0.2, ["$,", "..."])],
	tableconstructor: ["{$", Maybe(0.75, "fieldlist"), "$}"],
	fieldlist: ["field", Many(0, 4, ["$,", "field"])],
	field: Weight({
		"namefield": 5,
		"keyfield": 2,
		"exp": 5,
	}),
	namefield: ["name", "=", "exp"],
	keyfield: ["[", "exp", "]", "=", "exp"],
	binop: ["exp", Weight({ "+": 5, "==": 4, "and": 1 }), "exp"],
	unop: [
		Weight({
			"-$": 1,
			"not": 1,
			"#$": 1
		}), "exp"
	],
};

////////////////////////////////////////////////////////////////////////////////

CodeLines.lines = [];
CodeLines.lastLine = null;

CodeLines.suppressSpace = false;
CodeLines.indent = 0;
// Outputs an object into the simulation to be seen by the user.
CodeLines.OUT = function (x) {
	if (x === '$') {
		CodeLines.suppressSpace = true;
		return;
	}
	if (x.type === 'break') {
		CodeLines.lastLine = document.createElement('div');
		CodeLines.lastLine.style.paddingLeft = 4 * CodeLines.indent * CodeLines.CHAR + 'px';
		CodeLines.lastLine.className = 'line';
		CodeLines.lines.push(CodeLines.lastLine);
		codeblocks.appendChild(CodeLines.lastLine);
		CodeLines.suppressSpace = true;
		return { delay: (Math.random() * 4 + 1) * CodeLines.KEYPRESS, fun: function () { } };
	} else if (x.type === 'open') {
		CodeLines.indent++;
		return { delay: CodeLines.KEYPRESS, fun: function () { } };
	} else if (x.type === 'close') {
		CodeLines.indent--;
		return { delay: CodeLines.KEYPRESS, fun: function () { } };
	} else if (x.text) {
		if (!CodeLines.suppressSpace) {
			var space = document.createElement('span');
			space.className = 'space';
			space.style.width = (CodeLines.CHAR - CodeLines.MARGIN) + 'px';
			CodeLines.lastLine.appendChild(space);
		}
		CodeLines.suppressSpace = false;
		var span = document.createElement("span");
		span.className = x.kind;
		span.style.width = '0';
		CodeLines.lastLine.appendChild(span);
		var c = 0;
		var a;
		a = {
			delay: CodeLines.KEYPRESS,
			fun: function () {
				span.style.width = (c * CodeLines.CHAR - CodeLines.MARGIN) + 'px';
				c++;
				a.delay = (Math.random() + 0.5) * CodeLines.KEYPRESS;
				if (c <= x.width) {
					return a;
				}
			}
		};
		return a;
	}
}

// Execute one thing on the stack. Returns an Animation if something needs to
// be shown.
CodeLines.stepBlocks = function () {
	var top = CodeLines.stack.pop();
	if (top === undefined) {
		CodeLines.stack = ["block", Break(), Break(), Break(), Break(), Break()];
		return; // done!
	}
	if (top instanceof Array) {
		if (top.length === 0) {
			return; // done!
		}
		var after = top.slice(1);
		CodeLines.stack.push(after);
		CodeLines.stack.push(top[0]);
	} else if (typeof top === 'string') {
		if (top === '$') {
			return CodeLines.OUT(top);
		}
		if (top[0] === '$') {
			CodeLines.stack.push(['$', top.substr(1)]);
			return;
		}
		if (top[top.length - 1] === '$') {
			CodeLines.stack.push([top.substr(0, top.length - 1), '$']);
			return;
		}
		if (grammar[top]) {
			CodeLines.stack.push(grammar[top]);
		} else {
			return CodeLines.OUT(top);
		}
	} else if (typeof top === 'function') {
		CodeLines.stack.push(top());
	} else {
		return CodeLines.OUT(top);
	}
}

CodeLines.animation = null;
CodeLines.blockTypingUntil = 0;

// Update the simulating coding
CodeLines.animateBlocks = function () {
	while (!CodeLines.animation) {
		CodeLines.animation = CodeLines.stepBlocks();
	}
	setTimeout(function () {
		// Pause until the (old) blocker
		// XXX: untangle this
		// This prevents typing while deleting lines is happening
		// (which is necessary to look smooth, not for correctness)
		let blocked = Math.max(0, CodeLines.blockTypingUntil - Date.now());
		setTimeout(function () {
			CodeLines.animation = CodeLines.animation.fun();
			CodeLines.animateBlocks();
		}, blocked);
	}, CodeLines.animation.delay);
}

// "Scroll down" to avoid ever filling the whole page with code
CodeLines.clearLines = function () {
	var kill = Math.random() * CodeLines.lines.length * 1 / 2;
	for (var i = 0; i < kill; i++) {
		setTimeout(function () {
			if (CodeLines.lines.length > 0) {
				codeblocks.removeChild(CodeLines.lines[0]);
				CodeLines.lines = CodeLines.lines.slice(1);
			}
		}, i * 200 + Math.random() * 400);
	}
	setTimeout(CodeLines.clearLines, Math.random() * 10000);

	CodeLines.blockTypingUntil = Date.now() + kill * 200 + 400;
}

////////////////////////////////////////////////////////////////////////////////

CodeLines.clearLines();
CodeLines.animateBlocks();
