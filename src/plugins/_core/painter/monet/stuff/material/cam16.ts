// Material Color Utilities - CAM16
// https://github.com/material-foundation/material-color-utilities

import { lerp, linearized, signum, whitePointD65, yFromLstar } from "./utils";

export class ViewingConditions {
    static DEFAULT = ViewingConditions.make();

    static make(
        whitePoint = whitePointD65(),
        adaptingLuminance = ((200.0 / Math.PI) * yFromLstar(50.0)) / 100.0,
        backgroundLstar = 50.0,
        surround = 2.0,
        discountingIlluminant = false,
    ): ViewingConditions {
        const xyz = whitePoint;
        const rW = xyz[0] * 0.401288 + xyz[1] * 0.650173 + xyz[2] * -0.051461;
        const gW = xyz[0] * -0.250268 + xyz[1] * 1.204414 + xyz[2] * 0.045854;
        const bW = xyz[0] * -0.002079 + xyz[1] * 0.048952 + xyz[2] * 0.953127;
        const f = 0.8 + surround / 10.0;
        const c = f >= 0.9
            ? lerp(0.59, 0.69, (f - 0.9) * 10.0)
            : lerp(0.525, 0.59, (f - 0.8) * 10.0);
        let d = discountingIlluminant
            ? 1.0
            : f * (1.0 - (1.0 / 3.6) * Math.exp((-adaptingLuminance - 42.0) / 92.0));
        d = d > 1.0 ? 1.0 : d < 0.0 ? 0.0 : d;
        const nc = f;
        const rgbD = [
            d * (100.0 / rW) + 1.0 - d,
            d * (100.0 / gW) + 1.0 - d,
            d * (100.0 / bW) + 1.0 - d,
        ];
        const k = 1.0 / (5.0 * adaptingLuminance + 1.0);
        const k4 = k * k * k * k;
        const k4F = 1.0 - k4;
        const fl = k4 * adaptingLuminance
            + 0.1 * k4F * k4F * Math.cbrt(5.0 * adaptingLuminance);
        const n = yFromLstar(backgroundLstar) / whitePoint[1];
        const z = 1.48 + Math.sqrt(n);
        const nbb = 0.725 / n ** 0.2;
        const ncb = nbb;
        const rgbAFactors = [
            ((fl * rgbD[0] * rW) / 100.0) ** 0.42,
            ((fl * rgbD[1] * gW) / 100.0) ** 0.42,
            ((fl * rgbD[2] * bW) / 100.0) ** 0.42,
        ];
        const rgbA = [
            (400.0 * rgbAFactors[0]) / (rgbAFactors[0] + 27.13),
            (400.0 * rgbAFactors[1]) / (rgbAFactors[1] + 27.13),
            (400.0 * rgbAFactors[2]) / (rgbAFactors[2] + 27.13),
        ];
        const aw = (2.0 * rgbA[0] + rgbA[1] + 0.05 * rgbA[2]) * nbb;
        return new ViewingConditions(n, aw, nbb, ncb, c, nc, rgbD, fl, fl ** 0.25, z);
    }

    private constructor(
        public n: number,
        public aw: number,
        public nbb: number,
        public ncb: number,
        public c: number,
        public nc: number,
        public rgbD: number[],
        public fl: number,
        public fLRoot: number,
        public z: number,
    ) {}
}

export class Cam16 {
    constructor(
        readonly hue: number,
        readonly chroma: number,
        readonly j: number,
        readonly q: number,
        readonly m: number,
        readonly s: number,
        readonly jstar: number,
        readonly astar: number,
        readonly bstar: number,
    ) {}

    static fromInt(argb: number): Cam16 {
        return Cam16.fromIntInViewingConditions(argb, ViewingConditions.DEFAULT);
    }

