struct Matrix {
    s: vec4<f32>,
    v: array<f32>
};

@group(0) @binding(0) var<storage, read> a: Matrix;
@group(0) @binding(1) var<storage, read> n:  f32;
@group(0) @binding(2) var<storage, read> flag: u32;
@group(0) @binding(3) var<storage, read_write> o:  Matrix;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    o.s = a.s;

    if global_id.x > u32(max(1., o.s.x) * max(1., o.s.y) * max(1., o.s.z) * max(1., o.s.w)) {
        return;
    }

    let i = global_id.x;

    switch flag {
      case 0u: { // log
            o.v[i] = log(a.v[i]) / log(n);
      }
      case 1u: { // pow
            o.v[i] = pow(a.v[i], n);
      }
      case 2u: { // applyMax
            o.v[i] = max(a.v[i], n);
      }
      case 3u: { // applyMax
            o.v[i] = min(a.v[i], n);
      }
      case 4u: { // exp
            o.v[i] = pow(n, a.v[i]);
      }
      default: {
            o.v[i] = a.v[i];
        }
  }
}

