/**
 * @file A simple WebGL example drawing a circle
 * @author Eric Shaffer <shaffer1@illinois.edu>  
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var vertexPositionBuffer;

/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;

/** @global The Illinois Logo Vertex position array */
var illinoisVertex;

/** @global The Modelview matrix */
var mvMatrix = glMatrix.mat4.create();

/** @global The Projection matrix */
var pMatrix = glMatrix.mat4.create();

/** @global The Translation Vector & Variable */
var translateVec = glMatrix.vec3.create();
var translateVecX = 0.0;
var translateVecY = 0.0;
var translateVecZ = -3.0;

/** @global The Scaling Vector & Init Value */
var scaleVec = glMatrix.vec3.create();
var scaleVecX = 1.0;
var scaleVecY = 1.0;
var scaleVecZ = 1.0;

/** @global Amount to rotate in radians */
var squareRotation = 0.0;

/** @global Rotation Rate */
var squareRotateRate = 0.001;

/** @global The angle of rotation around the x axis */
var angle = 0;

/** @global Two times pi to save some multiplications...*/
const twicePi=2.0*Math.PI;

/** @global Two times pi to save some multiplications...*/
var fieldOfView = 45;

/** @global Near bound of the frustum...*/
var zNear = 0.1;

/** @global Far bound of the frustum, can be null or Infinity...*/
var zFar = 100;

/** @global Count the frames we render....*/
var frameNumber =0;

/** @global Record last time calling animation...*/
var lastTime = 0;

/** @global Button Selection status...*/
var btnStatus = "btn_dancing";

/** @global Record last Animation status...*/
var lastStatus = "btn_dancing";

//** Used to draw Illnois Logo
//** Logo body outline width for x-axis
var bodyXOuterwidth = 0.6;

//** Logo body outline width for y-axis
var bodyYOuterwidth = 0.88;

//** Logo body Inner width for x-axis
var bodyXInnerwidth = 0.34;

//** Logo body Inner width for y-axis
var bodyYInnerwidth = 0.46;

//** Logo body Inner width for x-axis
var lineWidth = 0.06;

//** Used to draw Youtube Logo
//** Logo body outline width for x-axis
var YoutubeOuterX = 0.88;

//** Logo body outline width for y-axis
var YoutubeOuterY = 0.66;

//** Triangle Side Length
var YoutubeHalfLen = 0.3;

//** Triangle Side Length
var YoutubeSideLen = 2 * YoutubeHalfLen;

//** Triangle right
var YoutubeSqrtLen = Math.sqrt(3) * YoutubeHalfLen;

/** @global Number of verteces in Youtube Background part */
var numOfVerteces = 30;

/** @global Color in 1.0 scale for all verteces RGBA */
var colorValSet = [];

/** @global Color change direction for all verteces */
var colorDirSet = [];

/** @global Color change rate */
var colorChangeRate = 0.01;

/** @global Color Pattern for mosaic */
var mosaicItv = 0.1;


//----------------------------------------------------------------------------------

/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}

/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
}

/**
 * Populate vertex buffer with data
 */
function loadVertices() {
    // vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);

  // Assignment
  // var triangleVertices = illinoisVertex;

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(illinoisVertex), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = 90;
}

/**
 * Populate color buffer with data
  @param {number} number of vertices to use around the circle boundary
 */
function loadColors() {
  // vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  var colors = [
  // Color for out-line
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0, 
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0,
        0.0, 0.2, 0.4, 1.0, 
  // Color for body
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
        0.9, 0.29, 0.15, 1.0,
    ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numberOfItems = 90;  
}


/**
 * Non-uniform transformation motion
   @param {number} number of vertices to use around the circle boundary
 */
function nonUniTransform() {
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  var sinVertex = [];

  for(i = 0, cnt = 0; i < 90; ++i) {
    sinVertex.push(illinoisVertex[cnt++] + angle);
    sinVertex.push(illinoisVertex[cnt++] + 0.6 * Math.sin((5 * angle)));
    sinVertex.push(illinoisVertex[cnt++]);
  }

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sinVertex), gl.DYNAMIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = 90;
}

