Bismuth

# Bismuth
Bismuth is a semi-functional statically-typed programming language.

The goal of Bismuth is to be an imperative language that uses the
advantages of functional purity and strong types to make writing
and testing correct code easy.

# Examples and the Compiler

I have implemented a compiled for Bismuth in Java.

Examples of Bismuth code can be found here.

#
## Effects and Actions
Functions in Bismuth are functionally pure by default. This guarantees a
function called with the same parameters will always produce the same result --
there is never any hidden state.

This means there's no "side-effects" of calling a function. Invoking a pure
function will change nothing about the rest of the world (there are no global
variables).

However, complete functional purity can obscure important, typical tasks like
IO and database calls.
Bismuth allows functions to break this purity when they explicitly state their
`effect`s.

An effect is a description of the impure aspects of a function. It describes the
interface that lets the function know about the outside world.

```draft
effect ReadInternet {
	func getArticle (url : URL) ! -> Article,
}
```

and also describe how the function modifies the outside world.

```draft
effect Log {
	func log (line:str) !,
}
```

A `service` defines an implementation of an effect.

```draft
service LogList impl Log {
	var q : Queue String = empty;

	func log (thing : String) ! {
		push @q thing;
	}
}
```

Effect actions are always invoked using a bang.

```
log "Hello" !
```

Program standard input/output is implemented as the `IO` effect. The handlers
for these effects are implemented in a foreign environment; the `main`
function declares the `IO` effect which gives it access to these.

```
func main ! IO -> Unit {
}
```

### Effects: TL;DR
+ functions pure by default -- no side-effects
+ never any hidden/global state
+ mutation is always explicit
+ all services automatically provide mockable interfaces

----

## Types and Traits

Bismuth is a strongly typed language. All variable declarations must explicitly
specify their type (it cannot be inferred).

```
var petName : String = "Mr. Whiskers";
```

### Generics

Types (both structs and enums, see below) can be generic over other types. Type
parameters are listed after the
type they are applied to. Here, `pets` is a `List` of `Pet` objects.

```
var pets : List Pet = empty;
```

Generic variables can be introduced in type and function definitions. For
example, here is a function that returns its second argument.

```
func [T] second (a : T) (b : T) -> T {
	return b;
}
```

### Traits

Types can also satisfy `trait`s. A trait is a common interface between different
types. For example, the `Orderable` trait allows the use of the `<` operator.

Here is a function that returns the least of its arguments.

```
func [T | Orderable T] min (a : T) (b : T) -> T {
	if a < b {
		return a;
	}
	return b;
}
```

The definition of `T` is read as "for T, such that T is Orderable".



----

## Data Structures: Enums, Structs, and Services

Bismuth has three types of compound data structures.

### Enums

An `enum` is an algebraic-data-types. They define an exhaustive sequence of
'patterns' that objects of that type may have.

For example, an "optional value type" can be defined as an enum.

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
			// A tree has the some of the value at this
			// node and the sums of the sub-trees.
			return value + sum left + sum right;
		}
	}
}
```

Notice that `sum` has no return after the `match`. Bismuth knows the match
against `tree` is exhaustive, so it knows that any code after the `match` cannot
be reached.

### Structs

A `struct` is a group of named fields. Their fields have names, unlike `enum`s.

For example, a person in a contact book could be defined as a struct.

```
struct Person {
	name : String,
	birth : Date,
	nickname : String,
	address : Location,
}
```

Members of structs can be read and assigned using the familiar `.field`
notation.

```
log johnDoe.name !; // -> "John Doe"

johnDoe.address = parse "123 Drury Lane";
```

Structs can also be destructured:

```draft
var Person{name = name, birth = someDate} = johnDoe;
// defines `name` and `someDate` variables
```

## Syntax

Bismuth uses curly braces to denote blocks and semicolons to mark the ends of
statements.

```
func main ! IO -> Unit {
	var a : Int = 5;
	a = a + 5;
}
```

Conditions in control statements do not need to be parenthesized.

```
if a < 10 {
	log a !;
}
```

Functions can be invoked in the standard C-style with parentheses and commas.

```
var x : T = fun(a, b+1, c+2);
```

Functions can also be invoked in Haskell style, with spaces marking partial
function application.

```
var x : T = fun a (b+1) (c+2);
```

Operators are formed by punctuation operators, excluding period, comma,
parentheses, braces, the colon, the at sign, single/double quotes, and the
backtick.

```
var foo = bar &*# baz;
```

Operators can also be formed by enclosing the name of a function in back-ticks.

```
var foo = bar `fizz` baz;
```

Comments are indicated using a double forward slash.

```
// This is a comment
```

The following is the syntax of Nickel, in BNF style notation. This is generated
by my implementation of the parser.

```
Program = Definition+

Definition = EnumDefinition
           | StructDefinition
           | FunctionDefinition

FunctionDefinition = `func`
                     Generics?
                     Name
                     ArgumentGroup*
                     FunctionEffects?
                     `->`
                     Type
                     Block

StructDefinition = `struct`
                   Name
                   Name*
                   `{`
                   StructField~","
                   `}`

StructField = Name
              `:`
              Type

Block = `{`
        Statement*
        `}`

Type = TypeResult~"->"

ArgumentGroup = `(`
                TypedName~","
                `)`

TypedName = Name
            `:`
            Type

Statement = ReturnStatement
          | IfStatement
          | ForStatement
          | VarStatement
          | AssignmentStatement
          | CallStatement

VarStatement = `var`
               Generics?
               TypedName
               `=`
               Expression
               `;`

IfStatement = `if`
              Expression
              Block
              ElseifClause*
              ElseClause?

ReturnStatement = `return`
                  Expression?
                  `;`

EnumDefinition = `enum`
                 Name
                 Name*
                 `{`
                 EnumField~","
                 `}`

CallStatement = CallExpression
                `;`

CallExpression = ExpressionAtom+

ElseifClause = `elseif`
               Expression
               Block

ElseClause = `else`
             Block

EnumField = Name
            TypeAtom*

Generics = `[`
           Name~","
           Constraints?
           `]`

ExpressionAtom = SimpleExpressionAtom
               | Variable

SimpleExpressionAtom = ParenedExpression
                     | StringLiteral
                     | NumberLiteral
                     | Bang

Variable = Reference
           Access*

Access = DotAccess
       | SubscriptAccess

DotAccess = `.`

ParenedExpression = `(`
                    Expression
                    `)`

SubscriptAccess = `[`
                  Expression
                  `]`

Constraints = `|`
              Constructor~","

Constructor = Name
              TypeAtom*

FunctionEffects = `!`
                  TypeResult~","

TypeResult = TypeAtom+

Expression = BinaryExpression

BinaryExpression = UnaryExpression
                   BinaryExpressionComponent*

UnaryExpression = UnaryOperator*
                  CallExpression

BinaryExpressionComponent = BinaryOperator
                            UnaryExpression

TypeAtom = ParenedType
         | Name

ParenedType = `(`
              Type
              `)`

ForStatement = `for`
               TypedName~","
               `in`
               Expression
               Block

AssignmentStatement = Variable
                      `=`
                      Expression
                      `;`

Reference = SimpleExpressionAtom
          | Name

Bang = `!`
NumberLiteral = ....
UnaryOperator = `not` | `~`
BinaryOperator = ....
StringLiteral = ....
Name = ....
```

## Testing

TODO

## Concurrency

TODO

## Packages

TODO
