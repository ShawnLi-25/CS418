/**
 * @file A simple WebGL example for viewing meshes read from OBJ files
 * @author Eric Shaffer <shaffer1@illinois.edu>
 *         Xiang Li <xiangl14@illinois.edu>
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A GLSL shader program for teapot */
var shaderProgram;

/** @global A GLSL shader program for skybox */
var skyboxShaderProgram;

/** @global The Modelview matrix */
var mvMatrix = mat4.create();

/** @global The Model matrix */
var mMatrix = mat4.create();

/** @global The View matrix */
var vMatrix = mat4.create();

/** @global The Projection matrix */
var pMatrix = mat4.create();

/** @global The Normal matrix */
var nMatrix = mat3.create();

/** @global The matrix stack for hierarchical modeling */
var mvMatrixStack = [];

/** @global The matrix stack for hierarchical modeling */
var mMatrixStack = [];

/** @global An object holding the geometry for a 3D mesh */
var myMesh;

/** @global An object of skybox */
var mySkyBox;

// View parameters
/** @global Location of the camera in world coordinates */
var eyePt = vec3.fromValues(0.0,1.0,10.0);
/** @global Direction of the view in world coordinates */
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
/** @global Up vector for view matrix creation, in world coordinates */
var up = vec3.fromValues(0.0,1.0,0.0);
/** @global Location of a point along viewDir in world coordinates */
var viewPt = vec3.fromValues(0.0,1.0,0.0);

//Light parameters
/** @global Light position in VIEW coordinates */
var lightPosition = [0,5,5];
/** @global Ambient light color/intensity for Phong reflection */
var lAmbient = [0,0,0];
/** @global Diffuse light color/intensity for Phong reflection */
var lDiffuse = [1,1,1];
/** @global Specular light color/intensity for Phong reflection */
var lSpecular =[0,0,0];

//Material parameters
/** @global Ambient material color/intensity for Phong reflection */
var kAmbient = [1.0,1.0,1.0];
/** @global Diffuse material color/intensity for Phong reflection */
var kTerrainDiffuse = [205.0/255.0,163.0/255.0,63.0/255.0];
/** @global Specular material color/intensity for Phong reflection */
var kSpecular = [0.0,0.0,0.0];
/** @global Shininess exponent for Phong reflection */
var shininess = 66;
/** @global Edge color fpr wireframeish rendering */
var kEdgeBlack = [0.0,0.0,0.0];
/** @global Edge color for wireframe rendering */
var kEdgeWhite = [1.0,1.0,1.0];

/** @global Angle of rotation around Y */
var eulerY = 0;

/** @global Image location */
var imgUrl =  "SanFrancisco/";

/** @global Obj mesh file name */
var meshName = "teapot.obj";

/** @global Buffer for vertex position & normal */
var positionBuffer;
var normalBuffer;

/** @global Texture used for Teapot & Skybox (texture unit 0 here) */
var texture = 0;

/** @global Shader type (Phong:0, reflective:1, refractive:2) */
var shaderType = 1;

/** @global Size of skybox */
var skyboxSize = 50;

/** @global Speed of teapot orbiting */
var orbitSpeed = 3;

/** @global Speed of teapot rotating */
var rotateSpeed = 5;

//----------------------- Functions ---------------------------
/**
 * Asynchronously read a server-side text file
 */
function asyncGetFile(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.onload = () => resolve(xhr.responseText);
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send();
        console.log("Send GET text file request");
    });
}

/**
 * Sends material information to the shader
 * @param {Float32} alpha shininess coefficient
 * @param {Float32Array} a Ambient material color
 * @param {Float32Array} d Diffuse material color
 * @param {Float32Array} s Specular material color
 */
function setMaterialUniforms(alpha,a,d,s) {
    gl.useProgram(shaderProgram);
    gl.uniform1f(shaderProgram.uniformShininessLoc, alpha);
    gl.uniform3fv(shaderProgram.uniformAmbientMaterialColorLoc, a);
    gl.uniform3fv(shaderProgram.uniformDiffuseMaterialColorLoc, d);
    gl.uniform3fv(shaderProgram.uniformSpecularMaterialColorLoc, s);
}

/**
 * Sends light information to the shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} s Specular light strength
 */
function setLightUniforms(loc,a,d,s) {
    gl.useProgram(shaderProgram);
    gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
    gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
    gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
    gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    gl.uniformMatrix4fv(shaderProgram.vMatrixUniform, false, vMatrix);
    gl.uniformMatrix4fv(shaderProgram.mMatrixUniform, false, mMatrix);
}

/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform,false, pMatrix);
}

/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
    mat3.fromMat4(nMatrix,mvMatrix);
    mat3.transpose(nMatrix,nMatrix);
    mat3.invert(nMatrix,nMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

/**
 * Generates skybox texture to the shader
 */
function uploadTextureToShader() {
    gl.uniform1i(shaderProgram.uniformShaderType, shaderType);
    gl.uniform1i(shaderProgram.uniformTexture, 0);
}

/**
 * Pushes matrix onto modelview matrix stack
 */
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}

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
 * Pushes matrix onto model matrix stack
 */
