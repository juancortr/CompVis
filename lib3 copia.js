
//Global variables
var then = 0;
var gl = null;
var canvas = null;
var u_modelviewMatrix = null;
var u_projectionMatrix = null;
var u_FragColor = null;
var modelMatrix = null;
var viewMatrix = null;
var modelviewMatrix = null;
var projectionMatrix = null;

var vertexBufferCylinderSide = null; //For the cylinder's sides
var vertexBufferCylinderTop = null; //For cylinder's top
var vertexBufferCylinderBot = null; //For the cylinder's bottom 

var textureBufferCylinderSide = null;

var cylinderSideVertices=[];
var cylinderTopVertices=[];
var cylinderBotVertices=[];

var cylinderSideTextCoords = [];

var cylinderSegments=32; //Change this if you want!

var eyeX, eyeY, eyeZ;
var radius = 10;
var phi=0.0;

var program;
    
    function initShaders(gl, vShaderName, fShaderName) {
        function getShader(gl, shaderName, type) {
            var shader = gl.createShader(type);
            var shaderScript;
            if(shaderName == 'vshader'){
              shaderScript = 'attribute vec3 a_Position; \
              attribute vec4 a_Color; \
              uniform mat4 u_modelviewMatrix; \
              uniform mat4 u_projectionMatrix; \
              varying vec4 v_Color; \
              void main(){ \
                gl_Position = u_projectionMatrix * u_modelviewMatrix *  vec4(a_Position, 1.0); \
                v_Color = a_Color; \
              }';
            }
            else if(shaderName =='fshader'){
              shaderScript = 'precision mediump float; \
                varying vec4 v_Color;\
                void main(){\
                  gl_FragColor = v_Color;\
                }';
            }
            if (!shaderScript) {
                alert("Could not find shader source: "+shaderName);
            }
            gl.shaderSource(shader, shaderScript);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert(gl.getShaderInfoLog(shader));
                return null;
            }
            return shader;
        }
        var vertexShader = getShader(gl, vShaderName, gl.VERTEX_SHADER),
            fragmentShader = getShader(gl, fShaderName, gl.FRAGMENT_SHADER),
            program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
            return null;
        }

        
        return program;
    };

function init() {
   //Get the canvas element
   canvas = document.getElementById('glcanvas');

  // Rendering context for WebGL:
  gl = getWebGLContext(canvas);
  gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
  
   
   //Initiate some matrices
   modelMatrix = new Matrix4();
   viewMatrix = new Matrix4();
   modelviewMatrix = new Matrix4();
   projectionMatrix = new Matrix4();
   
   return true;
}

function initBuffers() {

   //Fills the array with vertices for the entire cylinder with the specified number of segments
   AddPoints(cylinderSegments); 
   cylinderBotArray = new Float32Array(cylinderBotVertices); //Vertices for the bottom
   cylinderSideArray = new Float32Array(cylinderSideVertices); //Vertices for the sides
   cylinderTopArray = new Float32Array(cylinderTopVertices); //Vertices for the top


   //Vertex buffer for TOP
   vertexBufferCylinderTop = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferCylinderTop);
   gl.bufferData(gl.ARRAY_BUFFER, cylinderTopArray, gl.STATIC_DRAW);
   vertexBufferCylinderTop.nmbrOfVertices = cylinderTopArray.length/7;
   gl.bindBuffer(gl.ARRAY_BUFFER, null);

   // Vertexbuffer for BOTTOM
   vertexBufferCylinderBot = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferCylinderBot);
   gl.bufferData(gl.ARRAY_BUFFER, cylinderBotArray, gl.STATIC_DRAW);
   vertexBufferCylinderBot.nmbrOfVerticess = cylinderBotArray.length/7; //xyz + rgba = 7
   gl.bindBuffer(gl.ARRAY_BUFFER, null);


   //Vertex buffer for cylinder SIDES
   vertexBufferCylinderSide = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferCylinderSide);
   gl.bufferData(gl.ARRAY_BUFFER, cylinderSideArray, gl.STATIC_DRAW);
   vertexBufferCylinderSide.nmbrOfVertices = cylinderSideArray.length / 7; //xyz + rgba = 7
   gl.bindBuffer(gl.ARRAY_BUFFER, null);

   textureBufferCylinderSide = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, textureBufferCylinderSide);
   gl.bufferData(gl.ARRAY_BUFFER, cylinderSideTextCoords, gl.STATIC_DRAW);
   gl.bindBuffer(gl.ARRAY_BUFFER, null);

}


function initShaderParameters() {
   u_modelviewMatrix = gl.getUniformLocation(program, 'u_modelviewMatrix');
   u_projectionMatrix = gl.getUniformLocation(program, 'u_projectionMatrix');
   return true;
}

