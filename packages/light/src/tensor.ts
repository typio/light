type Rank1To6Array = number[] | number[][] | number[][][] | number[][][][] | number[][][][][] | number[][][][][][]

const calcShape = (values: Rank1To6Array): number[] => {
    let shape: number[] = []
    let subValues: Rank1To6Array | number = values
    while (Array.isArray(subValues)) {
        shape.push(subValues.length)

        subValues = subValues[0]
    }
    return shape
}

const flatLengthFromShape = (shape: number[]): number => {
    return shape.reduce((previousValue, currentValue) => previousValue * currentValue, 1)
}

const toNested = (values: number[], shape: number[]): any => {
    // thank you https://stackoverflow.com/a/69584753/6806458

    if (flatLengthFromShape(shape) !== values.length)
        throw new Error("New shape is not compatable with initial value length.")

    let elementI = 0

    const nest = (shapeI: number) => {
        let result: any = []
        if (shapeI === shape.length - 1) {
            result = result.concat(values.slice(elementI, elementI + shape[shapeI]))
            elementI += shape[shapeI]
        } else {
            for (let i = 0; i < shape[shapeI]; i++) {
                result.push(nest(shapeI + 1))
            }
        }
        return result
    }
    return nest(0)
}

class Tensor {
    readonly values: Float32Array
    readonly rank: number
    readonly shape: number[]

    constructor(values: number | Rank1To6Array, shape?: number[]) {
        if (values !== undefined && shape === undefined) {
            if (!Array.isArray(values)) {
                // if scalar
                values = [values] // store scalar number as number[]
                this.shape = [1]
                this.rank = 0
            } else {
                this.shape = calcShape(values)
                this.rank = this.shape.length
            }
            let flatValues = values.flat(5)
            this.values = new Float32Array(flatValues)
        } else if (values !== undefined && shape !== undefined) {
            if (Array.isArray(values[0]))
                throw new Error('If shape is given, values must be flat array, e.g. [1, 2, 3].')

            // @ts-ignore flatValues will always be number[]
            let flatValues: number[] = values

            if (flatLengthFromShape(shape) !== flatValues.length) throw new Error("Values don't fit into shape.")

            this.shape = shape
            this.rank = shape.length
            this.values = new Float32Array(flatValues)
        }
    }

    /** return nested tensor values */
    getNested() {
        return toNested((Array.from(this.values)), this.shape)
    }

    /** return flat tensor values */
    getFlat() {
        return Array.from(this.values)
    }

    /** console.log nested tensor values */
    print() {
        console.log(JSON.stringify(this.getNested()))
    }

    /** Reshape tensor into provided shape */
    reshape(shape: number[]) {
        return new Tensor(Array.from(this.values), shape)
    }

    // mul(n: number) {

    // }

    // dot(tensor: Tensor) {
    //     if (this.rank !== 2 || tensor.rank !== 2)
    //         throw new Error
    // }
}

/**
 * Pass a value
 * ```ts
 * scalar(4)
 * ```
 */
export const scalar = (value: number) => {
    return new Tensor(value)
}

/**
 * Pass a nested array
 * ```ts
 * tensor([[[1, 2, 3]]])
 * ```
 * Or pass a flat array and a shape
 * ```ts
 * tensor([1, 2, 3, 4], [2, 2])
 * ```
 */
export const tensor = (values: number | Rank1To6Array, shape?: number[]) => {
    return new Tensor(values, shape)
}

/**
 * Pass array of row number and column number
 * ```ts
 * eye([2, 2])
 * ```
 * Or a number for both
 * ```ts
 * eye(2); eye([2])
 * ```
 */
export const eye = (dim: number[] | number, offset?: number) => {
    let rowN: number, colN: number
    if (typeof dim === 'number') {
        dim = [dim]
    }
    rowN = dim[0]
    if (dim.length === 1)
        colN = dim[0]
    else
        colN = dim[1]

    let idx = offset ?? 0
    let values = new Array(rowN * colN).fill(0)
    while (idx < rowN * colN) {
        values[idx] = 1
        idx += colN + 1
    }

    return new Tensor(values, [rowN, colN])
}

/**
 * Pass shape of matrix
 * ```ts
 * random([2, 2])
 * ```
 * And optionally min (inclusive), max (exclusive), and integer
 * ```ts
 * random([2, 2], 0, 10, true)
 * ```
 */
export const random = (shape: number[], min?: number, max?: number, integer?: boolean) => {
    if ((min !== undefined && max === undefined) || (max !== undefined && min === undefined))
        throw new Error('Must have either both min and max params or neither.')

    if (min !== undefined && max !== undefined)
        if (integer)
            return new Tensor(
                Array.from({ length: flatLengthFromShape(shape) }, () => Math.floor(Math.random() * (max - min) + min)),
                shape
            )
        else
            return new Tensor(
                Array.from({ length: flatLengthFromShape(shape) }, () => Math.random() * (max - min) + min),
                shape
            )

    return new Tensor(
        Array.from({ length: flatLengthFromShape(shape) }, () => Math.random()),
        shape
    )
}

/**
 * Pass shape of matrix
 * ```ts
 * fill([2, 2], 1)
 * ```
 */
export const fill = (shape: number[], value: number) => {
    return new Tensor(new Array(flatLengthFromShape(shape)).fill(value), shape)
}

export const zeroes = (shape: number[]) => {
    return fill(shape, 0)
}

export const ones = (shape: number[]) => {
    return fill(shape, 1)
}