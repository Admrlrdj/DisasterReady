import { useEffect, useRef, useState } from 'react';

interface HydroAuroraCanvasProps {
    dark?: boolean;
    reducedMotion?: boolean;
}

const VERTEX_SHADER = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
    v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
    gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

// Exact GLSL port of DisasterReady Hydro-Aurora (Model A · Atmospheric Mist)
// Anisotropic vertical 6-octave FBM + 2-level domain warp, symmetric sq() envelopes
const FRAGMENT_SHADER = `
precision highp float;

varying vec2 v_uv;

uniform float u_time;
uniform float u_aspect;
uniform float u_isLight;
uniform vec2 u_mouse;
uniform float u_mouseStrength;
uniform vec3 u_ground;
uniform vec3 u_primary;
uniform vec3 u_accent;
uniform vec3 u_core;

float sq(float v) {
    return v * v;
}

float hash21(vec2 pIn) {
    vec2 p = fract(pIn * vec2(123.34, 456.21));
    p += dot(p, p + vec2(45.32));
    return fract(p.x * p.y);
}

float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u2 = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u2.x), mix(c, d, u2.x), u2.y);
}

float fbm6(vec2 pIn) {
    vec2 p = pIn;
    float total = 0.0;
    float amp = 0.5;
    mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
    for (int i = 0; i < 6; i++) {
        total += amp * vnoise(p);
        p = rot * p * 2.02 + vec2(17.13, 31.41);
        amp *= 0.5;
    }
    return total;
}

float domainWarp(vec2 p, float t) {
    vec2 q = vec2(
        fbm6(p + vec2(0.0, t * 0.12)),
        fbm6(p + vec2(5.2, 1.3 - t * 0.09))
    );
    vec2 r = vec2(
        fbm6(p + 2.4 * q + vec2(1.7 + t * 0.07, 9.2)),
        fbm6(p + 2.4 * q + vec2(8.3, 2.8 - t * 0.06))
    );
    return fbm6(p + 1.8 * r);
}

void main() {
    float t = (u_time + 2.4) * 0.25;
    float intensity = 0.86;
    float curtainScale = 1.12;
    float falloffPow = 0.88;

    float h = clamp(1.0 - v_uv.y, 0.0, 1.0);
    float cx = (v_uv.x - 0.5) * u_aspect;

    vec2 baseCoord = vec2(cx * curtainScale * 1.35 + 11.4, h * 0.38 + 3.1);
    float warpField = domainWarp(baseCoord * vec2(0.82, 0.62), t);

    float x1 = cx * curtainScale * 1.85 + (warpField - 0.5) * 1.65 + sin(t * 0.35 + h * 1.4) * 0.20 + 7.2;
    float x2 = cx * curtainScale * 2.40 - (warpField - 0.5) * 1.30 + cos(t * 0.27 - h * 1.1) * 0.24 + 19.5;
    float x3 = cx * curtainScale * 1.25 + (warpField - 0.5) * 2.00 + sin(t * 0.21 + 1.9) * 0.16 + 31.8;

    float streak1 = fbm6(vec2(x1 * 1.75, h * 0.52 - t * 0.08 + 2.0));
    float streak2 = fbm6(vec2(x2 * 2.25, h * 0.42 + t * 0.06 + 6.0));
    float streak3 = fbm6(vec2(x3 * 1.35, h * 0.32 - t * 0.05 + 11.0));

    float envWidth = 1.15;
    float horizEnv = exp(-sq(cx / envWidth));
    float wideEnv = exp(-sq(cx / (envWidth * 1.85)));

    float ridge = 0.24 + 0.26 * streak1 + 0.14 * streak2;
    float heightFactor = clamp(1.0 - max(h - ridge * 0.36, 0.0), 0.0, 1.0);
    float verticalCurtain = pow(max(heightFactor, 0.0001), falloffPow * 1.85);
    float coreRise = exp(-sq((h - 0.04) / (0.22 + 0.19 * streak1))) * smoothstep(0.30, 0.78, streak1 * 0.65 + streak2 * 0.35);
    float upperPlume = pow(max(clamp(1.0 - h, 0.0, 1.0), 0.0001), falloffPow * 0.92) * smoothstep(0.32, 0.80, streak2 * 0.55 + streak3 * 0.45);

    vec2 mDelta = (v_uv - u_mouse) * vec2(u_aspect, 1.0);
    float mBoost = 1.0 + u_mouseStrength * 0.18 * exp(-dot(mDelta, mDelta) * 3.0);

    float bPrimary = clamp((verticalCurtain * 0.85 + upperPlume * 0.55) * wideEnv * intensity * mBoost, 0.0, 1.0);
    float bAccent = clamp((upperPlume * 0.68 + coreRise * 0.82) * horizEnv * intensity * mBoost, 0.0, 1.0);
    float bCore = clamp(coreRise * horizEnv * smoothstep(0.38, 0.80, streak1) * intensity * mBoost, 0.0, 1.0);

    vec3 finalRgb = u_ground;

    if (u_isLight > 0.5) {
        float centerDist2 = sq(cx * 0.78) + sq((v_uv.y - 0.56) * 1.15);
        float halo = exp(-centerDist2 * 1.35) * (0.55 + 0.45 * streak3);
        float softPrimary = clamp((bPrimary * 0.46 + halo * 0.34) * intensity, 0.0, 0.72);
        float softAccent = clamp((bAccent * 0.42 + bCore * 0.36) * intensity, 0.0, 0.64);
        finalRgb = mix(finalRgb, u_primary, softPrimary);
        finalRgb = mix(finalRgb, u_accent, softAccent);
        finalRgb = mix(finalRgb, u_core, clamp(bCore * 0.28, 0.0, 0.38));
    } else {
        float veil = pow(max(clamp(1.0 - h, 0.0, 1.0), 0.0001), falloffPow * 1.20) * (0.35 + 0.65 * streak3) * wideEnv;
        finalRgb += u_primary * (bPrimary * 0.82 + veil * 0.28);
        finalRgb += u_accent * (bAccent * 0.62);
        finalRgb = mix(finalRgb, u_core, clamp(bCore * 0.52, 0.0, 0.66));
    }

    gl_FragColor = vec4(clamp(finalRgb, 0.0, 1.0), 1.0);
}
`;

function compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string,
): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

export function HydroAuroraCanvas({
    dark = false,
    reducedMotion = false,
}: HydroAuroraCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [glReady, setGlReady] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl', {
            alpha: false,
            antialias: false,
            depth: false,
            stencil: false,
            powerPreference: 'low-power',
            preserveDrawingBuffer: false,
        });
        if (!gl) return;

        const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
        const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
        if (!vs || !fs) return;

        const program = gl.createProgram();
        if (!program) return;
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.deleteProgram(program);
            gl.deleteShader(vs);
            gl.deleteShader(fs);
            return;
        }

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            gl.STATIC_DRAW,
        );

        const posLoc = gl.getAttribLocation(program, 'a_pos');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        const uTime = gl.getUniformLocation(program, 'u_time');
        const uAspect = gl.getUniformLocation(program, 'u_aspect');
        const uIsLight = gl.getUniformLocation(program, 'u_isLight');
        const uMouse = gl.getUniformLocation(program, 'u_mouse');
        const uMouseStrength = gl.getUniformLocation(
            program,
            'u_mouseStrength',
        );
        const uGround = gl.getUniformLocation(program, 'u_ground');
        const uPrimary = gl.getUniformLocation(program, 'u_primary');
        const uAccent = gl.getUniformLocation(program, 'u_accent');
        const uCore = gl.getUniformLocation(program, 'u_core');

        let mouseX = 0.5;
        let mouseY = 0.65;
        let targetStrength = 0;
        let currentStrength = 0;

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            const width = Math.max(1, Math.floor(window.innerWidth * dpr));
            const height = Math.max(1, Math.floor(window.innerHeight * dpr));
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
                gl.viewport(0, 0, width, height);
            }
        };

        const onPointerMove = (e: PointerEvent) => {
            mouseX = e.clientX / Math.max(1, window.innerWidth);
            mouseY = e.clientY / Math.max(1, window.innerHeight);
            targetStrength = 1;
        };

        const onPointerLeave = () => {
            targetStrength = 0;
        };

        resize();
        window.addEventListener('resize', resize);
        if (!reducedMotion) {
            window.addEventListener('pointermove', onPointerMove, {
                passive: true,
            });
            window.addEventListener('pointerleave', onPointerLeave);
        }

        const start = performance.now();
        let rafId = 0;

        const drawFrame = (now: number) => {
            gl.useProgram(program);
            currentStrength += (targetStrength - currentStrength) * 0.06;

            const elapsed = reducedMotion ? 0.6 : (now - start) * 0.001;
            const aspect = canvas.width / Math.max(1, canvas.height);

            gl.uniform1f(uTime, elapsed);
            gl.uniform1f(uAspect, aspect);
            gl.uniform1f(uIsLight, dark ? 0.0 : 1.0);
            gl.uniform2f(uMouse, mouseX, mouseY);
            gl.uniform1f(uMouseStrength, reducedMotion ? 0.0 : currentStrength);

            if (dark) {
                // Nocturnal Hydro-Mist adaptation: #07141E, #0F6594, #259A99, #67D1CF
                gl.uniform3f(uGround, 0.027, 0.078, 0.118);
                gl.uniform3f(uPrimary, 0.059, 0.396, 0.58);
                gl.uniform3f(uAccent, 0.145, 0.604, 0.6);
                gl.uniform3f(uCore, 0.404, 0.82, 0.812);
            } else {
                // Model A Daylight Hydro-Mist: #F5F9FB, #B4D8F3, #67D1CF, #45AEEF
                gl.uniform3f(uGround, 0.961, 0.976, 0.984);
                gl.uniform3f(uPrimary, 0.706, 0.847, 0.953);
                gl.uniform3f(uAccent, 0.404, 0.82, 0.812);
                gl.uniform3f(uCore, 0.271, 0.682, 0.937);
            }

            gl.drawArrays(gl.TRIANGLES, 0, 6);

            if (!reducedMotion) {
                rafId = window.requestAnimationFrame(drawFrame);
            }
        };

        drawFrame(start);
        setGlReady(true);

        return () => {
            window.cancelAnimationFrame(rafId);
            window.removeEventListener('resize', resize);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerleave', onPointerLeave);
            gl.deleteBuffer(buffer);
            gl.deleteProgram(program);
            gl.deleteShader(vs);
            gl.deleteShader(fs);
        };
    }, [dark, reducedMotion]);

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
        >
            {/* Zero-JS atmospheric CSS fallback while WebGL initializes or if unavailable */}
            <div
                className="absolute inset-0 transition-opacity duration-500"
                style={{
                    backgroundColor: dark ? '#07141E' : '#F5F9FB',
                    backgroundImage: dark
                        ? 'radial-gradient(62% 72% at 50% 96%, rgba(37, 154, 153, 0.42) 0%, rgba(15, 101, 148, 0.26) 44%, transparent 78%), radial-gradient(46% 64% at 32% 88%, rgba(15, 101, 148, 0.34) 0%, transparent 72%), radial-gradient(46% 64% at 68% 86%, rgba(103, 209, 207, 0.24) 0%, transparent 72%)'
                        : 'radial-gradient(64% 70% at 50% 94%, rgba(103, 209, 207, 0.34) 0%, rgba(180, 216, 243, 0.38) 46%, transparent 78%), radial-gradient(44% 62% at 30% 88%, rgba(180, 216, 243, 0.42) 0%, transparent 74%), radial-gradient(44% 62% at 70% 84%, rgba(69, 174, 239, 0.22) 0%, transparent 72%)',
                }}
            />

            <canvas
                ref={canvasRef}
                width={1440}
                height={900}
                className={`absolute inset-0 size-full transition-opacity duration-700 ease-out ${
                    glReady ? 'opacity-100' : 'opacity-0'
                }`}
            />
        </div>
    );
}