//Adds the coordinates to the vertex arrays
function AddPoints(segments) {
   a=0, b=0, y=0; //The origin
   r = 1.0, g = 1.0, b = 1.0, al = 1.0;
   rbt = 1.0, gbt = 0.0, bbt = 0.0;
   theta = (Math.PI/180) * (360/segments); //Degrees = radians * (180 / Ï€)

   var text_step_x = 1 /segments;
   for (i =0;i<=segments;i++){
       x =  Math.cos(theta*i); 
       z =  Math.sin(theta*i);

      cylinderBotVertices.push(x, y, z); //Bottomvertices
      cylinderBotVertices.push(1.0, 0, 0, 1.0); //Color for bottom vertices

      cylinderSideVertices.push(x, y, z); //Sidevertices along the bottom
      cylinderSideVertices.push(r,g,b,al); //Vertex color
      cylinderSideVertices.push(x, y+2, z); //Sidevertices along the top with y = 2
      cylinderSideVertices.push(r,g,b,al); //Vertex color

      cylinderSideTextCoords.push(i*text_step_x, 0);
      cylinderSideTextCoords.push(i*text_step_x, 1);

      cylinderTopVertices.push(x, y+2, z); //Topvertices with y = 2
      cylinderTopVertices.push(0.5, 0.5, 0.5, 1.0); //Color for top vertices
   }
}

function drawCylinderTop(){
   var stride = (3 + 4)*4; //4 bytes per vertex

   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferCylinderTop);
   a_Position = gl.getAttribLocation(program, 'a_Position');
   gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, stride, 0);
   gl.enableVertexAttribArray(a_Position);

   var colorOffset = 3 * 4;
   a_Color = gl.getAttribLocation(program, 'a_Color');
   gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, stride, colorOffset);
   gl.enableVertexAttribArray(a_Color);

   modelviewMatrix.set(viewMatrix).multiply(modelMatrix);
   gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
   gl.uniformMatrix4fv(u_projectionMatrix, false, projectionMatrix.elements);

   gl.drawArrays(gl.TRIANGLE_FAN, 0, vertexBufferCylinderTop.nmbrOfVertices);
}

function drawCylinderBot(){

   var stride = (3 + 4)*4; //4 bytes per vertex
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferCylinderBot);
   a_Position = gl.getAttribLocation(program, 'a_Position');
   gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, stride, 0);
   gl.enableVertexAttribArray(a_Position);

   var colorOffset = 3 * 4;
   a_Color = gl.getAttribLocation(program, 'a_Color');
   gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, stride, colorOffset);
   gl.enableVertexAttribArray(a_Color);

   modelviewMatrix.set(viewMatrix).multiply(modelMatrix); 
   gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
   gl.uniformMatrix4fv(u_projectionMatrix, false, projectionMatrix.elements);

   gl.drawArrays(gl.TRIANGLE_FAN, 0, vertexBufferCylinderBot.nmbrOfVertices);   
}

function drawCylinderSide(){

 //Stride = number of bytes per vertex (pos+color).
  var stride = (3 + 4)*4;

   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferCylinderSide);
   a_Position = gl.getAttribLocation(program, 'a_Position');
   gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, stride, 0);
   gl.enableVertexAttribArray(a_Position);

   var colorOffset = 3 * 4;
   a_Color = gl.getAttribLocation(program, 'a_Color');
   gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, stride, colorOffset);
   gl.enableVertexAttribArray(a_Color);

   modelviewMatrix.set(viewMatrix).multiply(modelMatrix); 
   gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
   gl.uniformMatrix4fv(u_projectionMatrix, false, projectionMatrix.elements); 

   gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexBufferCylinderSide.nmbrOfVertices);

}


function setupCamera() {
  deltaTime = (new Date()).getMilliseconds();

  eyeX = 0 + radius*Math.sin(phi);
  eyeY = 5;
  eyeZ = 0 + radius*Math.cos(phi);
  //TODO explain ce methode
   //viewMatrix.setLookAt(5, 5, 10, 0, 0, 0, 0, 1, 0);

   viewMatrix.setLookAt(eyeX, eyeY,eyeZ, 0, 0, 0, 0, 1, 0);
   //viewMatrix.translate(Math.cos(deltaTime), 0,Math.sin(deltaTime));
   viewMatrix.rotate(90,0,0,1);
   viewMatrix.rotate(90,1,0,0);
   projectionMatrix.setPerspective(45, canvas.width / canvas.height, 1, 1000);
}
function render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;
    phi+=deltaTime;

    draw();

    requestAnimationFrame(render);
  }

function draw() {
   gl.clear(gl.COLOR_BUFFER_BIT);
   gl.enable(gl.DEPTH_TEST);
   gl.depthFunc(gl.LESS);
   setupCamera();
   
   modelMatrix.setIdentity();  

   drawCylinderTop();
   drawCylinderBot();
   drawCylinderSide();  
}

function main() {

   if (!init())
      return;

   //initShaders.js
    program = initShaders( gl, "vshader", "fshader" );
    if (program==null){
      console.log("error");
    }
    gl.useProgram( program );

   initBuffers();

   if (!initShaderParameters())
      return;

   gl.clearColor(0.0, 0.0, 0.0, 1.0); //RGBA
  requestAnimationFrame(render);
}

main();