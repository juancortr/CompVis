
//Global variables
var showCone =false, showCylinder=true, showSphere=false;

var canHeight=1.5;

var cylinderTopTexture;
var cylinderSideTexture;

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


var moonVertexPositionBuffer;
var moonVertexTextureCoordBuffer;

var textureBufferCylinderSide = null;
var textureBufferCylinderTop = null;

var cylinderSideVertices=[];
var cylinderTopVertices=[];
var cylinderBotVertices=[];

var cylinderSideTextCoords = [];
var cylinderTopTextCoords = [];

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
              attribute vec2 aTextureCoord; \
              uniform mat4 u_modelviewMatrix; \
              uniform mat4 u_projectionMatrix; \
              varying highp vec2 vTextureCoord; \
              void main(){ \
                gl_Position = u_projectionMatrix * u_modelviewMatrix *  vec4(a_Position, 1.0); \
                vTextureCoord = aTextureCoord; \
              }';
            }
            else if(shaderName =='fshader'){
              shaderScript = 'varying highp vec2 vTextureCoord;\
                uniform sampler2D uSampler;\
                void main(){\
                  gl_FragColor = texture2D(uSampler, vTextureCoord);\
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

function initSphereBuffers() {
  var latitudeBands = 30;
  var longitudeBands = 30;
        var radius = 2;

        var vertexPositionData = [];
        var normalData = [];
        var textureCoordData = [];
        for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
            var theta = latNumber * Math.PI / latitudeBands;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);

            for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
                var phi = longNumber * 2 * Math.PI / longitudeBands;
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);

                var y = cosPhi * sinTheta;
                var x = cosTheta;
                var z = sinPhi * sinTheta;
                var u = (longNumber / longitudeBands);
                var v = 1 - (latNumber / latitudeBands); // A l'inverse porque el recorrido vertical es en el sentido contrario

                normalData.push(x);
                normalData.push(y);
                normalData.push(z);
                textureCoordData.push(u);
                textureCoordData.push(v);
                vertexPositionData.push(radius * x);
                vertexPositionData.push(radius * y);
                vertexPositionData.push(radius * z);
            }
        }

        var indexData = [];
        for (var longNumber=0; longNumber < longitudeBands; longNumber++) {
          for (var latNumber=0; latNumber < latitudeBands; latNumber++) {
                var first = (latNumber * (longitudeBands + 1)) + longNumber;
                var second = first + longitudeBands + 1;
                indexData.push(first);
                indexData.push(second);
                indexData.push(first + 1);

                indexData.push(second);
                indexData.push(second + 1);
                indexData.push(first + 1);
            }
        }

        moonVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexTextureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);
        moonVertexTextureCoordBuffer.itemSize = 2;
        moonVertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

        moonVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
        moonVertexPositionBuffer.itemSize = 3;
        moonVertexPositionBuffer.numItems = vertexPositionData.length / 3;

        moonVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
        moonVertexIndexBuffer.itemSize = 1;
        moonVertexIndexBuffer.numItems = indexData.length;
}
function drawSphere(){

  //Especificar textura para esta geometría
  //gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, moonTexture);

  //Buffer de posicion
  gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
  var a_Position = gl.getAttribLocation(program, 'a_Position');
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  //Buffer de textura
  gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexTextureCoordBuffer);
  aTextureCoord = gl.getAttribLocation(program, 'aTextureCoord');
  gl.vertexAttribPointer(aTextureCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aTextureCoord);

  gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

   modelviewMatrix.set(viewMatrix).multiply(modelMatrix); 
   gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
   gl.uniformMatrix4fv(u_projectionMatrix, false, projectionMatrix.elements);
    
}
function initCylinderBuffers() {

   //Fills the array with vertices for the entire cylinder with the specified number of segments
   AddPoints(cylinderSegments); 
   cylinderBotArray = new Float32Array(cylinderBotVertices); //Vertices for the bottom
   cylinderSideArray = new Float32Array(cylinderSideVertices); //Vertices for the sides
   cylinderTopArray = new Float32Array(cylinderTopVertices); //Vertices for the top


   //Vertex buffer for TOP
   vertexBufferCylinderTop = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferCylinderTop);
   gl.bufferData(gl.ARRAY_BUFFER, cylinderTopArray, gl.STATIC_DRAW);
   vertexBufferCylinderTop.nmbrOfVertices = cylinderTopArray.length/3;
   gl.bindBuffer(gl.ARRAY_BUFFER, null);

   // Vertexbuffer for BOTTOM
   vertexBufferCylinderBot = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferCylinderBot);
   gl.bufferData(gl.ARRAY_BUFFER, cylinderBotArray, gl.STATIC_DRAW);
   vertexBufferCylinderBot.nmbrOfVerticess = cylinderBotArray.length/3; //xyz + rgba = 7
   gl.bindBuffer(gl.ARRAY_BUFFER, null);


   //Vertex buffer for cylinder SIDES
   vertexBufferCylinderSide = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferCylinderSide);
   gl.bufferData(gl.ARRAY_BUFFER, cylinderSideArray, gl.STATIC_DRAW);
   vertexBufferCylinderSide.nmbrOfVertices = cylinderSideArray.length / 3; //xyz + rgba = 7
   gl.bindBuffer(gl.ARRAY_BUFFER, null);

   textureBufferCylinderSide = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, textureBufferCylinderSide);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cylinderSideTextCoords), gl.STATIC_DRAW);
   textureBufferCylinderSide.itemSize = 2;
   textureBufferCylinderSide.nmbrOfVertices = cylinderSideTextCoords.length/2 ; 
   gl.bindBuffer(gl.ARRAY_BUFFER, null);

   textureBufferCylinderTop = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, textureBufferCylinderTop);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cylinderTopTextCoords), gl.STATIC_DRAW);
   textureBufferCylinderTop.itemSize = 2;
   textureBufferCylinderTop.nmbrOfVertices = cylinderTopTextCoords.length / 2; //xyz + rgba = 7
   gl.bindBuffer(gl.ARRAY_BUFFER, null);

}


