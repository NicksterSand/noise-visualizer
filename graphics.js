//Default shaders
const vsSourceDefault = `
    attribute vec4 aVertexPosition;
        
    void main(){
        gl_Position = aVertexPosition;
    }
`;
const fsSourceDefault = `
    void main(){
        gl_FragColor = vec4(0.0,0.0,0.0,1.0);
    }
`;
const fsSourcePerlin = `
    uniform lowp vec2 uScreenSize;
    uniform lowp vec4 uSeed;
    uniform lowp float uScale;
    
    lowp vec2 random(vec2 st){
        st = vec2( dot(st,vec2(uSeed.x,uSeed.y)),
                    dot(st,vec2(uSeed.z,uSeed.w)) );
        return -1.0 + 2.0*fract(sin(st)*43758.5453123);
    }
    
    // Value Noise by Inigo Quilez - iq/2013
    // https://www.shadertoy.com/view/lsf3WH
    lowp float noise(vec2 st) {
        lowp vec2 i = floor(st);
        lowp vec2 f = fract(st);
    
        //lowp vec2 u = f*f*(3.0-2.0*f);
        lowp vec2 u = f*f*f*(f*(f*6.-15.)+10.);
    
        return mix( mix( dot( random(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                         dot( random(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                    mix( dot( random(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                         dot( random(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
    }
    
    void main(){
        lowp vec2 st = gl_FragCoord.xy/uScreenSize.xy;
        st.x *= uScreenSize.x/uScreenSize.y;
        lowp vec2 pos = vec2(st*uScale);
        lowp vec3 color = vec3(noise(pos)*.5+.5);
        //color *= uColor;
        gl_FragColor = vec4(color, 1.);
    }
`;
const fsSourceWorley = `
    uniform lowp vec2 uScreenSize;
    uniform lowp vec4 uSeed;
    uniform lowp float uScale;
    
    lowp vec2 random(vec2 p){
        if(p.x == 0. && p.y == 0.){
            return fract(sin(vec2(dot(vec2(-1,-1),vec2(uSeed.x,uSeed.y)),dot(vec2(-1,-1),vec2(uSeed.z,uSeed.w))))*43758.5453);
        }else{
            return fract(sin(vec2(dot(p,vec2(uSeed.x,uSeed.y)),dot(p,vec2(uSeed.z,uSeed.w))))*43758.5453);
        }
    }
    
    void main(){
        lowp vec2 st = gl_FragCoord.xy/uScreenSize.xy;
        st.x *= uScreenSize.x/uScreenSize.y;
        lowp vec3 color = vec3(0.);
        
        st *= uScale;
        lowp vec2 i_st = floor(st);
        lowp vec2 f_st = fract(st);
        
        mediump float m_dist = 1.;
        
        for(int y = -1; y <= 1; y++){
            for(int x = -1; x <= 1; x++){
                lowp vec2 neighbor = vec2(float(x),float(y));
                lowp vec2 point = random(i_st + neighbor);
                lowp vec2 diff = neighbor + point - f_st;
                mediump float dist = length(diff);
                m_dist = min(m_dist, dist);
            }
        }
        color += m_dist;
        //color += 1. - step(.02, m_dist);
        //color -= step(.7,abs(sin(27.0*m_dist)))*.5;
        //color *= uColor;
        gl_FragColor = vec4(color, 1.);
        
    }
`;

const fsSourceValue = `
    uniform lowp vec2 uScreenSize;
    uniform lowp vec4 uSeed;
    uniform lowp float uScale;
    
    lowp float random(vec2 st){
        return fract(sin(dot(st.xy, vec2(uSeed.x,uSeed.y))) * 43758.5453123);
    }
    
    lowp float valueNoise(vec2 st){
        lowp vec2 i = floor(st);
        lowp vec2 f = fract(st);
        
        lowp float a = random(i);
        lowp float b = random(i + vec2(1., 0.));
        lowp float c = random(i + vec2(0., 1.));
        lowp float d = random(i + vec2(1., 1.));
        
        lowp vec2 u = f*f*f*(f*(f*6.-15.)+10.);
        
        return mix(a, b, u.x) + (c - a) * u.y * (1. - u.x) + (d - b) * u.x * u.y;
    }
    
    void main(){
        lowp vec2 st = gl_FragCoord.xy/uScreenSize.xy;
        lowp vec2 pos = vec2(st*uScale);
        lowp float n = valueNoise(pos);
        
        //lowp vec3 color = vec3(n*uColor);
        gl_FragColor = vec4(n,n,n, 1.);
    }
`;

function initShaderProgram(gl, vsSource, fsSource){
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
        alert("Could not initialize shader: " + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        alert("Could not compile shader: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function initBuffers(gl){
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    //Create fullscreen quad
    const positions = [
        -1.0,  1.0,
        1.0,  1.0,
        -1.0, -1.0,
        1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    return{
        position: positionBuffer
    };
}

function drawScene(gl, shaderProgram, buffers){
    gl.clearColor(0.0,0.0,0.0,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    {
        const vertexPosition = gl.getAttribLocation(shaderProgram,"aVertexPosition");
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(vertexPosition,2,gl.FLOAT,false,0,0);
        gl.enableVertexAttribArray(vertexPosition);
    }
    gl.useProgram(shaderProgram);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}