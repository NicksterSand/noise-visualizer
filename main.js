$(function(){
    let movingAll = false;
    let movingOne = false;
    let prevPosX = 0;
    let prevPosY = 0;
    $("main").mousedown(function(){movingAll = true});
    $(".testDiv").mousedown(function(){movingOne = true});
    $(document).mouseup(function(){movingOne = false; movingAll = false;});
    $("main").mousemove(function(event){
        if(movingAll && !movingOne){
            let offsetX = event.pageX - prevPosX;
            let offsetY = event.pageY - prevPosY;
            $(".testDiv").each(function() {
                $(this).css("top", parseInt($(this).css("top"), 10) + offsetY + "px");
                $(this).css("left", parseInt($(this).css("left"), 10) + offsetX + "px");
            });
        }
        prevPosX = event.pageX;
        prevPosY = event.pageY;
    });
    $(".testDiv").draggable();
    const mainCanvas = $("#mainCanvas").get(0);
    const mainGL = mainCanvas.getContext("webgl");
    if(mainGL == null){
        alert("Could not initialize WebGL");
        return;
    }
    let mainShader = initShaderProgram(mainGL,vsSourceDefault,fsSourceDefault);
    const mainBuffers = initBuffers(mainGL);
    mainGL.useProgram(mainShader);

    let then = 0;
    function render(now){
        now *= 0.001;
        const deltaTime = now-then;
        then = now;
        drawScene(mainGL,mainShader,mainBuffers);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
});
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
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}