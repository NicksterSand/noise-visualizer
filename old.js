function main() {
    const canvas = document.getElementById("glCanvas");
    //Initialize WebGL
    const gl = canvas.getContext("webgl");
    if(gl == null){
        alert("Could not initialize WebGL");
        return;
    }

    let defaultShader = initShaderProgram(gl, vsSourceDefault, fsSourceDefault);
    let buffers = initBuffers(gl);
    let uScreenSize = gl.getUniformLocation(defaultShader,"uScreenSize");
    let uSeed = gl.getUniformLocation(defaultShader,"uSeed");
    let uScale = gl.getUniformLocation(defaultShader,"uScale");
    let uColor = gl.getUniformLocation(defaultShader,"uColor");
    gl.useProgram(defaultShader);
    gl.uniform2f(uScreenSize,canvas.width,canvas.height);
    gl.uniform4f(uSeed, Math.random() * 200 + 50,Math.random() * 200 + 50,Math.random() * 200 + 50,Math.random() * 200 + 50);    gl.uniform1f(uScale, 20);
    gl.uniform3f(uColor, 1,1,1);
    const noiseR = document.getElementById("noiseR");
    const noiseG = document.getElementById("noiseG");
    const noiseB = document.getElementById("noiseB");
    function noiseChange(){
        gl.useProgram(defaultShader);
        gl.uniform3f(uColor, noiseR.value, noiseG.value, noiseB.value);
    }
    noiseR.oninput = noiseChange;
    noiseG.oninput = noiseChange;
    noiseB.oninput = noiseChange;
    const noiseScale = document.getElementById("noiseScale");
    noiseScale.oninput = function(){
        gl.useProgram(defaultShader);
        gl.uniform1f(uScale, noiseScale.value);
    }

    document.getElementById("seed").onclick = function(){
        gl.useProgram(defaultShader);
        gl.uniform4f(uSeed, Math.random() * 200 + 50,Math.random() * 200 + 50,Math.random() * 200 + 50,Math.random() * 200 + 50);
    }
    $(".nodeSelect").change(function(){
        const val = $(this).val();
        let source = fsSourceDefault;
        if(val == "value") {
            source = fsSourceValue;
        }else if(val == "worley"){
            source = fsSourceVoronoi;
        }else if(val == "perlin"){
            source = fsSourcePerlin;
        }
        defaultShader = initShaderProgram(gl, vsSourceDefault, source);
        uScreenSize = gl.getUniformLocation(defaultShader,"uScreenSize");
        uSeed = gl.getUniformLocation(defaultShader,"uSeed");
        uScale = gl.getUniformLocation(defaultShader,"uScale");
        uColor = gl.getUniformLocation(defaultShader,"uColor");
        gl.useProgram(defaultShader);
        gl.uniform2f(uScreenSize,canvas.width,canvas.height);
        gl.uniform4f(uSeed, Math.random() * 200 + 50,Math.random() * 200 + 50,Math.random() * 200 + 50,Math.random() * 200 + 50);    gl.uniform1f(uScale, 20);
        gl.uniform3f(uColor, noiseR.value, noiseG.value, noiseB.value);
        gl.uniform1f(uScale, noiseScale.value);
    });
    let then = 0;
    function render(now){
        now *= 0.001;
        const deltaTime = now-then;
        then = now;
        drawScene(gl,defaultShader,buffers);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
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

window.onload = main;