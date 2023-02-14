	.global fmt2
fmt2:	.string	"Yayyyyyyyy %d asdasd\n"

	.balign 4
otherfunc:	
	
	// stp	x29, x30, [sp, -16]!
	mov	x29, sp
	
	// Body of toerhfunc function
	mov	x2, 1

	mov	x0, 0
	// ldp	x29, x30, [sp], 16
	ret
	