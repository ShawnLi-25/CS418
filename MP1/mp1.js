var gl;
		var canvas;
		var shaderProgram;
		var vertexPosBuffer, meshIndexBuffer, meshColorBuffer;

		// try to get a  reference to a WebGL context using the  two names under which it might exist
		function createGLContext(canvas) {
  			var srcNames = ["webgl", "experimental-webgl"];
  			for (var i = srcNames.length - 1; i >= 0; i--) {
  				try{
  					context = canvas.getContext(srcNames[i]);
  				}
  				catch(e){}
  				if(context) {
  					break;
  				}
  			}
  			if(context) {
  				    context.viewportWidth = canvas.width;
			    context.viewportHeight = canvas.height;
  			} else {
  				alert("Failed to get WebGL context!");
  			}

  			return context;
		}

		function loadShader(type, shaderSource) {
			var shader = gl.createShader(type);
			gl.shaderSource(shader, shaderSource);
			gl.compileShader(shader);

			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		    	alert("Error compiling shader" + gl.getShaderInfoLog(shader));
		    	gl.deleteShader(shader);   
		    	return null;
		  	}
		  	return shader;  
		}

		function setupShaders() {
			// simply use a JavaScript string to  hold the source code for the vertex/fragment shader
		  var vertexShaderSource = 
		    "attribute vec3 aVertexPosition;                 \n" +
		    "void main() {                                   \n" +
		    "  gl_Position = vec4(aVertexPosition, 1.0);     \n" +
		    "}                                               \n";           
		   
		   var fragmentShaderSource = 
		     "precision mediump float;                    \n"+
		     "void main() {                               \n"+
		     "  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);  \n"+
		     "}                                           \n";
		     
		  var vertexShader = loadShader(gl.VERTEX_SHADER, vertexShaderSource);
		  var fragmentShader = loadShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
		  
		  shaderProgram = gl.createProgram();
		  gl.attachShader(shaderProgram, vertexShader);
		  gl.attachShader(shaderProgram, fragmentShader);
		  gl.linkProgram(shaderProgram);

		  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		    alert("Failed to setup shaders");
		  }

		  gl.useProgram(shaderProgram);
		  
		  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition"); 
		}

		function setupBuffers() {
			//Using Indexed-face Set
			// Setting vertex_position_buffer
			vertexPosBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
			var meshVertexPosition = [
				0.0,  0.5,  0.0,
        -0.5, -0.5,  0.0,
         0.5, -0.5,  0.0
			];

  			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshVertexPosition), gl.STATIC_DRAW);
  			vertexPosBuffer.itemSize = 3; //how many element for each item
  			vertexPosBuffer.numberOfItems = 3;//How many (x,y,z) do we have

  			meshColorBuffer = gl.createBuffer();
  			gl.bindBuffer(gl.ARRAY_BUFFER, meshColorBuffer);
  			var meshColor = [
  				1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0
  			];

  			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshColor), gl.STATIC_DRAW);
  			meshColorBuffer.itemSize = 4;
  			meshColorBuffer.numberOfItems = 3;

			// Setting index_buffer
  	// 		meshIndexBuffer = gl.createBuffer(); 
  	// 		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshIndexBuffer);
  	// 		var meshIndex = [
			// 	0, 1, 2, 
			// 	2, 1, 3,
			// 	4, 5, 7, 
			// 	7, 5, 6,
			// 	2, 3, 4,
			// 	4, 3, 5, 
			// 	3, 11, 5,
			// 	5, 11, 13, 
			// 	8, 9, 10,
			// 	10, 9, 11,
			// 	10, 11, 12,
			// 	12, 11, 13,
			// 	13, 12, 14,
			// 	12, 14, 15,
			// ];
  	// 		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(meshIndex), gl.STATIC_DRAW); 
  	// 		meshIndexBuffer.itemSize = 1; //each vertex is an element 
  	// 		meshIndexBuffer.numberOfItems = 42; //how many vertices do we have
		}

		function draw() {
			gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
			gl.clear(gl.COLOR_BUFFER_BIT);
			  
		 	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
		    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
		                         vertexPosBuffer.itemSize, gl.FLOAT, false, 0, 0);
		    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

		    gl.bindBuffer(gl.ARRAY_BUFFER, meshColorBuffer);
		    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
		                            meshColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
		    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute)
		  	
		  	gl.drawArrays(gl.TRIANGLES, 0, vertexPosBuffer.numberOfItems);
		 	// gl.drawElements(gl.TRIANGLE_STRIP, vertexPosBuffer.numberOfItems, gl.UNSIGNED_BYTE, 0);
		 	// gl.drawElements(gl.TRIANGLE, meshIndexBuffer.numberOfItems,  gl.UNSIGNED_SHORT, 0);
		}

		function startup() {
			canvas = document.getElementById("logo")
			gl = createGLContext(canvas);
			setupShaders(); 
			setupBuffers();
			gl.clearColor(0.0, 0.0, 0.0, 1.0);
			tick();
		}	

		function tick() {
		    console.log("Frame ",frameNumber);
		    frameNumber=frameNumber+1;
		    requestAnimationFrame(tick);
		    draw();
		    animate();
		}
