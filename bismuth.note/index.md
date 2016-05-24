Bismuth

# Bismuth
Bismuth is a semi-functional statically-typed programming language.

The goal of Bismuth is to be an imperative language that uses the
	advantages of functional purity and strong types to make writing
	and testing correct code easier.

#
## Effects and Actions
Functions in Bismuth are functionally pure by default. This guarantees a
function called with the same parameters will always produce the same result --
there is never any hidden state.

This means there's no "side-effects" of calling a function. Invoking a pure
function will change nothing about the rest of the world.

This is possible because Bismuth does not allow global variables or destructive
methods on objects.

However, this would make important tasks like IO and database calls cumbersome.
Bismuth allows functions to explicitly state their *effects*.

An effect is a description of the impure aspects of functions. It describes the
interface that lets the function know about the outside world:

```draft
effect GetConfig {
	func getWikipediaArticle (page : String) ! -> Article,
}
```

Effects also describe how the function modifies the outside world:

```draft
effect Log {
	func log (line:str) !,
}
```

A *service* defines implementations for an effect. Services are the only
instance in Bismuth that a function is allowed to modify a variable not defined
lexically within the function.

Services bear a strong resemblance to the classes of OOP.

```draft
service LogList impl Log {
	var q : Queue String = empty;

	func log (thing : String) ! {
		push @q thing;
	}
}
```

Effect actions are always invoked using a bang:

```
log "Hello" !
```

Program standard input/output is implemented as the `IO` effect. The handlers
for these effects are implemented in a foreign environment; the `main`
function declares the `IO` effect which gives it access to these.

## Effects: TL;DR
+ functions pure by default -- no side-effects
+ never any hidden/global state
+ mutation is always explicit
+ all services automatically provide mockable interfaces

#

## Data Structures: Enums, Structs, and Services

Bismuth has three types of compound data structures.

### Enums

*Enums* are algebraic-data-types. They define an exhaustive sequence of
'patterns' that objects of that type may have.

For example, an "optional value type" can be defined as an enum:

```
enum Optional T {
	Some T,
	Nil,
}
```

For example, `Some 5`, `Some 18`, and `Nil` are all instances of the
`Optional Int` type.

The fields in an enum constructor can't be named. An enum can be examined by
destructuring it.

```draft
// Read a line from standard-input and try to parse it as an integer
var num : Optional Int = parse (readLine !);

match num {
	Nil {
		// `parse` returned `Nil` (there was no number it could return)
		log "You didn't give a number"
	},
	Some x {
		// `parse` return Some number, `x`
		if x > 0 {
			log "positive" !;
		} else if x < 0 {
			log "negative" !;
		} else {
			log "zero" !;
		}
	},
}
```

Enums can also be used to easily build recursive data structures like trees.

```draft
enum Tree T {
	Node (Tree T) T (Tree T), // left, right
	Empty,                    // (parent is a leaf)
}

func sum (tree : Tree Int) -> Int {
	match tree {
		Empty {
			// An empty tree has a total sum of 0
			return 0;
		},
		Node left value right {
			// A tree has the some of the value at this node and the sums
			// of the sub-trees
			return value + sum left + sum right;
		}
	}
}
```

Notice that `sum` has no return after the `match`. Bismuth allows this because
it knows the match against `tree` was exhaustive.

### Structs

*Structs* are groups of named fields. Their fields don't have any order, but can
be easily pulled out by their identifier.

For example, a person in a contact book could be defined as a struct:

```
struct Person {
	name : String,
	birth : Date,
	nickname : String,
	address : Location,
}
```
