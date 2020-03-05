/**
 * @A simple 3D terrain using WebGL
 * @author Xiang Li
 */

/** Class implementing 3D terrain. */
class Terrain {   
/**
 * Initialize members of a Terrain object
 * @param {number} div Number of triangles along x axis and y axis
 * @param {number} minX Minimum X coordinate value
 * @param {number} maxX Maximum X coordinate value
 * @param {number} minY Minimum Y coordinate value
 * @param {number} maxY Maximum Y coordinate value
 */
    constructor(div,minX,maxX,minY,maxY) {
        this.div = div;
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
        
        // Allocate vertex array  **len:(div + 1)^2** 
        this.vBuffer = [];
        // Allocate triangle array  **len: 2*div^2 **
        this.fBuffer = [];
        // Allocate normal array  **len:(div + 1)^2**
        this.nBuffer = [];
        // Allocate array for edges so we can draw wireframe
        this.eBuffer = [];
        console.log("Terrain: Allocated buffers");
        
        this.generateTriangles();
        console.log("Terrain: Generated triangles");
        
        this.generateLines();
        console.log("Terrain: Generated lines");

        this.generateRandomPlanes(100, 0.005);
        console.log("Terrain: Generated random planes");

        this.generateNormals();
        console.log("Terrain: Generated normal vectors");
        
        // Get extension for 4 byte integer indices for drwElements
        var ext = gl.getExtension('OES_element_index_uint');
        if (ext == null){
            alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
        }
    }
    
