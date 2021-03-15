# A Catalog of Error Messages

## Assigning a number to a variable with an object type

TypeScript (tsc 4.1.3):

```
small.ts:1:7 - error TS2322: Type 'number' is not assignable to type 'URL'.

1 const t: URL = 5;
        ~
```

Java (javac 1.8):

```
.\Small.java:2: error: incompatible types: int cannot be converted to Thing
        Thing t = 5;
                  ^
```

C (gcc 5.4.0):

```
.\small.c:3:18: error: invalid initializer
 struct Thing t = 5;
                  ^
```

C (clang 3.8.1):

```
.\small.c:3:14: error: initializing 'struct Thing' with an expression of incompatible type 'int'
struct Thing t = 5;
             ^   ~
```

C++ (g++ 5.4.0):

```
.\small.c:3:18: error: conversion from 'int' to non-scalar type 'Thing' requested
 struct Thing t = 5;
                  ^
```

Haskell (ghci 8.6.5):

```
small.hs:4:11: error:
    * No instance for (Num Thing) arising from the literal `5'
    * In the expression: 5
      In an equation for `myThing': myThing = 5
  |
4 | myThing = 5
  |
```

Elm (Elm playground):

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

Rust (Rust playground 1.50.0):

```
error[E0308]: mismatched types
  --> src/main.rs:11:20
   |
11 |     let t: Thing = 5;
   |            -----   ^ expected struct `Thing`, found integer
   |            |
   |            expected due to this
```

Go (Go 1.15.6):

```
.\small.go:7:5: cannot use 5 (type int) as type struct { myField string } in assignment
```

Scala (2.11.8):

```
.\small.scala:4: error: type mismatch;
 found   : Int(5)
 required: Thing
        var t: Thing = 5
                       ^
```
