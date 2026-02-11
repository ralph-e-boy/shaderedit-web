// WebGL renderer for shaders
export class ShaderRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.gl = null;
        this.program = null;
        this.startTime = Date.now();
        this.uniforms = {};
        this.mouse = [0.0, 0.0];
        this.mouseClick = [0.0, 0.0];
        this.mouseDown = 0.0;
        this.vertexShaderSource = `
            attribute vec2 position;
            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;
    }

    init() {
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }

        // Setup full-screen quad
        this.setupQuad();

        // Setup mouse tracking
        this.setupMouseTracking();
    }

    setupQuad() {
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1, 1, 1
        ]), this.gl.STATIC_DRAW);
    }

    compileShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(info);
        }

        return shader;
    }

    setFragmentShader(fragmentSource) {
        try {
            if (this.program) {
                this.gl.deleteProgram(this.program);
            }

            const vertexShader = this.compileShader(this.vertexShaderSource, this.gl.VERTEX_SHADER);
            const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);

            this.program = this.gl.createProgram();
            this.gl.attachShader(this.program, vertexShader);
            this.gl.attachShader(this.program, fragmentShader);
            this.gl.linkProgram(this.program);

            if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
                throw new Error(this.gl.getProgramInfoLog(this.program));
            }

            this.gl.useProgram(this.program);

            // Setup attributes
            const positionLocation = this.gl.getAttribLocation(this.program, 'position');
            this.gl.enableVertexAttribArray(positionLocation);
            this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

            this.startTime = Date.now();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    render() {
        if (!this.program) return;

        // Resize canvas to match display size
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // Update uniforms
        this.updateUniforms();

        // Draw
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    setupMouseTracking() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Normalize mouse coordinates to [0, 1]
            this.mouse[0] = (e.clientX - rect.left) / rect.width;
            this.mouse[1] = 1.0 - (e.clientY - rect.top) / rect.height; // Flip Y
        });

        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseClick[0] = (e.clientX - rect.left) / rect.width;
            this.mouseClick[1] = 1.0 - (e.clientY - rect.top) / rect.height;
            this.mouseDown = 1.0;
        });

        this.canvas.addEventListener('mouseup', () => {
            this.mouseDown = 0.0;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.mouseDown = 0.0;
        });
    }

    updateUniforms() {
        const time = (Date.now() - this.startTime) / 1000.0;

        // Default uniforms
        const timeLocation = this.gl.getUniformLocation(this.program, 'time');
        const resolutionLocation = this.gl.getUniformLocation(this.program, 'resolution');
        const mouseLocation = this.gl.getUniformLocation(this.program, 'mouse');
        const mouseClickLocation = this.gl.getUniformLocation(this.program, 'mouseClick');
        const mouseDownLocation = this.gl.getUniformLocation(this.program, 'mouseDown');

        if (timeLocation) this.gl.uniform1f(timeLocation, time);
        if (resolutionLocation) this.gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);
        if (mouseLocation) this.gl.uniform2f(mouseLocation, this.mouse[0], this.mouse[1]);
        if (mouseClickLocation) this.gl.uniform2f(mouseClickLocation, this.mouseClick[0], this.mouseClick[1]);
        if (mouseDownLocation) this.gl.uniform1f(mouseDownLocation, this.mouseDown);

        // Custom uniforms
        for (const [name, value] of Object.entries(this.uniforms)) {
            const location = this.gl.getUniformLocation(this.program, name);
            if (location) {
                if (typeof value === 'number') {
                    this.gl.uniform1f(location, value);
                } else if (Array.isArray(value)) {
                    if (value.length === 2) this.gl.uniform2f(location, value[0], value[1]);
                    else if (value.length === 3) this.gl.uniform3f(location, value[0], value[1], value[2]);
                    else if (value.length === 4) this.gl.uniform4f(location, value[0], value[1], value[2], value[3]);
                }
            }
        }
    }

    setUniform(name, value) {
        this.uniforms[name] = value;
    }

    startRenderLoop() {
        const renderLoop = () => {
            this.render();
            requestAnimationFrame(renderLoop);
        };
        renderLoop();
    }
}