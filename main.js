var nodeBlocks;
var mainGL;
var nodeGL;
var activeNode;
var movingOne;
var moveObj

$(function() {
    activeNode = null;
    nodeBlocks = [];
    //Handle dragging
    let movingAll = false;
    movingOne = false;
    moveObj = null;
    let prevPosX = 0;
    let prevPosY = 0;
    $("main").mousedown(function (event) {
        if (event.which == 1) {
            movingAll = true
        }
    });
    $(".draggable").mousedown(function (event) {
        if (event.which == 1) {
            movingOne = true;
            moveObj = $(this)
        }
    });
    $(document).mouseup(function (event) {
        if (event.which == 1) {
            movingOne = false;
            movingAll = false;
        }
    });
    $("main").mousemove(function (event) {
        if (movingAll && !movingOne) {
            let offsetX = event.pageX - prevPosX;
            let offsetY = event.pageY - prevPosY;
            $(".draggable").each(function () {
                $(this).css("top", parseInt($(this).css("top"), 10) + offsetY + "px");
                $(this).css("left", parseInt($(this).css("left"), 10) + offsetX + "px");
            });
            $("main").css("background-position-y", parseInt($("main").css("background-position-y"), 10) + offsetY + "px");
            $("main").css("background-position-x", parseInt($("main").css("background-position-x"), 10) + offsetX + "px");
        } else if (movingOne && moveObj) {
            let offsetX = event.pageX - prevPosX;
            let offsetY = event.pageY - prevPosY;
            moveObj.css("top", parseInt(moveObj.css("top"), 10) + offsetY + "px");
            moveObj.css("left", parseInt(moveObj.css("left"), 10) + offsetX + "px");
        }
        prevPosX = event.pageX;
        prevPosY = event.pageY;
    });

    //Setup Output Node
    $("#output").css({
        "top": (($(window).height() / 2) - 50) + "px",
        "left": (($(window).width() / 2)) + "px"
    });

    //Init Node WebGL Canvas
    nodeGL = null;

    //Handle right-click
    let rightClickMenu = false;
    $("#rightclick").hide();
    $("#rightclick div").hide();
    $("#rightclick div").each(function(index){
        $(this).css("top",index * 20 + 28 + "px");
    });
    let rMenuTop = 0;
    let rMenuLeft = 0;
    $("main").contextmenu(function(event){
        event.preventDefault();
        $("#rightclick").show();
        rMenuTop = event.pageY;
        rMenuLeft = event.pageX;
        $("#rightclick").css("top",rMenuTop);
        $("#rightclick").css("left",rMenuLeft);
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
    $("body").click(function(event) {
        if (rightClickMenu){
            $("#rightclick").hide();
            rightClickMenu = false;
        }
    });

    //Make Node
    $("#rightclick div button").click(function(event){
        if(activeNode != null){collapseNode(activeNode);}
        const node = $(document.createElement('div'));
        node.attr("id", nodeBlocks.length);
        nodeObj={node:node, type:$(this).parent().attr("id")};
        node.attr("class","draggable");
        node.css({
            position:"absolute",
            top:rMenuTop,
            left:rMenuLeft
        });
        $("main").append(node);
        switch(nodeObj.type) {
            case "noise":
                nodeObj.inputs = [0, 0];
                nodeObj.outputs = [0];
                let nodeID = node.attr("id");
                node.append("<canvas id='nodeCanvas' height='256' width='256'></canvas>" +
                    "<br><div id='" + nodeID + "controls'>" +
                    "<p>" + $(this).text() + " Noise</p>" +
                    "<button id='" + nodeID + "scaleIn' class='input num'></button>" +
                    "<label for='noiseScale'>Scale</label>\n" +
                    "<input type='range' min='0.5' max='100' id='" + nodeID + "noiseScale'><br>\n" +
                    "<br>" +
                    "<button id='" + nodeID + "seedIn' class='input num'></button>" +
                    "<label for='seed'>Seed</label>\n" +
                    "<input type='button' id='" + nodeID + "seed' value='New Seed'>" +
                    "<p class='outLabel'>Noise</p>" +
                    "<button id='" + nodeID + "noiseOut' class='output twoD'></button>"
                );
                nodeObj.inputButtons = [$("#" + nodeID + "scaleIn"), $("#" + nodeID + "seedIn")];
                nodeObj.outputButtons = [$("#" + nodeID + "noiseOut")];
                node.mousedown(function (event) {
                    if (event.which == 1) {
                        movingOne = true;
                        moveObj = node;
                    }
                });
                node.find("input").on("input", function () {
                    moveObj = null;
                });
                const source = getNodeSource(node);
                nodeGL = initNodeCanvas(node, source);
                nodeGL.gl.useProgram(nodeGL.shader);
                let uSeed = nodeGL.gl.getUniformLocation(nodeGL.shader, "uSeed");
                let uScale = nodeGL.gl.getUniformLocation(nodeGL.shader, "uScale");
                let uScreenSize = nodeGL.gl.getUniformLocation(nodeGL.shader, "uScreenSize");
                nodeGL.gl.uniform4f(uSeed, Math.random() * 200 + 50, Math.random() * 200 + 50, Math.random() * 200 + 50, Math.random() * 200 + 50);
                $("#" + nodeID + "seed").click(function () {
                    nodeGL.gl.useProgram(nodeGL.shader);
                    nodeGL.gl.uniform4f(uSeed, Math.random() * 200 + 50, Math.random() * 200 + 50, Math.random() * 200 + 50, Math.random() * 200 + 50);
                });
                nodeGL.gl.uniform1f(uScale, $("#" + nodeID + "noiseScale").val());
                $("#" + nodeID + "noiseScale").on("input", function () {
                    nodeGL.gl.useProgram(nodeGL.shader);
                    nodeGL.gl.uniform1f(uScale, $("#" + nodeID + "noiseScale").val());
                });
                nodeGL.gl.uniform2f(uScreenSize, nodeGL.canvas.width, nodeGL.canvas.height);
                break;
            default:
                break;
        }
        activeNode = node;
        nodeBlocks.push(nodeObj);
    });

    //Init WebGL
    const mainCanvas = $("#mainCanvas").get(0);
    mainGL = mainCanvas.getContext("webgl");
    if(mainGL == null){
        alert("Could not initialize WebGL");
        return;
    }
    let mainShader = initShaderProgram(mainGL,vsSourceDefault,fsSourceDefault);
    const mainBuffers = initBuffers(mainGL);
    mainGL.useProgram(mainShader);

    //Remove loading screen
    setInterval(function(){$("#loadDiv").remove()}, 50);

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

function collapseNode(node){
    const canvas = $("#nodeCanvas")[0];
    const noiseImg = canvas.toDataURL("image/png");
    nodeBlocks[getNodeBlock(node)].seed = nodeGL.gl.getUniform(nodeGL.shader, nodeGL.gl.getUniformLocation(nodeGL.shader, "uSeed"));
    nodeGL.gl.deleteProgram(nodeGL.shader);
    nodeGL.gl.deleteBuffer(nodeGL.buffers.position);
    $("#nodeCanvas").remove();
    node.prepend("<div style='background-image:url("+ noiseImg +");width:256px;height:256px;' class='tmpCanvas'>");
    node.css({backgroundColor:"darkgrey",boxShadow:"-3px -3px 3px rgba(0,0,0,0.45)"});
    node.mousedown(function(){
        collapseNode(activeNode);
        focusNode($(this));
    });
}

function focusNode(node){
    node.find(".tmpCanvas").remove();
    node.prepend("<canvas id='nodeCanvas' width='256px' height='256px'></canvas>");
    node.css({backgroundColor:"lightgrey",boxShadow:"3px 3px 3px rgba(0,0,0,0.45)"});
    nodeGL = initNodeCanvas(node, getNodeSource(node));
    activeNode = node;
    node.off("mousedown");
    node.mousedown(function(event){
        if (event.which == 1) {
            movingOne = true;
            moveObj = node;
        }
    });
    const nodeID = getNodeBlock(node);
    nodeGL.gl.useProgram(nodeGL.shader);
    let uSeed = nodeGL.gl.getUniformLocation(nodeGL.shader, "uSeed");
    let uScale = nodeGL.gl.getUniformLocation(nodeGL.shader, "uScale");
    let uScreenSize = nodeGL.gl.getUniformLocation(nodeGL.shader, "uScreenSize");
    let s = nodeBlocks[nodeID].seed;
    nodeGL.gl.uniform4f(uSeed, s[0], s[1], s[2], s[3]);
    $("#" + nodeID + "seed").click(function () {
        nodeGL.gl.useProgram(nodeGL.shader);
        nodeGL.gl.uniform4f(uSeed, Math.random() * 200 + 50, Math.random() * 200 + 50, Math.random() * 200 + 50, Math.random() * 200 + 50);
    });
    nodeGL.gl.uniform1f(uScale, $("#" + nodeID + "noiseScale").val());
    $("#" + nodeID + "noiseScale").on("input", function () {
        nodeGL.gl.useProgram(nodeGL.shader);
        nodeGL.gl.uniform1f(uScale, $("#" + nodeID + "noiseScale").val());
    });
    nodeGL.gl.uniform2f(uScreenSize, nodeGL.canvas.width, nodeGL.canvas.height);
}

function getNodeBlock(inNode){
    return parseInt(inNode.attr("id"));
}

function getNodeSource(node){
    //TODO: Rewrite to support connected nodes
    switch(node.find("p")[0].innerText){
        case "Perlin Noise":
            return fsSourcePerlin;
            break;
        case "Value Noise":
            return fsSourceValue;
            break;
        case "Worley Noise":
            return fsSourceWorley;
            break;
        default:
            return fsSourceDefault;
            break;
    }
}