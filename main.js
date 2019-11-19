$(function(){
    //Handle dragging
    let movingAll = false;
    let movingOne = false;
    let moveObj = null;
    let prevPosX = 0;
    let prevPosY = 0;
    $("main").mousedown(function(event){if(event.which == 1){movingAll = true}});
    $(document).mouseup(function(event){if(event.which == 1){movingOne = false; movingAll = false;}});
    $("main").mousemove(function(event){
        if(movingAll && !movingOne){
            let offsetX = event.pageX - prevPosX;
            let offsetY = event.pageY - prevPosY;
            $(".draggable").each(function() {
                $(this).css("top", parseInt($(this).css("top"), 10) + offsetY + "px");
                $(this).css("left", parseInt($(this).css("left"), 10) + offsetX + "px");
            });
            $("main").css("background-position-y", parseInt($("main").css("background-position-y"),10) + offsetY + "px");
            $("main").css("background-position-x", parseInt($("main").css("background-position-x"),10) + offsetX + "px");
        }else if(movingOne && moveObj){
            let offsetX = event.pageX - prevPosX;
            let offsetY = event.pageY - prevPosY;
            moveObj.css("top", parseInt(moveObj.css("top"), 10) + offsetY + "px");
            moveObj.css("left", parseInt(moveObj.css("left"), 10) + offsetX + "px");
        }
        prevPosX = event.pageX;
        prevPosY = event.pageY;
    });

    //Init Node WebGL Canvas
    let nodeGL = null;

    //Handle right-click
    let rightClickMenu = false;
    $("#rightclick").hide();
    $("#rightclick div").hide();
    $("#rightclick div").each(function(index){
        $(this).css("top",index * 20 + 28 + "px");
    });
    $("main").contextmenu(function(event){
        event.preventDefault();
        $("#rightclick").show();
        $("#rightclick").css("top",event.pageY);
        $("#rightclick").css("left",event.pageX);
        rightClickMenu = true;
    });
    $("#rightclick>button").hover(function(){
        $(this).next().show();
        $(this).css("background-color", "dodgerblue");
    },function(){
        $(this).next().hide();
        $(this).css("background-color", "grey");
    });
    $("#rightclick div").hover(function(){
        $(this).show();
        $(this).prev().css("background-color", "dodgerblue");
    },function(){
        $(this).hide();
        $(this).prev().css("background-color", "grey");
    });
    $("#rightclick div button").click(function(event){
        //TODO: condense others
        const node = $(document.createElement('div'));
        node.attr("class","draggable");
        node.css("top", event.pageY + "px");
        node.css("left", event.pageX + "px");
        node.css("position","absolute");
        $("main").append(node);
        switch($(this).parent().attr("id")){
            case "noise":
                console.log("made noise node");
                node.append("<canvas id='nodeCanvas' height='256' width='256'></canvas>" +
                    "<br><div id='controls'>" +
                    "<p>"+ $(this).text() +"</p>" +
                    "<label for='noiseR'>Red</label>\n" +
                    "<input type='range' id='noiseR' step='0.005' min='0' max='1' value='1'><br>\n" +
                    "<label for='noiseG'>Green</label>\n" +
                    "<input type='range' id='noiseG' step='0.005' min='0' max='1' value='1'><br>\n" +
                    "<label for='noiseB'>Blue</label>\n" +
                    "<input type='range' id='noiseB' step='0.005' min='0' max='1' value='1'><br>\n" +
                    "<label for='noiseScale'>Scale</label>\n" +
                    "<input type='range' min='0.5' max='100' id='noiseScale'><br>\n" +
                    "<button id='seed'>New Seed</button>");
                    node.mousedown(function(event){if(event.which == 1){movingOne = true; moveObj = node}});
                    $("#controls input").on("input",function(){
                        moveObj = null;
                        console.log("input");
                    });
                    let source = fsSourceDefault;
                    switch($(this).text()){
                        case "Perlin":
                            source = fsSourcePerlin;
                            break;
                        case "Value":
                            source = fsSourceValue;
                            break;
                        case "Worley":
                            source = fsSourceWorley;
                            break;
                        default:
                            alert($(this).text() + " has no linked source!");
                            break;
                    }
                    nodeGL = initNodeCanvas(source);
                    nodeGL.gl.useProgram(nodeGL.shader);
                    let uColor = nodeGL.gl.getUniformLocation(nodeGL.shader, "uColor");
                    let uSeed = nodeGL.gl.getUniformLocation(nodeGL.shader, "uSeed");
                    let uScale = nodeGL.gl.getUniformLocation(nodeGL.shader, "uScale");
                    let uScreenSize = nodeGL.gl.getUniformLocation(nodeGL.shader, "uScreenSize");
                    nodeGL.gl.uniform3f(uColor, $("#noiseR").val(), $("#noiseG").val(), $("#noiseB").val());
                    $("#noiseR, #noiseG, #noiseB").on("input", function(){
                        nodeGL.gl.useProgram(nodeGL.shader);
                        nodeGL.gl.uniform3f(uColor, $("#noiseR").val(), $("#noiseG").val(), $("#noiseB").val());
                    });
                    nodeGL.gl.uniform4f(uSeed, Math.random() * 200 + 50,Math.random() * 200 + 50,Math.random() * 200 + 50,Math.random() * 200 + 50);
                    $("#seed").click(function(){
                        nodeGL.gl.useProgram(nodeGL.shader);
                        nodeGL.gl.uniform4f(uSeed, Math.random() * 200 + 50,Math.random() * 200 + 50,Math.random() * 200 + 50,Math.random() * 200 + 50);
                    });
                    nodeGL.gl.uniform1f(uScale, $("#noiseScale").val());
                    $("#noiseScale").on("input", function(){
                        nodeGL.gl.useProgram(nodeGL.shader);
                        nodeGL.gl.uniform1f(uScale, $("#noiseScale").val());
                    });
                    nodeGL.gl.uniform2f(uScreenSize, nodeGL.canvas.width, nodeGL.canvas.height);
                break;
            default:
                break;
        }
    });
    $("body").click(function(event) {
        if (rightClickMenu){
            $("#rightclick").hide();
            rightClickMenu = false;
        }
    });

    //Init WebGL
    const mainCanvas = $("#mainCanvas").get(0);
    const mainGL = mainCanvas.getContext("webgl");
    if(mainGL == null){
        alert("Could not initialize WebGL");
        return;
    }
    let mainShader = initShaderProgram(mainGL,vsSourceDefault,fsSourceDefault);
    const mainBuffers = initBuffers(mainGL);
    mainGL.useProgram(mainShader);

    //Render Loop
    let then = 0;
    function render(now){
        now *= 0.001;
        const deltaTime = now-then;
        then = now;
        drawScene(mainGL,mainShader,mainBuffers);
        if(nodeGL){
            drawScene(nodeGL.gl, nodeGL.shader, nodeGL.buffers)
        }
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
});
function initNodeCanvas(fsSource){
    const canvas = $("#nodeCanvas").get(0);
    const gl = canvas.getContext("webgl");
    if(gl == null){
        alert("Could not initialize WebGL");
        return;
    }
    let shader = initShaderProgram(gl,vsSourceDefault,fsSource);
    const buffers = initBuffers(gl);
    gl.useProgram(shader);
    return {
        canvas:canvas,
        gl:gl,
        shader:shader,
        buffers:buffers
    }
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
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}