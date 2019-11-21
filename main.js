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

    let nodes = [];
    //Make Node
    $("#rightclick div button").click(function(event){
        if($("#activeNode").length){collapseNode($("#activeNode"),nodeGL)};
        const node = $(document.createElement('div'));
        nodeObj={node:node, type:$(this).parent().attr("id")};
        node.attr("class","draggable");
        node.css("top", event.pageY + "px");
        node.css("left", event.pageX + "px");
        node.css("position","absolute");
        $("main").append(node);
        switch(nodeObj.type){
            case "noise":
                nodeObj.inputs = [0,0,0,0];
                nodeObj.outputs = [0];
                node.attr("id", "activeNode");
                node.append("<canvas id='nodeCanvas' height='256' width='256'></canvas>" +
                    "<br><div id='controls'>" +
                    "<p>"+ $(this).text() +" Noise</p>" +
                    "<button id='scaleIn' class='input'></button>" +
                    "<label for='noiseScale'>Scale</label>\n" +
                    "<input type='range' min='0.5' max='100' id='noiseScale'><br>\n" +
                    "<br>" +
                    "<button id='seedIn' class='input'></button>" +
                    "<label for='seed'>Seed</label>\n" +
                    "<input type='button' id='seed' value='New Seed'>" +
                    "<p class='outLabel'>Noise</p>" +
                    "<button id='noiseOut' class='output'></button>");
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
                    nodeGL = initNodeCanvas(node, source);
                    nodeGL.gl.useProgram(nodeGL.shader);
                    //let uColor = nodeGL.gl.getUniformLocation(nodeGL.shader, "uColor");
                    let uSeed = nodeGL.gl.getUniformLocation(nodeGL.shader, "uSeed");
                    let uScale = nodeGL.gl.getUniformLocation(nodeGL.shader, "uScale");
                    let uScreenSize = nodeGL.gl.getUniformLocation(nodeGL.shader, "uScreenSize");
                    // nodeGL.gl.uniform3f(uColor, $("#noiseR").val(), $("#noiseG").val(), $("#noiseB").val());
                    // $("#noiseR, #noiseG, #noiseB").on("input", function(){
                    //     nodeGL.gl.useProgram(nodeGL.shader);
                    //     nodeGL.gl.uniform3f(uColor, $("#noiseR").val(), $("#noiseG").val(), $("#noiseB").val());
                    // });
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
        nodes.push(nodeObj);
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


    setInterval(function(){$("#loadDiv").remove()}, 100);
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
function initNodeCanvas(node, fsSource){
    const canvas = node.find("#nodeCanvas")[0];
    const gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
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
function collapseNode(node, gl){
    const canvas = node.find("#nodeCanvas")[0];
    const noiseImg = canvas.toDataURL("image/png");
    gl.gl.deleteProgram(gl.shader);
    gl.gl.deleteBuffer(gl.buffers.position);
    node.attr("id", "");
    $("#nodeCanvas").attr("id", "notNodeCanvas").remove();
    node.prepend("<div style='background-image:url("+ noiseImg +");width:256px;height:256px;'>");
    node.find("#seed").attr("id", "notSeed");
    node.find("#noiseScale").attr("id", "notNoiseScale");
}