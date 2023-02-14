fmt:	.string	"Yayyyyyyyy %d asdasd\n"

	 .global main
	.balign 4
main:	
	// stp	x29, x30, [sp, -16]!
	// mov	x29, sp
	
	// Body of main function
	mov		x1, 1

loop:	
	ldr		x0, =fmt2
	bl		printf

	add		x1, x1, 1
	cmp		x1, 5
	b.lt	loop
	
exit:	mov	x0, 0
	// ldp	x29, x30, [sp], 16
	ret
	