function mPushMatrix() {
    var copy = mat4.clone(mMatrix);
    mMatrixStack.push(copy);
}

//----------------------------------------------------------------------------------
/**
 * Pops matrix off of model matrix stack
 */
function mPopMatrix() {
    if (mMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mMatrix = mMatrixStack.pop();
}

/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    gl.useProgram(shaderProgram);
    gl.uniform3fv(shaderProgram.uniformWorldCameraPos, eyePt);
    uploadTextureToShader();
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

/**
 * Sends projection/modelview matrices to skybox shader
 */
function setSkyboxMatrixUniforms() {
    gl.useProgram(skyboxShaderProgram);
    gl.uniform1i(skyboxShaderProgram.uniformSkyboxLoc, 0);
    gl.uniformMatrix4fv(skyboxShaderProgram.vMatrixUniform, false, vMatrix);
    gl.uniformMatrix4fv(skyboxShaderProgram.pMatrixUniform, false, pMatrix);
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
 * @param {number} value Value to determine whether it is a power of 2
 * @return {boolean} Boolean of whether value is a power of 2
 */
function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

//----------------------- WebGL Basic --------------------------------------------
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

    var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS)

    if (!compiled) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    console.log(id + shader);
    return shader;
}

//-------------------------- Set up Texture --------------------------------------
/**
 * Setup texture by loading images for skybox/teapot environment
 */
function setUpTexture() {
    // Create a texture.
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

    const faceInfos = [
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            url: imgUrl + 'posx.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            url: imgUrl + 'negx.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            url: imgUrl + 'posy.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            url: imgUrl + 'negy.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            url: imgUrl + 'posz.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
            url: imgUrl + 'negz.jpg',
        },
    ];
    faceInfos.forEach((faceInfo) => {
        const {target, url} = faceInfo;

        // Upload the canvas to the cubemap face.
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 2048;
        const height = 2048;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;

        // setup each face so it's immediately renderable
        gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

        // Asynchronously load an image
        const image = new Image();
        image.src = url;
        image.addEventListener('load', function() {
            // Now that the image has loaded upload it to the texture.
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
            gl.texImage2D(target, level, internalFormat, format, type, image);
            if(isPowerOf2(image.width) && isPowerOf2(image.height)) {
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            } else {
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
        });
    });
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    console.log("Set Texture Done!!");
}

