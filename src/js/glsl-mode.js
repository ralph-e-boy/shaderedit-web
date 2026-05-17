import { StreamLanguage } from '@codemirror/language';

const KEYWORDS = new Set([
    'attribute', 'const', 'uniform', 'varying', 'buffer', 'shared', 'coherent',
    'volatile', 'restrict', 'readonly', 'writeonly', 'layout', 'centroid',
    'flat', 'smooth', 'noperspective', 'patch', 'sample', 'invariant', 'precise',
    'break', 'continue', 'do', 'for', 'while', 'switch', 'case', 'default',
    'if', 'else', 'subroutine', 'in', 'out', 'inout', 'discard', 'return',
    'struct', 'void', 'main',
    'precision', 'highp', 'mediump', 'lowp',
]);

const TYPES = new Set([
    'float', 'double', 'int', 'uint', 'bool', 'atomic_uint',
    'vec2', 'vec3', 'vec4',
    'dvec2', 'dvec3', 'dvec4',
    'ivec2', 'ivec3', 'ivec4',
    'uvec2', 'uvec3', 'uvec4',
    'bvec2', 'bvec3', 'bvec4',
    'mat2', 'mat3', 'mat4',
    'mat2x2', 'mat2x3', 'mat2x4',
    'mat3x2', 'mat3x3', 'mat3x4',
    'mat4x2', 'mat4x3', 'mat4x4',
    'dmat2', 'dmat3', 'dmat4',
    'sampler1D', 'sampler2D', 'sampler3D', 'samplerCube',
    'sampler1DShadow', 'sampler2DShadow', 'samplerCubeShadow',
    'sampler1DArray', 'sampler2DArray', 'sampler2DRect', 'sampler2DMS',
    'isampler1D', 'isampler2D', 'isampler3D', 'isamplerCube',
    'usampler1D', 'usampler2D', 'usampler3D', 'usamplerCube',
    'image1D', 'image2D', 'image3D', 'imageCube',
]);

const BUILTINS = new Set([
    'radians', 'degrees', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
    'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
    'pow', 'exp', 'log', 'exp2', 'log2', 'sqrt', 'inversesqrt',
    'abs', 'sign', 'floor', 'ceil', 'fract', 'mod', 'modf', 'trunc', 'round', 'roundEven',
    'min', 'max', 'clamp', 'mix', 'step', 'smoothstep',
    'isnan', 'isinf', 'floatBitsToInt', 'floatBitsToUint',
    'intBitsToFloat', 'uintBitsToFloat',
    'length', 'distance', 'dot', 'cross', 'normalize', 'faceforward', 'reflect', 'refract',
    'matrixCompMult', 'outerProduct', 'transpose', 'determinant', 'inverse',
    'lessThan', 'lessThanEqual', 'greaterThan', 'greaterThanEqual', 'equal', 'notEqual',
    'any', 'all', 'not',
    'texture', 'textureProj', 'textureLod', 'textureGrad', 'textureOffset',
    'texture2D', 'texture2DProj', 'texture2DLod', 'texture2DProjLod',
    'textureCube', 'textureCubeLod', 'texture3D', 'texelFetch',
    'dFdx', 'dFdy', 'fwidth',
    'noise1', 'noise2', 'noise3', 'noise4',
]);

const ATOMS = new Set([
    'true', 'false',
    'gl_Position', 'gl_PointSize', 'gl_ClipDistance',
    'gl_FragCoord', 'gl_FrontFacing', 'gl_FragColor', 'gl_FragData',
    'gl_FragDepth', 'gl_PointCoord', 'gl_VertexID', 'gl_InstanceID',
    'gl_PrimitiveID', 'gl_Layer', 'gl_ViewportIndex',
    'gl_NumWorkGroups', 'gl_WorkGroupID', 'gl_LocalInvocationID',
    'gl_GlobalInvocationID', 'gl_LocalInvocationIndex',
]);

const OPERATOR_CHARS = /[+\-*/%<>!=&|^~?:]/;

const glslParser = {
    name: 'glsl',
    startState() {
        return { inBlockComment: false };
    },
    token(stream, state) {
        if (state.inBlockComment) {
            while (!stream.eol()) {
                if (stream.match('*/')) {
                    state.inBlockComment = false;
                    return 'comment';
                }
                stream.next();
            }
            return 'comment';
        }

        if (stream.eatSpace()) return null;

        if (stream.match('//')) {
            stream.skipToEnd();
            return 'comment';
        }
        if (stream.match('/*')) {
            state.inBlockComment = true;
            return 'comment';
        }

        if (stream.sol() && stream.match(/^\s*#\w+/)) {
            return 'meta';
        }
        if (stream.match(/^#[A-Za-z_]\w*/)) {
            return 'meta';
        }

        const ch = stream.peek();

        if (ch === '"' || ch === "'") {
            const quote = stream.next();
            let escaped = false;
            while (!stream.eol()) {
                const c = stream.next();
                if (c === quote && !escaped) break;
                escaped = !escaped && c === '\\';
            }
            return 'string';
        }

        if (/\d/.test(ch) || (ch === '.' && /\d/.test(stream.string.charAt(stream.pos + 1)))) {
            stream.match(/^(?:0[xX][0-9a-fA-F]+|0[bB][01]+|\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?|\.\d+(?:[eE][+\-]?\d+)?)[uUlLfF]*/);
            return 'number';
        }

        if (/[A-Za-z_]/.test(ch)) {
            stream.eatWhile(/[A-Za-z0-9_]/);
            const word = stream.current();
            if (KEYWORDS.has(word)) return 'keyword';
            if (TYPES.has(word)) return 'type';
            if (BUILTINS.has(word)) return 'builtin';
            if (ATOMS.has(word)) return 'atom';
            if (word.startsWith('gl_') || word.startsWith('GL_')) return 'atom';
            return 'variable';
        }

        if (OPERATOR_CHARS.test(ch)) {
            stream.eatWhile(OPERATOR_CHARS);
            return 'operator';
        }

        if (/[{}()\[\];,.]/.test(ch)) {
            stream.next();
            return 'punctuation';
        }

        stream.next();
        return null;
    },
    languageData: {
        commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
        closeBrackets: { brackets: ['(', '[', '{', '"'] },
    },
};

export const glslLanguage = StreamLanguage.define(glslParser);
