declare const _default: {
    add: (a: import("../tensor").Tensor, b: number | import("../tensor").Tensor) => Promise<import("../tensor").Tensor>;
    applyMax: (a: import("../tensor").Tensor, n: number) => never;
    applyMin: (a: import("../tensor").Tensor, n: number) => never;
    argmax: (a: import("../tensor").Tensor, axis?: 0 | 1) => Promise<import("../tensor").Tensor>;
    argmin: (a: import("../tensor").Tensor) => never;
    diag: (values: number[]) => Promise<import("../tensor").Tensor>;
    div: (_a: import("../tensor").Tensor, _b: number | import("../tensor").Tensor) => Promise<import("../tensor").Tensor>;
    equals: (_a: import("../tensor").Tensor, _m: import("../tensor").Tensor) => Promise<Boolean>;
    exp: (a: import("../tensor").Tensor, base?: number) => never;
    eye: (dim: number | number[], offset?: number) => import("../tensor").Tensor;
    fNorm: (a: import("../tensor").Tensor) => never;
    fill: (_shape: number | number[], value: number) => Promise<import("../tensor").Tensor>;
    flatValues: (_a: import("../tensor").Tensor, decimals?: number) => Promise<number[]>;
    values: (_a: import("../tensor").Tensor, decimals?: number) => Promise<number | any[]>;
    rank: (a: import("../tensor").Tensor) => number;
    repeat: (_a: import("../tensor").Tensor, _scales: number[]) => Promise<import("../tensor").Tensor>;
    shape: (a: import("../tensor").Tensor) => number[];
    getmax: (a: import("../tensor").Tensor, axis?: 0 | 1) => never;
    getmin: (a: import("../tensor").Tensor, axis?: 0 | 1) => never;
    gradientReLU: (a: import("../tensor").Tensor) => never;
    log: (_a: import("../tensor").Tensor, base: number) => Promise<import("../tensor").Tensor>;
    lpNorm: (a: import("../tensor").Tensor, p?: number) => number;
    matmul: (_a: import("../tensor").Tensor, _m: import("../tensor").Tensor) => Promise<import("../tensor").Tensor>;
    mean: (a: import("../tensor").Tensor) => number;
    minus: (_a: import("../tensor").Tensor, _b: number | import("../tensor").Tensor) => Promise<import("../tensor").Tensor>;
    mod: (_a: import("../tensor").Tensor, _b: number | import("../tensor").Tensor) => Promise<import("../tensor").Tensor>;
    mul: (_a: import("../tensor").Tensor, _b: number | import("../tensor").Tensor) => Promise<import("../tensor").Tensor>;
    oneHot: (dim: number | number[], index: number | number[]) => never;
    ones: (shape: number | number[]) => Promise<import("../tensor").Tensor>;
    pow: (a: import("../tensor").Tensor, exp: number) => never;
    print: (t: any, decimals: any) => Promise<void>;
    random: (shape: number[], seed?: number, min?: number, max?: number, integer?: boolean) => Promise<import("../tensor").Tensor>;
    randomNormal: (shape: number[], mean?: number, std?: number) => never;
    reLU: (a: import("../tensor").Tensor) => never;
    reshape: (a: import("../tensor").Tensor, shape: number[]) => never;
    scalar: (value: number) => import("../tensor").Tensor;
    sigmoid: (a: import("../tensor").Tensor) => never;
    softmax: (_a: import("../tensor").Tensor, _dim?: number) => Promise<import("../tensor").Tensor>;
    softplus: (a: import("../tensor").Tensor) => never;
    sum: (a: import("../tensor").Tensor, axis?: 0 | 1) => Promise<import("../tensor").Tensor>;
    tensor: (values: number | import("../tensor").Rank1To4Array, shape?: number[]) => import("../tensor").Tensor;
    trace: (a: Tensor) => never;
    transpose: (_a: import("../tensor").Tensor) => Promise<import("../tensor").Tensor>;
    toGPU: (a: import("../tensor").Tensor) => Promise<import("../tensor").Tensor>;
    toJS: (a: import("../tensor").Tensor) => Promise<import("../tensor").Tensor>;
    zeros: (shape: number | number[]) => Promise<import("../tensor").Tensor>;
};
export default _default;