    /**
    * Set the x,y,z coords of a vertex at location(i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    setVertex(v,i,j) {
        if(i < 0 || i > this.div || j < 0 || j > this.div) {
            console.log("Terrain: setVertex index error!");
            return false;
        }
        let vid = (i * (this.div + 1) + j) * 3; //vBuffer stores (div + 1)^2 * 3 vertices
        this.vBuffer[vid] = v[0];
        this.vBuffer[vid + 1] = v[1];
        this.vBuffer[vid + 2] = v[2];
        return true;         
    }
    
    /**
    * Return the x,y,z coordinates of a vertex at location (i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    getVertex(v,i,j) {
        if(i < 0 || i > this.div || j < 0 || j > this.div) {
            console.log("Terrain: getVertex index error!");
            return false;
        }
        let vid = (i * (this.div + 1) + j) * 3;
        v[0] = this.vBuffer[vid];
        v[1] = this.vBuffer[vid + 1];
        v[2] = this.vBuffer[vid + 2];  
        return true;      
    }

    /**
    * Calculate vector 
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    subVector(res, v1, v2) {
        for (let i = 0; i < 3; i++) {
            res[i] = v1[i] - v2[i];
        }
    }
    
    /**
    * Send the buffer objects to WebGL for rendering 
    */
    loadBuffers() {
        // Specify the vertex coordinates
        this.VertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);      
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vBuffer), gl.STATIC_DRAW);
        this.VertexPositionBuffer.itemSize = 3;
        this.VertexPositionBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexPositionBuffer.numItems, " vertices");
    
        // Specify normals to be able to do lighting calculations
        this.VertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.nBuffer),
                  gl.STATIC_DRAW);
        this.VertexNormalBuffer.itemSize = 3;
        this.VertexNormalBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexNormalBuffer.numItems, " normals");
    
        // Specify faces of the terrain 
        this.IndexTriBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.fBuffer),
                  gl.STATIC_DRAW);
        this.IndexTriBuffer.itemSize = 1;
        this.IndexTriBuffer.numItems = this.fBuffer.length;
        console.log("Loaded ", this.IndexTriBuffer.numItems, " triangles");
    
        //Setup Edges  
        this.IndexEdgeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.eBuffer),
                  gl.STATIC_DRAW);
        this.IndexEdgeBuffer.itemSize = 1;
        this.IndexEdgeBuffer.numItems = this.eBuffer.length;
        
        console.log("triangulatedPlane: loadBuffers");
    }
    
    /**
    * Render the triangles 
    */
    drawTriangles() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
    }
    
    /**
    * Render the triangle edges wireframe style 
    */
    drawEdges() {
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.drawElements(gl.LINES, this.IndexEdgeBuffer.numItems, gl.UNSIGNED_INT,0);   
    }

    /**
     * Fill the vertex and buffer arrays 
    */    
    generateTriangles() {
        let deltaX = (this.maxX - this.minX) / this.div;
        let deltaY = (this.maxY - this.minY) / this.div;
        
        //Iterate row and col to init vertex
        for (let i = 0; i <= this.div; i++) {
            for (let j = 0; j <= this.div; j++) {
                this.vBuffer.push(this.minX + deltaX * j);
                this.vBuffer.push(this.minY + deltaY * i);
                this.vBuffer.push(0);

                this.nBuffer.push(0);
                this.nBuffer.push(0);
                this.nBuffer.push(1); //1 or 0?
            }
        }

        //Iterate row and col to split each quad to get 2 triangle
        for (let i = 0; i < this.div; i++) {
            for (let j = 0; j < this.div; j++) {
                let vid = i * (this.div + 1) + j;
                this.fBuffer.push(vid);
                this.fBuffer.push(vid + 1);
                this.fBuffer.push(vid + this.div + 1);

                this.fBuffer.push(vid + 1);
                this.fBuffer.push(vid + 1 + this.div + 1);
                this.fBuffer.push(vid + this.div + 1);
            }
        }

        this.numVertices = this.vBuffer.length / 3;
        this.numFaces = this.fBuffer.length / 3;
    }

    /**
     * Generates line values from faces in faceArray
     * to enable wireframe rendering
    */
    generateLines() {
        var numTris= this.fBuffer.length/3;
        for(var f = 0; f < numTris; f++)
        {
            var fid = f*3;
            this.eBuffer.push(this.fBuffer[fid]);
            this.eBuffer.push(this.fBuffer[fid+1]);
            
            this.eBuffer.push(this.fBuffer[fid+1]);
            this.eBuffer.push(this.fBuffer[fid+2]);
            
            this.eBuffer.push(this.fBuffer[fid+2]);
            this.eBuffer.push(this.fBuffer[fid]);
        }
        
    }

    /**
    * Iteratively generate random plane on the grid to partition then perform 3D-resemble
    * @param {n} Time of iterations to partition
    * @param {delta} Value of height to increase/decrease on z-axis
    */
    generateRandomPlanes(n, delta) {
        while(n-- > 0) {
            // First generate random point p
            let rand_x = this.minX + Math.random() * (this.maxX - this.minX);
            let rand_y = this.minY + Math.random() * (this.maxY - this.minY);

            // Then generate random normal vector n
            let rand_n = 2 * Math.PI * Math.random();
            let n_x = Math.cos(rand_n);
            let n_y = Math.sin(rand_n);

            // Iterate thru all vertices
            for(let i = 0; i < this.div; ++i) {
                for(let j = 0; j < this.div; ++j) {
                    let v = vec3.create();
                    this.getVertex(v, i, j);

                    // Calculate dot product of (b - p) and n
                    let dotProduct = (v[0] - rand_x) * n_x + (v[1] - rand_y) * n_y;

                    if(dotProduct > 0)
                        v[2] += delta;
                    else
                        v[2] -= delta;

                    this.setVertex(v, i, j);
                }
            }
        }
    }


    /**
     * Generate(update) per-vertex normal vectors(Consider different cases!)
    */  
    generateNormals() {
        for(let i = 0; i <= this.div; ++i) {
            for(let j = 0; j <= this.div; ++j) {
                //At most each vertex can connect to 6 vertices
                var verticesPool = [];
                //Order matters!!
                var neighbours = [[i, j - 1], [i + 1, j - 1], [i + 1, j], [i, j + 1], [i - 1, j + 1], [i - 1, j]];

                for(let k = 0; k < neighbours.length; ++k) {
                    let v = vec3.create();
                    if(this.getVertex(v, neighbours[k][0], neighbours[k][1])) {
                        var verticePair = {
                            "index": k,
                            "value": v
                        };
                        verticesPool.push(verticePair);
                    }
                }

                this.computerNormals(verticesPool, i, j);
            }
        }
    }

    /**
     * Compute normal vectors based on neighbouring vertices
     * @param {Array} nbrs List of valid neighbours of this vertex
     * @param {number} i the ith row of vertices
     * @param {number} j the jth column of vertices
    */  
    computerNormals(nbrs, i, j) {
        let cur = vec3.create();
        this.getVertex(cur, i, j);

        let neighbourNum = nbrs.length;
        let triangleNum = neighbourNum - 1;
        
        //Array of vector substract result
        let vectorSubList = [];

        for(let i = 0; i < neighbourNum; ++i) {
            let subRes = vec3.create();
            vec3.sub(subRes, nbrs[i].value, cur);
            vectorSubList.push(subRes);
        }

        var sum = vec3.create();

        for(let k = 0; k < neighbourNum; ++k) {
            if(k < triangleNum && nbrs[k + 1].index - nbrs[k].index == 1) {
                let crossProductRes = vec3.create();
                vec3.cross(crossProductRes, vectorSubList[k], vectorSubList[k + 1]);
                vec3.add(sum, sum, crossProductRes);
            } else if(k == triangleNum && nbrs[k].index == 5 && nbrs[0].index == 0) {
                let crossProductRes = vec3.create();
                vec3.cross(crossProductRes, vectorSubList[k], vectorSubList[0]);
                vec3.add(sum, sum, crossProductRes);
            }   
        }
        
        let res = vec3.create();
        // Gotta divide in this way, can't sum / triangleNum
        vec3.normalize(res, [sum[0] / triangleNum, sum[1] / triangleNum, sum[2] / triangleNum]);

        // console.log(res[0] + ' ' + res[1] + ' ' + res[2]);

        this.nBuffer[3 * ((this.div + 1) * i + j)] = res[0];
        this.nBuffer[3 * ((this.div + 1) * i + j) + 1] = res[1];
        this.nBuffer[3 * ((this.div + 1) * i + j) + 2] = res[2];
    }


    /**
     * Print vertices and triangles to console for debugging
    */
    printBuffers() {
            
        for(var i = 0; i < this.numVertices; i++) 
        {
            console.log("vertex: ", this.vBuffer[i*3], " ", 
                                    this.vBuffer[i*3 + 1], " ",
                                    this.vBuffer[i*3 + 2], " ");               
        }
        
        for(var i = 0; i < this.numFaces; i++) 
        {
            console.log("triangle: ", this.fBuffer[i*3], " ", 
                                      this.fBuffer[i*3 + 1], " ",
                                      this.fBuffer[i*3 + 2], " ");
        }
            
    }
}
