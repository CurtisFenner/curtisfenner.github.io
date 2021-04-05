# A Catalog of Error Messages

## Syntax - Unfinished braces in type definition

### TypeScript (tsc 4.2.3)

```
ts.ts:2:1 - error TS1005: '}' expected.

2
```

### Java

```
.\Java.java:1: error: reached end of file while parsing
class Java {
            ^
```

### C (gcc 5.4.0)

```
c.c:2:1: error: expected specifier-qualifier-list at end of input
 {
 ^
```

### C (clang 3.8.1)

```
c.c:2:2: error: expected '}'
{
 ^
c.c:2:1: note: to match this '{'
{
^
```

### C++ (g++ 5.4.0, std=c++11)

```
.\cpp.cpp:2:1: error: expected '}' at end of input
 {
 ^
```

### Haskell (ghc 8.6.5)

```
hs.hs:2:1: error:
    parse error (possibly incorrect indentation or mismatched brackets)
```

### Rust (rustc 1.43.0)

```
error: this file contains an unclosed delimiter
 --> .\rs.rs:2:2
  |
1 | struct Obj {
  |            - unclosed delimiter
2 |
  |     ^
```

### Go (go 1.15.6)

```
.\go.go:4:1: syntax error: unexpected EOF, expecting }
```

### Scala

```
.\scala.scala:1: error: '}' expected but eof found.
class Obj {
           ^
```

## Type Checking - Calling a function expecting one object type with an instance of another

### TypeScript

```
ts.ts:12:12 - error TS2345: Argument of type 'Beta' is not assignable to parameter of type 'Alpha'.
  Property 'alpha' is missing in type 'Beta' but required in type 'Alpha'.

12 needsAlpha(beta);
              ~~~~

  ts.ts:2:2
    2  alpha: "alpha",
       ~~~~~
    'alpha' is declared here.
```

### Java

```
.\Java.java:9: error: method needsAlpha in class Java cannot be applied to given types;
                needsAlpha(beta);
                ^
  required: Alpha
  found: Beta
  reason: argument mismatch; Beta cannot be converted to Alpha
```

### C (gcc 5.4.0)

```
c.c: In function 'bad':
c.c:15:13: error: incompatible type for argument 1 of 'needsAlpha'
  needsAlpha(beta);
             ^
c.c:10:6: note: expected 'Alpha {aka struct <anonymous>}' but argument is of type 'Beta {aka struct <anonymous>}'
 void needsAlpha(Alpha alpha) {}
      ^
```

### C (clang 3.8.1)

```
c.c:15:13: error: passing 'Beta' to parameter of incompatible type 'Alpha'
        needsAlpha(beta);
                   ^~~~
c.c:10:23: note: passing argument to parameter 'alpha' here
void needsAlpha(Alpha alpha) {}
                      ^
```

### C++ (g++ 5.4.0, std=c++11)

```
.\cpp.cpp: In function 'void bad()':
.\cpp.cpp:15:17: error: could not convert 'beta' from 'Beta' to 'Alpha'
  needsAlpha(beta);
                 ^
```

### Haskell (ghc 8.6.5)

```
hs.hs:11:18: error:
    * Couldn't match expected type `Main.Alpha'
                  with actual type `Main.Beta'
    * In the first argument of `Main.needsAlpha', namely `Main.beta'
      In the expression: Main.needsAlpha Main.beta
      In an equation for `Main.bad': Main.bad = Main.needsAlpha Main.beta
   |
11 | bad = needsAlpha beta
   |                  ^^^^
```

### Elm (Elm Playground)

```
-- TYPE MISMATCH ----------------------------------------------- Jump To Problem

The 1st argument to `needsAlpha` is not what I expect:

14| bad = needsAlpha beta
                     ^^^^
This `beta` value is a:

    Beta

But `needsAlpha` needs the 1st argument to be:

    Alpha
```

### Rust (rustc 1.43.0)

```
error[E0308]: mismatched types
  --> .\rs.rs:11:16
   |
11 |     needsAlpha(beta);
   |                ^^^^ expected struct `Alpha`, found struct `Beta`
```

### Go (go 1.15.6)

```
.\go.go:10:12: cannot use beta (type Beta) as type Alpha in argument to needsAlpha
```

### Scala

```
.\scala.scala:8: error: type mismatch;
 found   : Beta
 required: Alpha
        needsAlpha(beta)
                   ^
```

