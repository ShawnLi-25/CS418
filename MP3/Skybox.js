/**
 * @fileoverview Skybox - A simple skybox with custom texture for use with WebGL
 * @author Xiang Li
 */

/** Class implementing of Cubemap Skybox. */
class Skybox {

    constructor() {
        // Allocate vertex array
        this.vBuffer = [];
        // Allocate normal array
        this.nBuffer = [];
        // Allocate array for texture coordinates
        this.texcoordBuffer = [];
        // Allocate array for indices to draw triangles
        this.indices = [];

        this.coordBuffer = gl.createBuffer();

        this.indexBufer = gl.createBuffer();

        this.count = 0;
    }

    /**
     * Create Cube of 6 faces with coordinates and normals
     * @param {Int} sideLen: length of side (default with 1)
     */
    createCube(sideLen= 1) {
        var s = sideLen / 2;

        this.createFace( [-s,-s,s, s,-s,s, s,s,s, -s,s,s], [0,0,1] );
        this.createFace( [-s,-s,-s, -s,s,-s, s,s,-s, s,-s,-s], [0,0,-1] );
        this.createFace( [-s,s,-s, -s,s,s, s,s,s, s,s,-s], [0,1,0] );
        this.createFace( [-s,-s,-s, s,-s,-s, s,-s,s, -s,-s,s], [0,-1,0] );
        this.createFace( [s,-s,-s, s,s,-s, s,s,s, s,-s,s], [1,0,0] );
        this.createFace( [-s,-s,-s, -s,-s,s, -s,s,s, -s,s,-s], [-1,0,0] );
        this.count = this.indices.length;
        this.vBuffer = new Float32Array(this.vBuffer);
        this.nBuffer = new Float32Array(this.nBuffer);
        this.texcoordBuffer = new Float32Array(this.texcoordBuffer);
        this.indices = new Uint16Array(this.indices);
    }

    /**
     * Create Cube of 6 faces with coordinates and normals
     * @param {Array} coords: An array of (x,y, z) coordinates
     * @param {Array} normals: An array of normal vectors of the face
     */
    createFace(coords, normals) {
        var start = this.vBuffer.length/3;
        var i;
        for (i = 0; i < 12; i++) {
            this.vBuffer.push(coords[i]);
        }
        for (i = 0; i < 4; i++) {
            this.nBuffer.push(normals[0],normals[1],normals[2]);
        }
        this.texcoordBuffer.push(0,0,1,0,1,1,0,1);
        this.indices.push(start,start+1,start+2,start,start+2,start+3);
    }

    /**
     * Loading coordsBuffer/indexBuffer from cube
     * Ready for draw call
     */
    loadBuffer() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vBuffer, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBufer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    }

    /**
     * Call for Draw SkyBox
     */
    draw(shaderProgram) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBufer);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
}


/**
 * Create a model of a cube, centered at the origin.  (This is not
 * a particularly good format for a cube, since an IFS representation
 * has a lot of redundancy.)
 * @side the length of a side of the cube.  If not given, the value will be 1.
 */
function getCube(side) {
    var s = (side || 1)/2;
    var coords = [];
    var normals = [];
    var texCoords = [];
    var indices = [];
    function face(xyz, nrm) {
        var start = coords.length/3;
        var i;
        for (i = 0; i < 12; i++) {
            coords.push(xyz[i]);
        }
        for (i = 0; i < 4; i++) {
            normals.push(nrm[0],nrm[1],nrm[2]);
        }
        texCoords.push(0,0,1,0,1,1,0,1);
        indices.push(start,start+1,start+2,start,start+2,start+3);
    }
    face( [-s,-s,s, s,-s,s, s,s,s, -s,s,s], [0,0,1] );
    face( [-s,-s,-s, -s,s,-s, s,s,-s, s,-s,-s], [0,0,-1] );
    face( [-s,s,-s, -s,s,s, s,s,s, s,s,-s], [0,1,0] );
    face( [-s,-s,-s, s,-s,-s, s,-s,s, -s,-s,s], [0,-1,0] );
    face( [s,-s,-s, s,s,-s, s,s,s, s,-s,s], [1,0,0] );
    face( [-s,-s,-s, -s,-s,s, -s,s,s, -s,s,-s], [-1,0,0] );
    return {
        vertexPositions: new Float32Array(coords),
        vertexTextureCoords: new Float32Array(texCoords),
        indices: new Uint16Array(indices)
    }
}

/**
 * Get a mesh model from given model data
 * Call render function to draw the mesh
 * @param {Object} modelData
 */
function getSkybox(modelData) {
    var model = {};
    model.coordsBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);
    model.render = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(skyboxShaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
    return model;
}