/**
 * Populate buffers with data
 */
function setupDancingBuffers() {
    
  //Generate the vertex positions    
  loadVertices();

  //Generate the vertex colors
  loadColors();
}

function setupYoutubeBuffers() {
  // vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  var triangleVertices = [
      // Center triangle 
      -YoutubeSqrtLen / 2, YoutubeHalfLen, 0.0,
      -YoutubeSqrtLen / 2, -YoutubeHalfLen, 0.0,
      YoutubeSqrtLen / 2, 0, 0,

      -YoutubeOuterX, YoutubeOuterY, 0.0,
      -YoutubeOuterX, -YoutubeOuterY, 0.0, 
      -YoutubeSqrtLen / 2, -YoutubeOuterY, 0.0, 
      -YoutubeSqrtLen / 2, -YoutubeOuterY, 0.0, 
      -YoutubeOuterX, YoutubeOuterY, 0.0,
      -YoutubeSqrtLen / 2, YoutubeOuterY, 0.0,
      
      -YoutubeSqrtLen / 2, YoutubeOuterY, 0.0,
      -YoutubeSqrtLen / 2, YoutubeHalfLen, 0.0,
      YoutubeOuterX, YoutubeOuterY, 0.0,
      -YoutubeSqrtLen / 2, YoutubeHalfLen, 0.0,
      YoutubeOuterX, YoutubeOuterY, 0.0,
      YoutubeOuterX, YoutubeHalfLen, 0.0,
      
      -YoutubeSqrtLen / 2, YoutubeHalfLen, 0.0,
      YoutubeOuterX, YoutubeHalfLen, 0.0,
      YoutubeSqrtLen / 2, 0, 0,
      YoutubeSqrtLen / 2, 0, 0,
      YoutubeOuterX, YoutubeHalfLen, 0.0,
      YoutubeOuterX, -YoutubeHalfLen, 0.0,
      
      YoutubeSqrtLen / 2, 0, 0,      
      -YoutubeSqrtLen / 2, -YoutubeHalfLen, 0.0,
      YoutubeOuterX, -YoutubeHalfLen, 0.0,
      
      -YoutubeSqrtLen / 2, -YoutubeHalfLen, 0.0,
      -YoutubeSqrtLen / 2, -YoutubeOuterY, 0.0,
      YoutubeOuterX, -YoutubeOuterY, 0.0,
      
      YoutubeOuterX, -YoutubeHalfLen, 0.0,
      -YoutubeSqrtLen / 2, -YoutubeHalfLen, 0.0,
      YoutubeOuterX, -YoutubeOuterY, 0.0,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = numOfVerteces;

  // vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);

  var colors = [];

  if(frameNumber < 200) {
    colors = [
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,

      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,  
    ];
  } else {
    setColorValSet();
    colors = colorValSet;
  }
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numberOfItems = numOfVerteces;
}


/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 

  glMatrix.mat4.identity(mvMatrix); //model-view matrix
  glMatrix.mat4.identity(pMatrix);  //perspective matrix
  
  // if(frameNumber >= 1000) {
  //   if(fieldOfView <= 125)
  //     fieldOfView += 0.01;     
  // }

  const fOV = fieldOfView * Math.PI / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  zNear = 0.1;
  zFar = 100.0;
  glMatrix.mat4.perspective(pMatrix, fOV, aspect, zNear, zFar);

  glMatrix.vec3.set(translateVec, translateVecX, translateVecY, translateVecZ);
  glMatrix.vec3.set(scaleVec, scaleVecX, scaleVecY, scaleVecZ);

  glMatrix.mat4.translate(mvMatrix, mvMatrix, translateVec);

  if(btnStatus == "btn_dancing" && frameNumber < 200 || btnStatus == "btn_diy")
    glMatrix.mat4.rotate(mvMatrix, mvMatrix, squareRotation, [0, 1, 0]);
  
  glMatrix.mat4.scale(mvMatrix, mvMatrix, scaleVec);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

/**
 * Animation to be called from tick. Updates globals and performs animation for each tick.
 */