## Type Checking - Initializing a variable with an object type with a number literal

### TypeScript (tsc 4.1.3):

```
ts.ts:1:7 - error TS2322: Type 'number' is not assignable to type 'URL'.

1 const t: URL = 5;
        ~
```

### Java (javac 1.8):

```
.\Java.java:2: error: incompatible types: int cannot be converted to Thing
        Thing t = 5;
                  ^
```

### C (gcc 9.3.0):

```
.\c.c:3:18: error: invalid initializer
 struct Thing t = 5;
                  ^
```

### C (clang 3.8.1):

```
.\c.c:3:14: error: initializing 'struct Thing' with an expression of incompatible type 'int'
struct Thing t = 5;
             ^   ~
```

### C++ (g++ 5.4.0):

```
.\cpp.cpp:3:18: error: conversion from 'int' to non-scalar type 'Thing' requested
 struct Thing t = 5;
                  ^
```

### Haskell (ghci 8.6.5):

```
hs.hs:4:11: error:
    * No instance for (Num Thing) arising from the literal `5'
    * In the expression: 5
      In an equation for `myThing': myThing = 5
  |
4 | myThing = 5
  |
```

### Elm (Elm playground):

```
-- TYPE MISMATCH ----------------------------------------------- Jump To Problem

Something is off with the body of the `myThing` definition:

6| myThing = 5
             ^
The body is a number of type:

    number

But the type annotation on `myThing` says it should be:

    Thing
```

### Rust (Rust playground 1.50.0):

```
error[E0308]: mismatched types
  --> src/main.rs:11:20
   |
11 |     let t: Thing = 5;
   |            -----   ^ expected struct `Thing`, found integer
   |            |
   |            expected due to this
```

### Go (Go 1.15.6):

```
.\go.go:7:5: cannot use 5 (type int) as type struct { myField string } in assignment
```

### Scala (2.11.8):

```
.\scala.scala:4: error: type mismatch;
 found   : Int(5)
 required: Thing
        var t: Thing = 5
                       ^
```




# Observations

## Error IDs
Some compilers (tsc, rustc) consistently include an "ID" with each error. Most
do not.

## Code Excerpts
Most compilers "quote" an excerpt of the code surrounding the error. The notable
exception is the `go` compiler.

Excerpts in output apparently never include any context, only lines that are 
directly referenced by the error.

Compilers generally indicate a portion of the line with `^` or `~`, and
sometimes perform syntax highlighting.

Some compilers don't clearly render code snippets differently than the prose
output (e.g., gcc, javac, scala). Some do, but the style is done with colors and
so is lost in plaintext quotes (tsc). Most of the remainder set code to the side
of pipes `|` and line numbers.

## Grammatical Style

Some errors use full sentences. Most use a "statement of fact" style, but some
(Elm) explicitly use the first person:

* TypeScript
    > Argument of type 'Beta' is not assignable to parameter of type 'Alpha'.
* Java
    > method needsAlpha in class Java cannot be applied to given types;
* Elm
    > The 1st argument to \`needsAlpha\` is not what I expect:

Other errors use full phrases, with a missing "I" or "you" or "the 
compiler" subject:

* g++
    > (I) could not convert 'beta' from 'Beta' to 'Alpha'
* Haskell
    > (I) couldn't match expected type \`Main.Alpha\` with actual type 
    > \`Main.Beta\`
* go
    > (I/you) cannot use beta as type Alpha in argument to needsAlpha

Others use phrases missing subjects and articles to describe the "bad thing"
that was detected:

* gcc
    > (I discovered an) incompatible type for argument 1 of 'needsAlpha'
* clang
    > (I discovered you) passing 'Beta' to (a) parameter of incompatible
    > type 'Alpha'

Others use a short phrase, followed by additional information, possibly in a
structured form, instead of prose:

* rustc
    > (I discovered) mismatched types \
    > expected struct \`Alpha\`, found struct \`Beta\`
* scalac
    > (I discovered a) type mismatch; \
    > found   : Beta \
    > required: Alpha

The style isn't necessarily consistent between different errors in the same
compiler:

* TypeScript
    * Syntax error:
        > '}' expected.
    * Typechecking error:
        > Argument of type 'Beta' is not assignable to parameter of type 'Alpha'.
* Java
    * Syntax error:
        > reached end of file while parsing
    * Typechecking error:
        > method needsAlpha in class Java cannot be applied to given types;