    static fromIntInViewingConditions(
        argb: number,
        viewingConditions: ViewingConditions,
    ): Cam16 {
        const red = (argb & 0x00ff0000) >> 16;
        const green = (argb & 0x0000ff00) >> 8;
        const blue = argb & 0x000000ff;
        const redL = linearized(red);
        const greenL = linearized(green);
        const blueL = linearized(blue);
        const x = 0.41233895 * redL + 0.35762064 * greenL + 0.18051042 * blueL;
        const y = 0.2126 * redL + 0.7152 * greenL + 0.0722 * blueL;
        const z = 0.01932141 * redL + 0.11916382 * greenL + 0.95034478 * blueL;

        const rC = 0.401288 * x + 0.650173 * y - 0.051461 * z;
        const gC = -0.250268 * x + 1.204414 * y + 0.045854 * z;
        const bC = -0.002079 * x + 0.048952 * y + 0.953127 * z;

        const rD = viewingConditions.rgbD[0] * rC;
        const gD = viewingConditions.rgbD[1] * gC;
        const bD = viewingConditions.rgbD[2] * bC;

        const rAF = ((viewingConditions.fl * Math.abs(rD)) / 100.0) ** 0.42;
        const gAF = ((viewingConditions.fl * Math.abs(gD)) / 100.0) ** 0.42;
        const bAF = ((viewingConditions.fl * Math.abs(bD)) / 100.0) ** 0.42;

        const rA = (signum(rD) * 400.0 * rAF) / (rAF + 27.13);
        const gA = (signum(gD) * 400.0 * gAF) / (gAF + 27.13);
        const bA = (signum(bD) * 400.0 * bAF) / (bAF + 27.13);

        const a = (11.0 * rA + -12.0 * gA + bA) / 11.0;
        const b = (rA + gA - 2.0 * bA) / 9.0;
        const u = (20.0 * rA + 20.0 * gA + 21.0 * bA) / 20.0;
        const p2 = (40.0 * rA + 20.0 * gA + bA) / 20.0;
        const atan2 = Math.atan2(b, a);
        const atanDegrees = (atan2 * 180.0) / Math.PI;
        const hue = atanDegrees < 0
            ? atanDegrees + 360.0
            : atanDegrees >= 360
                ? atanDegrees - 360.0
                : atanDegrees;
        const hueRadians = (hue * Math.PI) / 180.0;

        const ac = p2 * viewingConditions.nbb;
        const j = 100.0
            * (ac / viewingConditions.aw)
            ** (viewingConditions.c * viewingConditions.z);
        const q = (4.0 / viewingConditions.c)
            * Math.sqrt(j / 100.0)
            * (viewingConditions.aw + 4.0)
            * viewingConditions.fLRoot;
        const huePrime = hue < 20.14 ? hue + 360 : hue;
        const eHue = 0.25 * (Math.cos((huePrime * Math.PI) / 180.0 + 2.0) + 3.8);
        const p1 = (50000.0 / 13.0) * eHue * viewingConditions.nc * viewingConditions.ncb;
        const t = (p1 * Math.sqrt(a * a + b * b)) / (u + 0.305);
        const alpha = t ** 0.9 * (1.64 - 0.29 ** viewingConditions.n) ** 0.73;
        const c2 = alpha * Math.sqrt(j / 100.0);
        const m = c2 * viewingConditions.fLRoot;
        const s2 = 50.0
            * Math.sqrt((alpha * viewingConditions.c) / (viewingConditions.aw + 4.0));
        const jstar = ((1.0 + 100.0 * 0.007) * j) / (1.0 + 0.007 * j);
        const mstar = (1.0 / 0.0228) * Math.log(1.0 + 0.0228 * m);
        const astar = mstar * Math.cos(hueRadians);
        const bstar = mstar * Math.sin(hueRadians);

        return new Cam16(hue, c2, j, q, m, s2, jstar, astar, bstar);
    }

    static fromJchInViewingConditions(
        j: number,
        c: number,
        h: number,
        viewingConditions: ViewingConditions,
    ): Cam16 {
        const q = (4.0 / viewingConditions.c)
            * Math.sqrt(j / 100.0)
            * (viewingConditions.aw + 4.0)
            * viewingConditions.fLRoot;
        const m = c * viewingConditions.fLRoot;
        const alpha = c / Math.sqrt(j / 100.0);
        const s = 50.0
            * Math.sqrt((alpha * viewingConditions.c) / (viewingConditions.aw + 4.0));
        const hueRadians = (h * Math.PI) / 180.0;
        const jstar = ((1.0 + 100.0 * 0.007) * j) / (1.0 + 0.007 * j);
        const mstar = (1.0 / 0.0228) * Math.log(1.0 + 0.0228 * m);
        const astar = mstar * Math.cos(hueRadians);
        const bstar = mstar * Math.sin(hueRadians);
        return new Cam16(h, c, j, q, m, s, jstar, astar, bstar);
    }
}
