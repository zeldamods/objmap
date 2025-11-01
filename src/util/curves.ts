
function range(n: number): number[] {
  return [...Array(n)].map((item: any, index: number) => index);
}

// Calculate Bezier coefficients: A row of Pascal's Triangle
function bezierCoeff(n: number): number[] {
  let row = Array(n + 1).fill(0);
  row[0] = 1;
  for (let i = 0; i <= n; i++) {
    for (let j = i; j > 0; j--) {
      row[j] += row[j - 1];
    }
  }
  return row;
}

// dot-product
function dot(a: number[], b: number[]): number {
  let x = 0;
  for (let i = 0; i < a.length; i++) {
    x += a[i] * b[i];
  }
  return x;
}

// Point addition
function ptAdd(a: number[], b: number[]): number[] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

// Bezier Curve
//
// B(t) =  \Sum_{i=0}^{n} coeff(i,n) (1 - t)^{n-i} t^i P_i
//
// n = Number of points - 1 ; (n is inclusive)
// All segments are divided into 36 segments, t = 0 to 1 ; dt = 1/36
// Curve construction is performed on all components [x,y,z]
//
function bezier(pts: any) {
  let steps = 4;
  let out = [];
  let n = pts.length;
  if (n == 2) {
    return pts;
  }
  {
    let dx = pts[0][0] - pts.at(-1)[0]
    let dz = pts[0][0] - pts.at(-1)[0]
    let dist = Math.sqrt(dx * dx + dz * dz)
    steps = Math.max(steps, Math.floor(dist / 10) + 1)
  }

  const coeff = bezierCoeff(n - 1);
  let t0 = 0;
  let dt = 1.0 / (steps - 1);
  let xi = pts.map((p: any) => p[0]);
  let yi = pts.map((p: any) => p[1]);
  let zi = pts.map((p: any) => p[2]);
  for (let k = 0; k < steps; k++) {
    const t = t0 + k * dt;
    const ti = range(n).map((i: number) => coeff[i] * Math.pow(1.0 - t, n - 1 - i) * Math.pow(t, i));
    let pt = [dot(ti, xi), dot(ti, yi), dot(ti, zi)];
    out.push(pt);
  }
  return out;
}

// Linear Rail path without any Control Points
function railPathLinear(rail: any): any {
  let pts = rail.RailPoints.map((pt: any) => pt.Translate);
  if (rail['IsClosed']) {
    pts.push(pts[0])
  }
  return pts;
}

// Bezier Path with Control Points
// Each true is assumed to have two control points associated with it
// The 2nd [1] control point builds the curve towards the next distinct point
// The 1st [0] control point builds the curve towards the previous distinct point
//
//       b1 ____ c0
//         /    \
//  a     b      c     d
//   \___/        \___/
// a1    b0      c1    d0
//
//  Points: a, b, c, d
//  Control points: a1, b0, b1, c0, c1, d0
//
//  Loop over sections of the bezier curve
//   - Build: [b, b+b1, c+c0, c] that is passed to bezier()
//   - Append bezier() output to the curve
//  If the curve is closed, the the first point as a last point
//  If the curve is open, do not use the last point as a curve starting point
//
function railPathBezier(rail: any): any {
  let out = [];
  let n = rail.RailPoints.length;
  if (!rail['IsClosed']) {
    n -= 1;
  }

  for (let i = 0; i < n; i++) {
    let j = (i + 1);
    if (rail['IsClosed']) {
      j = j % n;
    }
    let p0 = rail.RailPoints[i].Translate;
    let p1 = rail.RailPoints[j].Translate;
    let bez = [p0];
    if (rail.RailPoints[i].ControlPoints) {
      bez.push(ptAdd(p0, rail.RailPoints[i].ControlPoints[1]));
    }
    if (rail.RailPoints[j].ControlPoints) {
      bez.push(ptAdd(p1, rail.RailPoints[j].ControlPoints[0]));
    }
    bez.push(p1);
    out.push(...bezier(bez))
  }
  return out;
}

export function railPath(rail: any): any {
  if (rail.RailType == "Linear") {
    return railPathLinear(rail);
  } else if (rail.RailType == "Bezier") {
    return railPathBezier(rail);
  }
  return null;
}
