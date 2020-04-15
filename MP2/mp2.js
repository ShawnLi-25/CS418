/**
 * @MP2-CS418: 3D Terrain Modeling 
 * @author Xiang Li <xiangl14@illinois.edu>  
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

var mat4 = glMatrix.mat4;
var mat3 = glMatrix.mat3;
var quat = glMatrix.quat;
var vec3 = glMatrix.vec3;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The Modelview matrix */
var mvMatrix = mat4.create();

/** @global The Projection matrix */
var pMatrix = mat4.create();

/** @global The Normal matrix */
var nMatrix = mat3.create();

/** @global The matrix stack for hierarchical modeling */
var mvMatrixStack = [];

/** @global The angle of rotation around the y axis */
var viewRot = 10;

/** @global A glmatrix vector to use for transformations */
var transformVec = vec3.create();    

// Initialize the vector....
vec3.set(transformVec,0.0,0.0,-2.0);

/** @global An object holding the geometry for a 3D terrain */
var myTerrain;


// View parameters
/** @global Location of the camera in world coordinates */
var eyePt = vec3.fromValues(0.0, 0.1, 0.4);
/** @global Direction of the view in world coordinates */
var viewDir = vec3.fromValues(0.0, 0.0, -1.0);
/** @global Up vector for view matrix creation, in world coordinates */
var up = vec3.fromValues(0.0, 1.0, 0.0);
/** @global Location of a point along viewDir in world coordinates */
var viewPt = vec3.fromValues(0.0, 0.0, 0.0);
/** @global Near bound of the frustum */
var zNear = 0.1;
/** @global Far bound of the frustum, can be null or Infinity */
var zFar = 200;
/** @global FieldOfView */
var fov = 36;

//Light parameters
/** @global Light position in VIEW coordinates */
var lightPosition = [0,3,3];
var lightPosition2 = [3,0,3];
var lightPosition3 = [3,3,0];

/** @global Ambient light color/intensity for Phong reflection */
var lAmbient = [0,0,0];
/** @global Diffuse light color/intensity for Phong reflection */
var lDiffuse = [0.6,0.6,0.6];
/** @global Specular light color/intensity for Phong reflection */
var lSpecular =[0.1,0.1,0.1];

//Material parameters
/** @global Ambient material color/intensity for Phong reflection */
var kAmbient = [1.0,1.0,1.0];
/** @global Diffuse material color/intensity for Phong reflection */
var kTerrainDiffuse = [205.0/255.0,163.0/255.0,63.0/255.0];

/** @global (Self-defined) Diffuse material color/intensity to set elevation-based color map for Phong reflection */
var pink = [255.0/255.0, 174.0/255.0, 174.0/255.0];
var brown = [85.0/255.0, 65.0/255.0, 36.0/255.0];
var green = [30.0/255.0, 196.0/255.0, 100.0/255.0];
var blue = [33.0/255.0, 107.0/255.0, 214.0/255.0];
var purple = [172.0/255.0, 139.0/255.0, 204.0/255.0];

/** @global Specular material color/intensity for Phong reflection */
var kSpecular = [0.0,0.0,0.0];
/** @global Shininess exponent for Phong reflection */
var shininess = 28; //When using Blinn-Phong, picking larger shiness exponent? Nothing changes? 
/** @global Edge color fpr wireframeish rendering */
var kEdgeBlack = [0.0,0.0,0.0];
/** @global Edge color for wireframe rendering */
var kEdgeWhite = [1.0,1.0,1.0];
/** @global Fog Color */ 
var fogColor = [1.0, 1.0, 1.0, 1.0];
/** @global Fog density defines how much of the color is fog (0:all fog, 1:no fog) */ 
var fogDensity = 0.5;
/** @global Delta degree add to roll/pitch degree each frame */ 
var deltaDegree = 0.5;
/** @global Delta speed add to speedFactor each frame */ 
var deltaSpeed = 0.001;

/** @global Object acts as entry for different key controls (Replace problematic switch-case) */
var keys = {};
keys["ArrowLeft"]  = function() { rollDegree < 180 ? rollDegree += deltaDegree : rollDegree; };
keys["ArrowRight"] = function() { rollDegree > -180 ? rollDegree -= deltaDegree : rollDegree; };
keys["ArrowUp"]    = function() { pitchDegree < 180 ? pitchDegree += deltaDegree : pitchDegree; };
keys["ArrowDown"]  = function() { pitchDegree > -180 ? pitchDegree -= deltaDegree : pitchDegree; };
keys["Equal"]      = function() { speedFactor < 0.05 ? speedFactor += deltaSpeed : speedFactor; };
keys["Minus"]      = function() { speedFactor > -0.05 ? speedFactor -= deltaSpeed : speedFactor; };

/** @global Record the state of current pressed-down-key */
var keyState = keys.NONE;

/** @global Record the state of current pressed-down-key */
var quaternion = quat.create();
var speedFactor = 0.001; 
var rollDegree = 0;
var pitchDegree = 0;
var yewDegree = 0;

//-------------------------------------------------------------------------
/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
/**
 * Pushes matrix onto modelview matrix stack
 */
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


//----------------------------------------------------------------------------------
/**
 * Pops matrix off of modelview matrix stack
 */
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
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

//----------------------------------------------------------------------------------
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