function animate() {
  var timeNow = new Date().getTime();
  var elapsedTime = timeNow - lastTime;

  if(lastTime != 0) {
    if (btnStatus == "btn_dancing") {
      console.log("I'm Dancing!!");

      if(lastStatus == "btn_diy") {
        setupDancingBuffers();
        frameNumber = 0;
        angle = 0;
        translateVecX = 0.0;
        translateVecY = 0.0;
        translateVecZ = -3.0;
        scaleVecX = scaleVecY = 1;
      }

      // nonUniTransform();

      if(frameNumber < 100) {
        translateVecX += 0.01;
        translateVecY += 0.01;
        translateVecZ -= 0.03;
      } else if(frameNumber >= 100 && frameNumber < 200) {
        translateVecX -= 0.01;
        translateVecY -= 0.01;
        translateVecZ += 0.02;
      } else if(frameNumber >= 200 && frameNumber < 300) {
        scaleVecX -= 0.005;
        scaleVecY -= 0.005;
      } else if(frameNumber >= 300 && frameNumber < 400) {
        scaleVecX += 0.003;
        scaleVecY += 0.003;
      } else if(frameNumber >= 400) {
        var temp = Math.floor((frameNumber -400) / 120);
        if(temp % 2 == 0)
          angle += 0.01;
        else
          angle -= 0.01;
        nonUniTransform();
      }

    } else if(btnStatus == "btn_diy") {
      console.log("I'm DIY!!");
      setupYoutubeBuffers();

      if(lastStatus == "btn_dancing") {
        // setupYoutubeBuffers();
        initColorValSet();
        // colorVal = 1.0;
        frameNumber = 0;
        translateVecX = 0.0;
        translateVecY = 0.0;
        translateVecZ = -3.0;
        scaleVecX = scaleVecY = 1;
      }
      
    } else {
      alert("Error!!Invalid Button btnStatus!");
    }
  }

  squareRotation += elapsedTime * squareRotateRate;

  lastTime = timeNow;
  lastStatus = btnStatus;
  // Need to load again
}

