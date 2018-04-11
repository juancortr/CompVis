var rotationSpeed = 0.1;
var cubeRotation2 = -0.1;
var gl = 0;

var vertexBufferCylinderSide = null; //For the cylinder's sides
var vertexBufferCylinderTop = null; //For cylinder's top
var vertexBufferCylinderBot = null; //For the cylinder's bottom 

var cylinderSideVertices=[];
var cylinderTopVertices=[];
var cylinderBotVertices=[];
var cylinderSegments=32; //Change this if you want!

var program;

var u_modelviewMatrix = null;
var u_projectionMatrix = null;
var u_FragColor = null;
var modelMatrix = null;
var viewMatrix = null;
var modelviewMatrix = null;
var projectionMatrix = null;

const  LINES          = 0x0001;
const  LINE_LOOP      = 0x0002;
const  LINE_STRIP     = 0x0003;
const  TRIANGLES      = 0x0004;
const  TRIANGLE_STRIP = 0x0005;
const  TRIANGLE_FAN   = 0x0006;


//
// Start here
//
function main() {
  const canvas = document.querySelector('#glcanvas');
  gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  // If we don't have a GL context, give up now

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  // Vertex shader program

  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying lowp vec4 vColor;
    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;

  // Fragment shader program

  const fsSource = `
    varying lowp vec4 vColor;
    void main(void) {
      gl_FragColor = vColor;
    }
  `;

   //Initiate some matrices
   modelMatrix =  mat4.create();
   viewMatrix = mat4.create();
   modelviewMatrix = mat4.create();
   projectionMatrix = mat4.create();

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  program =shaderProgram;
  initShaderParameters();

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVevrtexColor and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
  };

  initCylinderBuffer();

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  //182 var buffers = initBuffers(gl);

  var then = 0;

  //drawScene(gl, programInfo,  12);
  
  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;
  
    
    drawScene(gl, programInfo, /*buffers,*/ deltaTime);  

    requestAnimationFrame(render);
  }
  
  requestAnimationFrame(render);
}

function initCylinderBuffer(){
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
}

//
// Draw the scene.
//
function drawScene(gl, programInfo, /*buffers,*/ deltaTime) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();
  
  const numComponentsPosition = 3;
  const numComponentsColors = 4;
  const type = gl.FLOAT;
  const sizeFloat = 4;
  const normalize = false;
  // --- vertex Components (Strie and offset mode)
  const positionOffset = 0;
  const colorOffset = numComponentsPosition * sizeFloat;
  const stride  = (numComponentsPosition + numComponentsColors) * sizeFloat; //sizeOfVector
  

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  var modelViewMatrixOriginal = mat4.create(); //debería ser de cada figura

  var modelViewMatrix2 = mat4.create(); //debería ser de cada figura
  
  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);
  
  // Set the shader uniforms

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrixOriginal);


   drawCylinderTop();
   drawCylinderBot();
   drawCylinderSide();  
  // Update the rotation for the next draw
  rotationSpeed += deltaTime;
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderParameters() {
   u_modelviewMatrix = gl.getUniformLocation(program, 'u_modelviewMatrix');
   u_projectionMatrix = gl.getUniformLocation(program, 'u_projectionMatrix');
   return true;
}
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function drawFigure(gl, programInfo,  modelViewMatrixLastStack, translation, rotation, figureData)
{
  
  var modelViewMatrixFigure = mat4.create();
  
    //var modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrixFigure,     // destination matrix
                 modelViewMatrixLastStack,     // matrix to translate
                  translation); ;  // amount to translate = translate
  mat4.rotate(modelViewMatrixFigure,  // destination matrix
              modelViewMatrixFigure,  // matrix to rotate
              rotationSpeed,     // amount added to rotate in radians*/
              rotation );     
 /* gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);*/
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrixFigure);
  
  

    return modelViewMatrixFigure;
  
}

function AddPoints(segments) {
   a=0, b=0, y=0; //The origin
   r = 1.0, g = 1.0, b = 1.0, al = 1.0;
   rbt = 1.0, gbt = 0.0, bbt = 0.0;
   theta = (Math.PI/180) * (360/segments); //Degrees = radians * (180 / Ï€)


   for (i =0;i<=segments;i++){
       x =  Math.cos(theta*i); 
       z =  Math.sin(theta*i);

      cylinderBotVertices.push(x, y, z); //Bottomvertices
      cylinderBotVertices.push(rbt, gbt, bbt, al); //Color for bottom vertices

      cylinderSideVertices.push(x, y, z); //Sidevertices along the bottom
      cylinderSideVertices.push(r,g,b,al); //Vertex color
      cylinderSideVertices.push(x, y+2, z); //Sidevertices along the top with y = 2
      cylinderSideVertices.push(r,g,b,al); //Vertex color

      cylinderTopVertices.push(x, y+2, z); //Topvertices with y = 2
      cylinderTopVertices.push(rbt, gbt, bbt, al); //Color for top vertices
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

   //modelviewMatrix.set(viewMatrix).multiply(modelMatrix);
   //gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
   //gl.uniformMatrix4fv(u_projectionMatrix, false, projectionMatrix.elements);

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

   //modelviewMatrix.set(viewMatrix).multiply(modelMatrix); 
   //gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
   //gl.uniformMatrix4fv(u_projectionMatrix, false, projectionMatrix.elements);

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

   //modelviewMatrix.set(viewMatrix).multiply(modelMatrix); 
   //gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
   //gl.uniformMatrix4fv(u_projectionMatrix, false, projectionMatrix.elements); 

   gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexBufferCylinderSide.nmbrOfVertices);

}

main();