//----------------------------------------------------------------------------------
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

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);  

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
  shaderProgram.uniformShininessLoc = gl.getUniformLocation(shaderProgram, "uShininess");    
  shaderProgram.uniformAmbientMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKAmbient");  
  shaderProgram.uniformDiffuseMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKDiffuse");
  shaderProgram.uniformSpecularMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKSpecular");
  shaderProgram.uniformFogColor = gl.getUniformLocation(shaderProgram, "uFogColor");
  shaderProgram.uniformFogDensity = gl.getUniformLocation(shaderProgram, "uFogDensity");
}

//-------------------------------------------------------------------------
/**
 * Sends material information to the shader
 * @param {Float32} alpha shininess coefficient
 * @param {Float32Array} a Ambient material color
 * @param {Float32Array} d Diffuse material color
 * @param {Float32Array} s Specular material color
 */
function setMaterialUniforms(alpha,a,d,s) {
  gl.uniform1f(shaderProgram.uniformShininessLoc, alpha);
  gl.uniform3fv(shaderProgram.uniformAmbientMaterialColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseMaterialColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularMaterialColorLoc, s);
}

//-------------------------------------------------------------------------
/**
 * Sends light information to the shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} s Specular light strength
 */
function setLightUniforms(loc1, loc2, loc3, a, d, s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc[0], loc1);
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc[1], loc2);
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc[2], loc3);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

//-------------------------------------------------------------------------
/**
 * Setting fog effect
 * @param {Float32Array} fogColor
 * @param {Float32} fogFactor
 */
function setFogUniforms(fogColor, fogDensity) {
  gl.uniform4fv(shaderProgram.uniformFogColor, fogColor);
  gl.uniform1f(shaderProgram.uniformFogDensity, fogDensity);
}

//----------------------------------------------------------------------------------
/**
 * Populate buffers with data
 */
function setupBuffers() {
    myTerrain = new Terrain(64, -0.5, 0.5, -0.5, 0.5);
    myTerrain.loadBuffers();
}
/**
 * Change degree/speed of flight
 */
function setFlyState() {
  /** Remember in switch-case block, must add break for each case, otherwise all the other cases will run too!! */ 

  if(typeof keys[keyState] == "function") {
    keys[keyState]();
  }

  setOrientation(keyState);
  setMovement();

  // Set for showcase
  document.getElementById("roll").value = rollDegree;
  document.getElementById("pitch").value = pitchDegree;
  document.getElementById("speed").value = speedFactor;
}

function setOrientation() {
  // Create a temporary quaterion based on Euler angle
  let temp = getTempQuat();

  // Update quaternion
  quat.mul(quaternion, quaternion, temp);
  vec3.transformQuat(viewDir, viewDir, temp);
  vec3.transformQuat(up, up, temp);
}

function getTempQuat() {
  let temp = quat.create();
  if (keyState == "ArrowLeft") {
    quat.fromEuler(temp, 0, 0, -deltaDegree);
  } else if(keyState == "ArrowRight") {
    quat.fromEuler(temp, 0, 0, deltaDegree);
  } else if(keyState == "ArrowUp") {
    quat.fromEuler(temp, deltaDegree, 0, 0);
  } else if(keyState == "ArrowDown") {
    quat.fromEuler(temp, -deltaDegree, 0, 0);
  }

  return temp;
}

function setMovement() {
    let moveVec = vec3.create(); 
    // Move the camera in the scene
    vec3.scale(moveVec, viewDir, speedFactor);
    vec3.add(eyePt, eyePt, moveVec);
}

//----------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
    var transformVec = vec3.create();
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

    // Adjust orientation & flying speed
    setFlyState();
    // console.log(keyState, rollDegree, pitchDegree, speedFactor);

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Perspective Transform 
    mat4.perspective(pMatrix,degToRad(fov), aspect, zNear, zFar);

    // We want to look down -z, so create a lookat point in that direction    
    vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);    
 
    //Draw Terrain
    mvPushMatrix();
    vec3.set(transformVec,0.0,-0.25,-2.0);
    mat4.translate(mvMatrix, mvMatrix,transformVec);
    mat4.rotateY(mvMatrix, mvMatrix, degToRad(viewRot));
    mat4.rotateX(mvMatrix, mvMatrix, degToRad(-75));
    setMatrixUniforms();
    setLightUniforms(lightPosition, lightPosition2, lightPosition3, lAmbient, lDiffuse, lSpecular);

    if (document.getElementById("foggy").checked) {
      fogDensity = 0.5;
      setFogUniforms(fogColor, fogDensity);
    } 

    else if (document.getElementById("nofog").checked) {
      fogDensity = 1.0;
      setFogUniforms(fogColor, fogDensity);
    }
    
    if (document.getElementById("polygon").checked)
    { 
      setMaterialUniforms(shininess,kAmbient,kTerrainDiffuse,kSpecular); 
      myTerrain.drawTriangles();
    }

    else if (document.getElementById("wireframe").checked)
    {
      setMaterialUniforms(shininess,kAmbient,kEdgeWhite,kSpecular);
      myTerrain.drawEdges();
    }
    mvPopMatrix();

  
}

//----------------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("terrain");
  document.onkeypress = keypress;
  document.onkeydown = keydown;
  document.onkeyup = keyup;
  gl = createGLContext(canvas);
  setupShaders();
  setupBuffers();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

//----------------------------------------------------------------------------------
/**
 * Keeping drawing frames....
 */
function tick() {
    requestAnimFrame(tick);
    draw();
}

//----------------------------------------------------------------------------------
/**
 * Function for handle DOM event....
 */
function keypress(event) {
  event.preventDefault();  
  console.log(event.code);
} 

function keydown(event) {
  keyState = event.code;
}

function keyup(event) {
  keyState = "";
}