function initVertexBuffer() {
  illinoisVertex = [
    // Blue outer-horizontal line
    -bodyXOuterwidth, bodyYOuterwidth + lineWidth, 0.0,
    -bodyXOuterwidth, bodyYOuterwidth, 0.0, 
    bodyXOuterwidth, bodyYOuterwidth, 0.0, 
    bodyXOuterwidth, bodyYOuterwidth + lineWidth, 0.0, 
    -bodyXOuterwidth, bodyYOuterwidth + lineWidth, 0.0, 
    bodyXOuterwidth, bodyYOuterwidth, 0.0, 
    
    -bodyXOuterwidth, -(bodyYOuterwidth + lineWidth), 0.0,
    -bodyXOuterwidth, -bodyYOuterwidth, 0.0, 
    bodyXOuterwidth, -bodyYOuterwidth, 0.0, 
    bodyXOuterwidth, -(bodyYOuterwidth + lineWidth), 0.0,
    -bodyXOuterwidth, -(bodyYOuterwidth + lineWidth), 0.0,
    bodyXOuterwidth, -bodyYOuterwidth, 0.0,
    
    // Blue outer-vertical line
    -(bodyXOuterwidth + lineWidth), bodyYOuterwidth + lineWidth, 0.0,
    -(bodyXOuterwidth + lineWidth), bodyYInnerwidth - lineWidth, 0.0,
    -bodyXOuterwidth, bodyYInnerwidth - lineWidth, 0.0,
    -(bodyXOuterwidth + lineWidth), bodyYOuterwidth + lineWidth, 0.0,
    -bodyXOuterwidth, bodyYOuterwidth + lineWidth, 0.0,
    -bodyXOuterwidth, bodyYInnerwidth - lineWidth, 0.0,
    
    bodyXOuterwidth + lineWidth, bodyYOuterwidth + lineWidth, 0.0,
    bodyXOuterwidth + lineWidth, bodyYInnerwidth - lineWidth, 0.0,
    bodyXOuterwidth, bodyYInnerwidth - lineWidth, 0.0,
    bodyXOuterwidth + lineWidth, bodyYOuterwidth + lineWidth, 0.0,
    bodyXOuterwidth, bodyYOuterwidth + lineWidth, 0.0,
    bodyXOuterwidth, bodyYInnerwidth - lineWidth, 0.0,
    
    -(bodyXOuterwidth + lineWidth), -(bodyYOuterwidth + lineWidth), 0.0,
    -(bodyXOuterwidth + lineWidth), -(bodyYInnerwidth - lineWidth), 0.0,
    -bodyXOuterwidth, -(bodyYInnerwidth - lineWidth), 0.0,
    -(bodyXOuterwidth + lineWidth), -(bodyYOuterwidth + lineWidth), 0.0,
    -bodyXOuterwidth, -(bodyYOuterwidth + lineWidth), 0.0,
    -bodyXOuterwidth, -(bodyYInnerwidth - lineWidth), 0.0,
    
    bodyXOuterwidth + lineWidth, -(bodyYOuterwidth + lineWidth), 0.0,
    bodyXOuterwidth + lineWidth, -(bodyYInnerwidth - lineWidth), 0.0,
    bodyXOuterwidth, -(bodyYInnerwidth - lineWidth), 0.0,
    bodyXOuterwidth + lineWidth, -(bodyYOuterwidth + lineWidth), 0.0,
    bodyXOuterwidth, -(bodyYOuterwidth + lineWidth), 0.0,
    bodyXOuterwidth, -(bodyYInnerwidth - lineWidth), 0.0,  
    
    // Blue Inner-Horizontal line       
    -bodyXOuterwidth, bodyYInnerwidth, 0.0,
    -bodyXOuterwidth, bodyYInnerwidth - lineWidth, 0.0,
    -bodyXInnerwidth, bodyYInnerwidth - lineWidth, 0.0,
    -bodyXInnerwidth, bodyYInnerwidth - lineWidth, 0.0,
    -bodyXOuterwidth, bodyYInnerwidth, 0.0,
    -bodyXInnerwidth, bodyYInnerwidth, 0.0,
    
    -bodyXOuterwidth, -bodyYInnerwidth, 0.0,
    -bodyXOuterwidth, -(bodyYInnerwidth - lineWidth), 0.0,
    -bodyXInnerwidth, -(bodyYInnerwidth - lineWidth), 0.0,
    -bodyXInnerwidth, -(bodyYInnerwidth - lineWidth), 0.0,
    -bodyXOuterwidth, -bodyYInnerwidth, 0.0,
    -bodyXInnerwidth, -bodyYInnerwidth, 0.0,  
    
    bodyXOuterwidth, bodyYInnerwidth, 0.0,
    bodyXOuterwidth, bodyYInnerwidth - lineWidth, 0.0,
    bodyXInnerwidth, bodyYInnerwidth - lineWidth, 0.0,
    bodyXInnerwidth, bodyYInnerwidth - lineWidth, 0.0,
    bodyXOuterwidth, bodyYInnerwidth, 0.0,
    bodyXInnerwidth, bodyYInnerwidth, 0.0,
    
    bodyXOuterwidth, -bodyYInnerwidth, 0.0,
    bodyXOuterwidth, -(bodyYInnerwidth - lineWidth), 0.0,
    bodyXInnerwidth, -(bodyYInnerwidth - lineWidth), 0.0,
    bodyXInnerwidth, -(bodyYInnerwidth - lineWidth), 0.0,
    bodyXOuterwidth, -bodyYInnerwidth, 0.0,
    bodyXInnerwidth, -bodyYInnerwidth, 0.0,  
    
    // Blue Inner-Vertical line       
    -(bodyXInnerwidth + lineWidth), bodyYInnerwidth - lineWidth, 0.0,
    -(bodyXInnerwidth + lineWidth), -(bodyXInnerwidth + lineWidth), 0.0,
    -bodyXInnerwidth, -(bodyYInnerwidth - lineWidth), 0.0,
    -bodyXInnerwidth, -(bodyYInnerwidth - lineWidth), 0.0,
    -(bodyXInnerwidth + lineWidth), bodyYInnerwidth - lineWidth, 0.0,
    -bodyXInnerwidth, bodyYInnerwidth - lineWidth, 0.0,
    
    bodyXInnerwidth + lineWidth, bodyYInnerwidth - lineWidth, 0.0,
    bodyXInnerwidth + lineWidth, -(bodyXInnerwidth + lineWidth), 0.0,
    bodyXInnerwidth, -(bodyYInnerwidth - lineWidth), 0.0,
    bodyXInnerwidth, -(bodyYInnerwidth - lineWidth), 0.0,
    bodyXInnerwidth + lineWidth, bodyYInnerwidth - lineWidth, 0.0,
    bodyXInnerwidth, bodyYInnerwidth - lineWidth, 0.0,
    
    // Orange body
    -bodyXOuterwidth, bodyYOuterwidth, 0.0,
    -bodyXOuterwidth, bodyYInnerwidth, 0.0,
    bodyXOuterwidth, bodyYOuterwidth, 0.0,
    bodyXOuterwidth, bodyYInnerwidth, 0.0,
    -bodyXOuterwidth, bodyYInnerwidth, 0.0,
    bodyXOuterwidth, bodyYOuterwidth, 0.0,
    
    -bodyXInnerwidth,bodyYInnerwidth, 0.0,
    -bodyXInnerwidth,-bodyYInnerwidth, 0.0,
    bodyXInnerwidth,bodyYInnerwidth, 0.0,
    bodyXInnerwidth,-bodyYInnerwidth, 0.0,
    -bodyXInnerwidth,-bodyYInnerwidth, 0.0,
    bodyXInnerwidth,bodyYInnerwidth, 0.0,
    
    -bodyXOuterwidth, -bodyYInnerwidth, 0.0,
    -bodyXOuterwidth, -bodyYOuterwidth, 0.0,
    bodyXOuterwidth, -bodyYInnerwidth, 0.0,
    bodyXOuterwidth, -bodyYOuterwidth, 0.0,
    -bodyXOuterwidth, -bodyYOuterwidth, 0.0,
    bodyXOuterwidth, -bodyYInnerwidth, 0.0,
  ];
}


