import re

op_map = {"op0": [31, 4], "op1": [26, 1], "op2": [24, 2], "op3": [21, 6], "op4": [11, 2]}
op_offsets = list(op_map.values())
op_names = list(op_map.keys())

lines = """
0x00	0	00	1xxxxx	xx	Compare and swap pair
0x00	1	00	000000	xx	Advanced SIMD load/store multiple structures
0x00	1	01	0xxxxx	xx	Advanced SIMD load/store multiple structures (post-indexed)
0x00	1	0x	1xxxxx	xx	UNALLOCATED
0x00	1	10	x00000	xx	Advanced SIMD load/store single structure
0x00	1	11	xxxxxx	xx  Advanced SIMD load/store single structure (post-indexed)
0x00	1	x0	x1xxxx	xx	UNALLOCATED
0x00	1	x0	xx1xxx	xx	UNALLOCATED
0x00	1	x0	xxx1xx	xx	UNALLOCATED
0x00	1	x0	xxxx1x	xx	UNALLOCATED
0x00	1	x0	xxxxx1	xx	UNALLOCATED
1101	0	1x	1xxxxx	xx	Load/store memory tags
1x00	0	00	1xxxxx	xx	Load/store exclusive pair
1x00	1	xx	xxxxxx	xx  UNALLOCATED
xx00	0	00	0xxxxx	xx	Load/store exclusive register
xx00	0	01	0xxxxx	xx	Load/store ordered
xx00	0	01	1xxxxx	xx	Compare and swap
xx01	0	1x	0xxxxx	00	LDAPR/STLR (unscaled immediate)
xx01	x	0x	xxxxxx	xx  Load register (literal)
xx01	x	1x	0xxxxx	01	Memory Copy and Memory Set
xx10	x	00	xxxxxx	xx  Load/store no-allocate pair (offset)
xx10	x	01	xxxxxx	xx  Load/store register pair (post-indexed)
xx10	x	10	xxxxxx	xx  Load/store register pair (offset)
xx10	x	11	xxxxxx	xx  Load/store register pair (pre-indexed)
xx11	x	0x	0xxxxx	00	Load/store register (unscaled immediate)
xx11	x	0x	0xxxxx	01	Load/store register (immediate post-indexed)
xx11	x	0x	0xxxxx	10	Load/store register (unprivileged)
xx11	x	0x	0xxxxx	11	Load/store register (immediate pre-indexed)
xx11	x	0x	1xxxxx	00	Atomic memory operations
xx11	x	0x	1xxxxx	10	Load/store register (register offset)
xx11	x	0x	1xxxxx	x1	Load/store register (pac)
xx11	x	1x	xxxxxx	xx  Load/store register (unsigned immediate)
"""

lines = [re.split(r"\s", line, len(op_offsets)) for line in filter(bool, lines.split("\n"))]
# pprint(lines)

ZEROS = list("00000000000000000000000000000000")

for line_i, line in enumerate(lines):
    mask = ZEROS.copy()
    val = ZEROS.copy()
    for i, m in enumerate(line[: len(op_offsets)]):
        shift = op_offsets[i][0] - op_offsets[i][1] + 1
        _mask = ["0" if c == "x" else "1" for c in m]
        _val = ["0" if c == "x" else c for c in m]
        # _mask.extend(ZEROS[0:shift])
        # _val.extend(ZEROS[0:shift])
        mask[31-op_offsets[i][0]:31-op_offsets[i][0]+len(_mask)] = _mask
        val[31-op_offsets[i][0]:31-op_offsets[i][0]+len(_val)] = _val
    # print(("".join(mask)), ("".join(val)))
    mask = "".join(mask)
    val = "".join(val)
    if line_i > 0:
        print("} else ", end="")
    print(f"if inst & 0b{mask} == 0b{val}" + ' {')
    print(f"\tTODO_INST!(\"{line[-1].strip()}\")")
    if line_i == len(lines)-1:
        print("}")
    # exit(0)
    # for op, [start, l] in operands.items():

    #     print(op, start, l)

