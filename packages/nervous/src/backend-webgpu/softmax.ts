import softmaxWGSL from './softmax.wgsl?raw'
import { flatLengthFromShape } from '../tensorUtils'

import { gpuDevice } from '..'
import { Tensor } from '../tensor'

export const softmax = async (_a: Tensor, _dim?: number) => {
    let a = _a
    let dim = _dim === undefined ? 1 : _dim

    if (!a.usingGPUBuffer) a = await a.toGPU()

    const dimGPUBuffer = gpuDevice.createBuffer({
        mappedAtCreation: true,
        size: 32,
        usage: GPUBufferUsage.STORAGE,
    })
    new Uint32Array(dimGPUBuffer.getMappedRange()).set(new Uint32Array([dim]))
    dimGPUBuffer.unmap()

    let resSize = (4 + flatLengthFromShape(a.webGPUBufferShape)) * Float32Array.BYTES_PER_ELEMENT

    const resultGPUBuffer = gpuDevice.createBuffer({
        size: Math.max(32, resSize),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    })

    const bindGroupLayout = gpuDevice.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: 'read-only-storage',
                },
            },
            {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: 'read-only-storage',
                },
            },
            {
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: 'storage',
                },
            },
        ],
    })

    const computePipeline = gpuDevice.createComputePipeline({
        layout: gpuDevice.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout],
        }),
        compute: {
            module: gpuDevice.createShaderModule({
                code: softmaxWGSL,
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
                    buffer: dimGPUBuffer,
                },
            },
            {
                binding: 2,
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
    passEncoder.dispatchWorkgroups(Math.ceil(flatLengthFromShape(a.webGPUBufferShape) / 64))
    passEncoder.end()

    gpuDevice.queue.submit([commandEncoder.finish()])
    return new Tensor(resultGPUBuffer, a.webGPUBufferShape)
}
