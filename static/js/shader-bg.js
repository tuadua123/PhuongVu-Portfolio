const background = document.createElement("div");
background.id = "shader-background";
document.body.prepend(background);

const canvas = document.createElement("canvas");
canvas.id = "shader-bg";
document.body.prepend(canvas);

const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false
});

if (!gl) {
    console.warn("WebGL is not supported.");
} else {
    const vertexShaderSource = `
        attribute vec2 aPosition;

        void main() {
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }
    `;

    const fragmentShaderSource = `
        precision mediump float;

        uniform float iTime;
        uniform vec2 iResolution;
        uniform vec2 iMouse;

        void main() {
            vec2 uv = gl_FragCoord.xy / iResolution.xy;

            vec2 aspect = vec2(
                iResolution.x / iResolution.y,
                1.0
            );

            vec2 diff = (uv - iMouse) * aspect;
            float d = length(diff);

            // Soft radial spotlight
            float glow = exp(-d * d * 3.5);

            // Subtle blue/white light
            vec3 lightColor = vec3(
                0.12,
                0.20,
                0.30
            );

            vec3 color = lightColor * glow * 0.85;

            // Transparent outside the glow
            float alpha = glow * 0.75;

            gl_FragColor = vec4(color, alpha);
        }
    `;

    function createShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    const vertexShader = createShader(
        gl.VERTEX_SHADER,
        vertexShaderSource
    );

    const fragmentShader = createShader(
        gl.FRAGMENT_SHADER,
        fragmentShaderSource
    );

    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.useProgram(program);

    const vertices = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1
    ]);

    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        vertices,
        gl.STATIC_DRAW
    );

    const position = gl.getAttribLocation(
        program,
        "aPosition"
    );

    gl.enableVertexAttribArray(position);

    gl.vertexAttribPointer(
        position,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.enable(gl.BLEND);

    gl.blendFunc(
        gl.SRC_ALPHA,
        gl.ONE_MINUS_SRC_ALPHA
    );

    const timeLocation = gl.getUniformLocation(
        program,
        "iTime"
    );

    const resolutionLocation = gl.getUniformLocation(
        program,
        "iResolution"
    );

    const mouseLocation = gl.getUniformLocation(
    program,
    "iMouse"
    );

    let mouseX = 0.5;
    let mouseY = 0.5;

    let targetMouseX = 0.5;
    let targetMouseY = 0.5;

    window.addEventListener("mousemove", (event) => {
        targetMouseX = event.clientX / window.innerWidth;
        targetMouseY = 1.0 - event.clientY / window.innerHeight;
    });

    function resize() {
        const dpr = Math.min(window.devicePixelRatio, 2);

        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;

        canvas.style.width = "100vw";
        canvas.style.height = "100vh";

        gl.viewport(
            0,
            0,
            canvas.width,
            canvas.height
        );
    }

    window.addEventListener("resize", resize);
    resize();

    function render(time) {
        time *= 0.001;

        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        gl.uniform2f(
            mouseLocation,
            mouseX,
            mouseY
        );

        gl.uniform1f(
            timeLocation,
            time
        );

        gl.uniform2f(
            resolutionLocation,
            canvas.width,
            canvas.height
        );

        gl.drawArrays(
            gl.TRIANGLES,
            0,
            6
        );

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}