/**
 * Initialize color value & direction set .
 */
function initColorValSet() {
  
  colorValSet = [];
  colorDirSet = [];

  for(i = 0, itv = 0.0; i < numOfVerteces; ++i) {
    if(i % 3 == 0 && i != 0)
       itv += mosaicItv;
    colorValSet.push(1.0 - itv);
    colorValSet.push(1.0 - itv);
    colorValSet.push(1.0 - itv);
    colorValSet.push(1.0);
    colorDirSet.push(1);
  }
  // console.log("Size is", colorValSet.length);
}

/**
 * Set gradient color change for triangles seperately.
 */
function setColorValSet() {
  for(i = 0; i < numOfVerteces; ++i) {
    var colorVal = colorValSet[4 * i];
    if(colorDirSet[i] == 0)
      colorVal -= colorChangeRate;
    else
      colorVal += colorChangeRate;
    if(colorVal >= 1.0) {
      colorVal = 1.0;
      colorDirSet[i] = 0;
    } else if(colorVal <= 0.0) {
      colorVal = 0.0;
      colorDirSet[i] = 1;
    }

    for(j = 4 * i; j < 4 * i + 3; j++) {
      colorValSet[j] = colorVal;
    }
  }
}

/**
 * Onclick function to switch for radio button.
 */
function switchAnimate(btn) {
  var curID = btn.id;
  switch (curID) {
    case "btn_dancing":
      btnStatus = "btn_dancing";
      break;
    case "btn_diy":
      btnStatus = "btn_diy";
      break;
    default:
      return false;
  }
}

/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("logo");
  gl = createGLContext(canvas);
  setupShaders(); 
  vertexPositionBuffer = gl.createBuffer();
  vertexColorBuffer = gl.createBuffer();
  initVertexBuffer();
  setupDancingBuffers();

  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  tick();
  // draw();
}

/**
 * Tick called for every animation frame.
 */
function tick() {
    // console.log("Monitor Color ",colorVal);
    frameNumber=frameNumber+1;
    requestAnimationFrame(tick);
    draw();
    animate();
}

