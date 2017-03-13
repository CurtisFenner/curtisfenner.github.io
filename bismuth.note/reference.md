Bismuth Reference

# Bismuth Reference

Bismuth is a purely-functional statically-typed imperative programming language.

# Programs
TODO

## Program Comments
The sequence `//` marks the beginning of a comment. The comment ends at the next
ASCII new line. The contents, location, and presence of comments are ignored by
Bismuth.

# Types
A type describes the class of values that an expression of that type may take
on.

## Simple Types
A simple type is a name followed by zero or more type arguments to that name.

For example, `Integer` is a simple type. `List[Integer]` is a simple type.

## Function Types
A function type is two or more type atoms delimited by `->`. For example,
`Integer -> String` describes a function that produces a `String` after being
given an `Integer`.

The arrow `->` is right-associative. Thus `A -> B -> C` is equivalent to
`A -> (B -> C)`.

## Effect Types
A function the requires an effect `!` so that the function can have and
interpret side-effects looks like this: `! EffectName -> Result`.

Thus the type of an integer-logging function might be written as
`Integer -> ! Logger[Integer] -> Unit`.

DRAFT:
A special shorthand, `! EffectName` is equivalent to `! EffectName -> Unit`.

What follows the `!` is a comma delimited sequence of zero-or-more effects,
which are parsed as simple-types.

Except in the definition of an effect-action, at least one effect must be
specified in all effect types.

# Expressions

An expression represents a procedure producing a single value.

An expression is called **pure** if it does use any `!` atom and does not
use any `@` name.

An expression is called **effectful** if it uses any `!` atom.

## Expression Atoms
There are several expression atoms in Bismuth.

+ Number literals like `158`, `0x16`, `-20.3`.
	+ (TODO) The type of an integer literal is `I64`.
	+ (TODO) The type of a decimal literal is `Double`.
+ String literals like `"foo"`.
	+ These begin and end with an ASCII double quote `"`.
	+ An ASCII backslash `\` can be used to escape several characters.
	For example, `"\"\\\""` is a string literal presenting a double-quote
	followed by a backslash followed by a double-quote.
	+ (TODO) The type of a string literal is `String`.
+ Names like `foo`, `Bar`, `_baz123`.
	+ A name is made up of the ASCII characters
	`a` to `z`, `A` to `Z`, `0` to `9`, and `_`. Names must not begin with a
	digit.
	+ A name may be preceded by an `@` for use in expression-statements.
	+ The type of a name is the type of the variable, parameter, function,
		action, or trait function that the name refers to.
+ The special atom `!` or `! using foo` or `! using (foo, bar)` which is only
	valid as an argument in a function application.
	+ This atom does not have a type.

## Function Application Expressions

Function application is a left-associative operation applied to all adjacent
expression atoms. For example, `a b c d` is equivalent to `((a $ b) $ c) $ d`
where `$` denotes function application as a binary operator.

The order of evaluation of arguments to a function is unspecified; the arguments
are evaluated before the function is executed.

As a result, it is an error to have several effectful arguments in a single
function-application expression.

```
// invalid:
add (get!) (get!)

// valid:
put (get!) !

// valid:
foo (bar (baz!)!) !
```

For an application `fun arg`, `fun` must have a type of the form `A -> B`.

`arg` must have the type `A`. The expression `fun arg` has the type `B`.

## Operators

Operators are assigned an associativity (`left`, `right`, or `neither`) and a
precedence relative to other operators.

Operators are formed in two ways.
+ An operator can be formed using one or more consecutive characters from the
	set of the ASCII symbols `#$%^&*-+=|<>/?.`, with the exception of `=`, `.`,
	and `->`,
	and any which contain the sequence `//` (since this would begin a comment).
	These are introduced as aliases to
	trait functions using the `operator` keyword. Examples include `+`, `==`,
	and `>=`.
+ An operator can be formed by enclosing a name in the ASCII backtick symbol,
	for example `` `foo` ``. These operators are lower precedence than operators of
	the other form and non-associative.

An error is produced if an expression is ambiguous. An expression may be
ambiguous for several reasons:

+ A non-associative operator is used several times; for example `a == b == c`
+ The precedence of one operator over another cannot be determined; for example
	``a `foo` b `bar` c``.

The order of execution of the parameters to an operator is not defined
(see Function Application Expressions).

It is an error to have more than one effectful call as an in a single
expression:

```
// invalid
get! + get!
```

# Statements
Statements come in several forms.

## Variable-Declaration Statements
A variable is declared by specifying the name of the variable and the variable's
type.

```
var name: Type;
```

The name is in scope immediately following the declaration statement and for the
remainder of the enclosing block.

Variable declarations may optionally specify the initial value of the variable:

```
var name: Type = value;
```

A variable must be assigned to before its first use.

## Variable Assignment Statements
A variable is assigned to by specifying its name and the new value for the
variable to take on.

```
name = value;
```

## Expression Statements
An expression statement is an expression which has some side-effect. The
side-effect may be a top-level effectful function:

```
log foo !;
```

Or it may be an expression that uses an `@` name. An expression-statement using
`@foo` assigns the resulting value to `foo`.

For example, the following two statements are equivalent:

```
foo = foo + bar;
@foo + bar;
```

# Blocks and Control Statements

## Blocks
A block is a sequence of statements to be executed in order, from first to last.

A block begins with an ASCII curly brace `{` and ends with an ASCII curly brace
`}`.

## If Clauses
An `if` clause conditionally executes a block.

It is formed by an `if` followed by a pure expression called the condition and a
block. The condition must be of type `Boolean`.

The block is executed only when the condition evaluates to `True`.


## Elseif Clauses
An `if` clause may be immediately followed by an `elseif` clause. An `elseif`
clause may also follow another `elseif` clause.

An `elseif` clause is formed by the keyword `elseif` followed by a pure
expression called the condition and a block. The condition must be of type
`Boolean`.

An elseif clause is only executed when the condition in each preceding `if` and
`elseif` clauses evaluated to `False`.

## Else Clauses
An `else` clause may immediately follow an `if` clause or an `elseif` clause.

An `else` clause is formed by the keyword `else` followed by a block.

The block is executed when the condition in each preceding `if` and `elseif`
clause evaluated to `False`.

## For Clause
A `for` clause repeatedly executes a block with different elements produced by
an iterator.

```draft
for name:A, name:B in iterable {
	// body
}
```

The `iterable` must be of type `Iterable[(A, B)]`.

TODO

# Builtins
The following functions and data types are built into the language:

TODO
```