//--------------------------- Setup Shader -------------------------------------
/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
    var vertexShader = loadShaderFromDOM("shader-vs-teapot");
    var fragmentShader = loadShaderFromDOM("shader-fs-teapot");

    shaderProgram = gl.createProgram();

    positionBuffer = gl.createBuffer();
    normalBuffer = gl.createBuffer();

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

    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.mMatrixUniform = gl.getUniformLocation(shaderProgram, "uMMatrix");
    shaderProgram.vMatrixUniform = gl.getUniformLocation(shaderProgram, "uVMatrix");

    shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");
    shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");
    shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
    shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
    shaderProgram.uniformShininessLoc = gl.getUniformLocation(shaderProgram, "uShininess");
    shaderProgram.uniformAmbientMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKAmbient");
    shaderProgram.uniformDiffuseMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKDiffuse");
    shaderProgram.uniformSpecularMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKSpecular");

    shaderProgram.uniformWorldCameraPos = gl.getUniformLocation(shaderProgram, "u_worldCameraPosition");
    shaderProgram.uniformTexture = gl.getUniformLocation(shaderProgram, "u_texture");
    shaderProgram.uniformShaderType = gl.getUniformLocation(shaderProgram, "u_shaderType");
    // shaderProgram.uniformUsePhong = gl.getUniformLocation(shaderProgram, "u_usePhong");

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(
        shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(
        shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
}

/**
 * Setup the skybox fragment and vertex shaders
 */
function setupSkyboxShaders() {
    var vertexShader = loadShaderFromDOM("shader-vs-skybox");
    var fragmentShader = loadShaderFromDOM("shader-fs-skybox");

    skyboxShaderProgram = gl.createProgram();
    gl.attachShader(skyboxShaderProgram, vertexShader);
    gl.attachShader(skyboxShaderProgram, fragmentShader);
    gl.linkProgram(skyboxShaderProgram);

    if (!gl.getProgramParameter(skyboxShaderProgram, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(skyboxShaderProgram));
        alert("Failed to setup skybox shaders");
    }

    gl.useProgram(skyboxShaderProgram);

    skyboxShaderProgram.vertexPositionAttribute = gl.getAttribLocation(skyboxShaderProgram, "a_position");
    gl.enableVertexAttribArray(skyboxShaderProgram.vertexPositionAttribute);

    skyboxShaderProgram.vMatrixUniform = gl.getUniformLocation(skyboxShaderProgram, "uVMatrix");
    skyboxShaderProgram.pMatrixUniform = gl.getUniformLocation(skyboxShaderProgram, "uPMatrix");
    skyboxShaderProgram.uniformSkyboxLoc = gl.getUniformLocation(skyboxShaderProgram, "u_skybox");
    skyboxShaderProgram.viewDirProjInvMat = gl.getUniformLocation(skyboxShaderProgram, "u_viewDirectionProjectionInverse");
}

//----------------------------------------------------------------------------------
/**
 * Populate buffers with data
 */
function setupMesh(filename) {
    myMesh = new TriMesh();
    myPromise = new asyncGetFile(filename);
    myPromise.then((res) => {
        myMesh.loadFromOBJ(res);
        console.log("Set up mesh succeed!");
    }).catch(
        (reason) => {
            console.log('Set up mesh fail:' + reason);
        }
    );
}

/**
 * Initiate SkyBox object
 */
function setupSkyBox() {
    mySkyBox = new Skybox();
    mySkyBox.createCube(skyboxSize);
    mySkyBox.loadBuffer();
}

//---------------------------- Handle user interaction -------------------------------------------
var currentlyPressedKeys = {};

function handleKeyDown(event) {
    //console.log("Key down ", event.key, " code ", event.code);
    currentlyPressedKeys[event.key] = true;

    // Rotate the teapot
    if (currentlyPressedKeys["a"]) {
        eulerY = (eulerY - rotateSpeed + 360) % 360;
    } else if (currentlyPressedKeys["d"]) {
        eulerY = (eulerY + rotateSpeed + 360) % 360;
    }

    // Orbit the view inside the skybox around the origin
    if (currentlyPressedKeys["ArrowLeft"]){
        vec3.rotateY(eyePt, eyePt, viewPt, -degToRad(orbitSpeed));
    } else if (currentlyPressedKeys["ArrowRight"]){
        vec3.rotateY(eyePt, eyePt, viewPt, degToRad(orbitSpeed));
    }

    if (currentlyPressedKeys["ArrowUp"]){
        event.preventDefault();
        vec3.rotateX(eyePt, eyePt, viewPt, -degToRad(orbitSpeed));
    } else if (currentlyPressedKeys["ArrowDown"]){
        event.preventDefault();
        vec3.rotateX(eyePt, eyePt, viewPt, degToRad(orbitSpeed));
    }
}

function handleKeyUp(event) {
    //console.log("Key up ", event.key, " code ", event.code);
    currentlyPressedKeys[event.key] = false;
}

/**
 * Switch ShaderType
 */
function handleShaderSwitch() {
    if (document.getElementById("phong").checked) {
        shaderType = 0;
    } else if (document.getElementById("reflective").checked) {
        shaderType = 1;
    } else if (document.getElementById("refractive").checked) {
        shaderType = 2;
    } else {
        console.error("Unexpected checked shader type!");
    }
}

//--------------------------- Main-loop procedure function ---------------------------------------------
/**
 * Startup function called from html code to start program.
 */
function startup() {
    canvas = document.getElementById("myGLCanvas");
    gl = createGLContext(canvas);
    setupShaders();
    setupSkyboxShaders();

    setupMesh(meshName);
    setupSkyBox();

    setUpTexture();
    var cube = getCube(30);
    skybox = getSkybox(cube);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    tick();
}

/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() {
    //console.log("function draw()")

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective
    mat4.perspective(pMatrix,degToRad(45),
        gl.viewportWidth / gl.viewportHeight,
        0.1, 500.0);

    // We want to look down -z, so create a lookat point in that direction
    // vec3.add(viewPt, eyePt, viewDir);

    // Then generate the lookat matrix and initialize the view matrix to that view
    mat4.lookAt(vMatrix,eyePt,viewPt,up);

    //Draw Mesh
    if(myMesh.loaded()) {
        mvPushMatrix();
        mPushMatrix();

        mat4.rotateY(mMatrix, mMatrix, degToRad(eulerY));
        mat4.rotateY(mvMatrix, mvMatrix, degToRad(eulerY));
        mat4.multiply(mvMatrix,vMatrix,mvMatrix);

        setMatrixUniforms();
        setLightUniforms(lightPosition,lAmbient,lDiffuse,lSpecular);

        if ((document.getElementById("polygon").checked) || (document.getElementById("wirepoly").checked))
        {
            setMaterialUniforms(shininess,kAmbient,
                kTerrainDiffuse,kSpecular);
            myMesh.drawTriangles();
        }

        if(document.getElementById("wirepoly").checked)
        {
            setMaterialUniforms(shininess,kAmbient,
                kEdgeBlack,kSpecular);
            myMesh.drawEdges();
        }

        if(document.getElementById("wireframe").checked)
        {
            setMaterialUniforms(shininess,kAmbient,
                kEdgeWhite,kSpecular);
            myMesh.drawEdges();
        }
        // Use skyboxShaderProgram
        setSkyboxMatrixUniforms();
        mySkyBox.draw(skyboxShaderProgram);

        mPopMatrix();
        mvPopMatrix();
    }
}

/**
 * Update any model transformations
 */
function animate() {
    document.getElementById("eY").value=eulerY;
    handleShaderSwitch();
}

/**
 * Keeping drawing frames....
 */
function tick() {
    requestAnimFrame(tick);
    animate();
    draw();
}

