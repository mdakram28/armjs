fmt:	.string	"Yayyyyyyyy %d asdasd\n"

		.global main
		.balign	4
main:	
	mov	x1, 1

loop:	
	ldr	x0, =fmt
	bl	printf

	add	x1, x1, 1
	b	loop