function initShaderParameters() {
   u_modelviewMatrix = gl.getUniformLocation(program, 'u_modelviewMatrix');
   u_projectionMatrix = gl.getUniformLocation(program, 'u_projectionMatrix');
   return true;
}

//Adds the coordinates to the vertex arrays
function AddPoints(segments) {
   a=0, b=0, x=0; //The origin
   theta = (Math.PI/180) * (360/segments); //Degrees = radians * (180 / Ï€)

   var text_step_x = 1 /segments;
   for (i =0;i<=segments;i++){
       y =  Math.cos(theta*i); 
       z =  Math.sin(theta*i);

      cylinderBotVertices.push(x-canHeight, y, z); //Bottomvertices

      cylinderSideVertices.push(x-canHeight, y, z); //Sidevertices along the bottom
      cylinderSideVertices.push(x+canHeight, y, z); //Sidevertices along the top with y = 2

      cylinderSideTextCoords.push(1-(i*text_step_x), 1);
      cylinderSideTextCoords.push(1-(i*text_step_x),0);

      cylinderTopVertices.push(x+canHeight, y, z); //Topvertices with y = 2
      var cy= (y-(-1))/(2);
      var cz= (z-(-1))/(2);
      cylinderTopTextCoords.push(cz,cy);
   }
}

function drawCylinderTop(){
   gl.bindTexture(gl.TEXTURE_2D, cylinderTopTexture);
   var stride = (3)*4; //4 bytes per vertex

   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferCylinderTop);
   a_Position = gl.getAttribLocation(program, 'a_Position');
   gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, stride, 0);
   gl.enableVertexAttribArray(a_Position);

   gl.bindBuffer(gl.ARRAY_BUFFER, textureBufferCylinderTop);
   aTextureCoord = gl.getAttribLocation(program, 'aTextureCoord');
   gl.vertexAttribPointer(aTextureCoord, 2, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray(aTextureCoord);

   gl.drawArrays(gl.TRIANGLE_FAN, 0, vertexBufferCylinderTop.nmbrOfVertices);

   modelviewMatrix.set(viewMatrix).multiply(modelMatrix);
   gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
   gl.uniformMatrix4fv(u_projectionMatrix, false, projectionMatrix.elements);

   //gl.drawArrays(gl.TRIANGLE_FAN, 0, vertexBufferCylinderTop.nmbrOfVertices);
}

