import {wgsl} from 'wgsl-preprocessor/wgsl-preprocessor.js'

import { BinaryOp, Tensor } from '../tensor'
import { gpuDevice } from '../../..'
import { flatLengthFromShape, padShape } from '../tensorUtils'

export const elementwiseOP = async (_a: Tensor, _b: Tensor | number, flag: BinaryOp) => {
    let a = _a
    let b = _b.constructor === Tensor ? _b : new Tensor(_b as number)

    if (!a.usingGPUBuffer) a = a.toGPU()
    if (!b.usingGPUBuffer) b = b.toGPU()

    let aShape = padShape(a.webGPUBufferShape)
    let bShape = padShape(b.webGPUBufferShape)

    // 'Elementwise OPs only support (nd tensor and matching nd tensor, nd tensor and scalar, 2d matrix and row or column vector, and row or column vector on row or column vector).'
    const flagGPUBuffer = gpuDevice.createBuffer({
        mappedAtCreation: true,
        size: 32,
        usage: GPUBufferUsage.STORAGE,
    })
    new Uint32Array(flagGPUBuffer.getMappedRange()).set(new Uint32Array([flag]))
    flagGPUBuffer.unmap()

    let resShape = [
        Math.max(aShape[0], bShape[0]),
        Math.max(aShape[1], bShape[1]),
        Math.max(aShape[2], bShape[2]),
        Math.max(aShape[3], bShape[3]),
    ]

    let resSize = (4 + flatLengthFromShape(resShape)) * Float32Array.BYTES_PER_ELEMENT

    const resultGPUBuffer = gpuDevice.createBuffer({
        size: Math.max(32, resSize),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    })

    const computePipeline = gpuDevice.createComputePipeline({
        layout: 'auto',
        compute: {
            module: gpuDevice.createShaderModule({
                code: wgsl`
                    struct Matrix {
                        s: vec4<f32>,
                        v: array<f32>
                    };

                    @group(0) @binding(0) var<storage, read> a: Matrix;
                    @group(0) @binding(1) var<storage, read> b:  Matrix;
                    @group(0) @binding(2) var<storage, read> flag: u32;
                    @group(0) @binding(3) var<storage, read_write> o:  Matrix;

                    @compute @workgroup_size(64)
                    fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
                        o.s = vec4(max(a.s.x, b.s.x), max(a.s.y, b.s.y), max(a.s.z, b.s.z), max(a.s.w, b.s.w));

                      // this is unfortunate
                        if global_id.x > u32(max(1., o.s.x) * max(1., o.s.y) * max(1., o.s.z) * max(1., o.s.w)) {
                            return;
                        }

                        let lI = f32(global_id.x);

                      // var i = f32(lI) % o_s[3];
                      // var j = (f32(lI) / o_s[3]) % o_s[2];
                      // var k = (f32(lI) / (o_s[3] * o_s[2])) % o_s[1];
                      // var l = (f32(lI) / (o_s[3] * o_s[2] * o_s[1])) % o_s[0];

                    //   i = i % a_s[3];
                      // j = j % a_s[2];
                      // k = k % a_s[1];
                      // l = l % a_s[0];

                      // var aV: f32;
                      // let aI =  l * a_s[3] * a_s[2] * a_s[1] + k * a_s[2] * a_s[1] + j * a_s[1] + i ;

                      // let aI = lI % (a.s.w * (a.s.z / a_s.w));

                        var aV: f32;
                        var aI: u32;
                        if a.s.w <= 1 && a.s.z <= 1 {
                            aI = 0u;
                        } else if a.s.w <= 1 {
                            aI = u32(lI / o.s.w);
                        } else if a.s.z <= 1 {
                            aI = u32(lI % o.s.w);
                        } else {
                            aI = u32(lI);
                        }
                        aV = a.v[aI];


                        var bV: f32;
                        var bI: u32;
                        if b.s.w <= 1 && b.s.z <= 1 {
                            bI = 0u;
                        } else if b.s.w <= 1 {
                            bI = u32(lI / o.s.w);
                        } else if b.s.z <= 1 {
                            bI = u32(lI % o.s.w);
                        } else {
                            bI = u32(lI);
                        }
                        bV = b.v[bI];
                        bV = b.v[u32(bI)];
                      // A[i][j][k] = B + W *(M * N(i-x) + N *(j-y) + (k-z))

                        switch flag {
                          case 0u: {
                                o.v[u32(lI)] = aV + bV;
                            }
                          case 1u: {
                                o.v[u32(lI)] = aV - bV;
                            }
                          case 2u: {
                                o.v[u32(lI)] = aV * bV;
                            }
                          case 3u: {
                                o.v[u32(lI)] = aV / bV;
                            }
                          case 4u: {
                                o.v[u32(lI)] = aV % bV;
                            }
                          default: {
                                o.v[u32(lI)] = 0.;
                            }
                      }
                    }
                `,
            }),
            entryPoint: 'main',
        },
    })

    const bindGroup = gpuDevice.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: a.webGPUBuffer,
                },
            },
            {
                binding: 1,
                resource: {
                    buffer: b.webGPUBuffer,
                },
            },
            {
                binding: 2,
                resource: {
                    buffer: flagGPUBuffer,
                },
            },
            {
                binding: 3,
                resource: {
                    buffer: resultGPUBuffer,
                },
            },
        ],
    })

    const commandEncoder = gpuDevice.createCommandEncoder()
    const passEncoder = commandEncoder.beginComputePass()
    passEncoder.setPipeline(computePipeline)
    passEncoder.setBindGroup(0, bindGroup)
    passEncoder.dispatchWorkgroups(Math.ceil(flatLengthFromShape(resShape) / 64))
    passEncoder.end()

    gpuDevice.queue.submit([commandEncoder.finish()])


    return new Tensor(resultGPUBuffer, resShape)
}
