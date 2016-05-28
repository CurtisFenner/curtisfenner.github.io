Bismuth / Examples

# Bismuth Examples

## Fizz-Buzz

```draft
func main ! IO -> Unit {
	for i : Int in 1 ... 100 {
		if i % 3 == 0 and i % 5 == 0 {
			log "FizzBuzz" !;
		} elseif i % 3 == 0 {
			log "Fizz" !;
		} elseif i % 5 == 0 {
			log "Buzz" !;
		} else {
			log i !;
		}
	}
}
```

## Binary Search

## Factorial

## Palindrome

## Sort the lines in a file by number