function drawCylinderBot(){

   var stride = (3)*4; //4 bytes per vertex
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferCylinderBot);
   a_Position = gl.getAttribLocation(program, 'a_Position');
   gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, stride, 0);
   gl.enableVertexAttribArray(a_Position);

  
   aTextureCoord = gl.getAttribLocation(program, 'aTextureCoord');
   //gl.bindBuffer(gl.ARRAY_BUFFER)
   gl.vertexAttribPointer(aTextureCoord, 2, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray(aTextureCoord);

   modelviewMatrix.set(viewMatrix).multiply(modelMatrix); 
   gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
   gl.uniformMatrix4fv(u_projectionMatrix, false, projectionMatrix.elements);

  gl.drawArrays(gl.TRIANGLE_FAN, 0, vertexBufferCylinderTop.nmbrOfVertices);   
}

function drawCylinderSide(){

 //Stride = number of bytes per vertex (pos+color).
  var stride = (3)*4;
   gl.bindTexture(gl.TEXTURE_2D, cylinderSideTexture);

   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferCylinderSide);
   a_Position = gl.getAttribLocation(program, 'a_Position');
   gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, stride, 0);
   gl.enableVertexAttribArray(a_Position);

   gl.bindBuffer(gl.ARRAY_BUFFER, textureBufferCylinderSide);
   aTextureCoord = gl.getAttribLocation(program, 'aTextureCoord');
   gl.vertexAttribPointer(aTextureCoord, 2, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray(aTextureCoord);

   gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexBufferCylinderSide.nmbrOfVertices);

   modelviewMatrix.set(viewMatrix).multiply(modelMatrix); 
   gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
   gl.uniformMatrix4fv(u_projectionMatrix, false, projectionMatrix.elements); 


}


function setupCamera() {

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
    now *= 0.0005;  // convert to seconds
    const deltaTime = now - then;
    then = now;
    phi+=deltaTime;
    draw();

    requestAnimationFrame(render);
  }


function initSphereTexture() {
  moonTexture = gl.createTexture();
  moonTexture.image = new Image();
  moonTexture.image.onload = function () {
    handleLoadedTexture(moonTexture)
  }

  //moonTexture.image.src = "moon.gif";
  //moonTexture.image.src = "earth.jpg";
  moonTexture.image.src = "1_earth_8k.jpg";
}
function handleLoadedTexture(texture) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.bindTexture(gl.TEXTURE_2D, null);
}

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url, texture) {
  texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn of mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
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

   initCylinderBuffers();
   initSphereBuffers();
   cylinderTopTexture = loadTexture(gl, 'coketop.jpg', cylinderTopTexture);
   cylinderSideTexture = loadTexture(gl, 'coke.jpg', cylinderSideTexture);
   initSphereTexture();
  

   if (!initShaderParameters())
      return;

  requestAnimationFrame(render);
}

function toggleSphere(){
  showSphere=true;
  showCylinder=false;
  showCone =false;

  var body = document.getElementsByTagName('canvas')[0];
  body.style.backgroundImage = "url('stars.jpg')";
}
function toggleCylinder(){
  showSphere=false;
  showCylinder=true;
  showCone =false;

  var body = document.getElementsByTagName('canvas')[0];
  body.style.backgroundImage = "url('cokeBck.jpg')";

}
function toggleCone(){
  showSphere=false;
  showCylinder=false;
  showCone =true;

  var body = document.getElementsByTagName('canvas')[0];
  body.style.backgroundImage = "url('stars.jpg')";
}
function draw() {
   gl.clearColor(0.0, 0.0, 0.0, 0.2); //RGBA

   gl.clear(gl.COLOR_BUFFER_BIT);
   gl.enable(gl.DEPTH_TEST);
   gl.depthFunc(gl.LESS);
   setupCamera();
   
   modelMatrix.setIdentity();  

   if(showSphere) drawSphere();
   if(showCylinder){
    drawCylinderTop();
     drawCylinderBot();
     drawCylinderSide();  
   }
}
main();