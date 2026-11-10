/**
 * WaveGradient - Animated WebGL 2 Mesh Gradient
 * Adaptado e Otimizado para Autoescuela Mega
 * Estilo visual fluido inspirado no WaveGradient (Framer)
 */
(function(root) {
  var vert = `#version 300 es
vec3 o(vec3 i,vec3 c,float r){return c*r+i*(1.-r);}vec3 o(vec3 n){return n-floor(n*(1./289.))*289.;}vec4 o(vec4 n){return n-floor(n*(1./289.))*289.;}vec4 e(vec4 n){return o((n*34.+1.)*n);}vec4 v(vec4 y){return 1.79284291400159-.85373472095314*y;}float t(vec3 l){const vec2 s=vec2(1./6.,1./3.);const vec4 u=vec4(0.,.5,1.,2.);vec3 a=floor(l+dot(l,s.yyy)),x=l-a+dot(a,s.xxx),d=step(x.yzx,x.xyz),f=1.-d,z=min(d.xyz,f.zxy),w=max(d.xyz,f.zxy),m=x-z+s.xxx,C=x-w+s.yyy,p=x-u.yyy;a=o(a);vec4 P=e(e(e(a.z+vec4(0.,z.z,w.z,1.))+a.y+vec4(0.,z.y,w.y,1.))+a.x+vec4(0.,z.x,w.x,1.));vec3 S=.142857142857*u.wyz-u.xzx;vec4 L=P-49.*floor(P*S.z*S.z),F=floor(L*S.z),R=floor(L-7.*F),n=F*S.x+S.yyyy,W=R*S.x+S.yyyy,b=1.-abs(n)-abs(W),G=vec4(n.xy,W.xy),q=vec4(n.zw,W.zw),h=floor(G)*2.+1.,g=floor(q)*2.+1.,O=-step(b,vec4(0.)),B=G.xzyw+h.xzyw*O.xxyy,A=q.xzyw+g.xzyw*O.zzww;vec3 E=vec3(B.xy,b.x),Z=vec3(B.zw,b.y),Y=vec3(A.xy,b.z),X=vec3(A.zw,b.w);vec4 V=v(vec4(dot(E,E),dot(Z,Z),dot(Y,Y),dot(X,X)));E*=V.x;Z*=V.y;Y*=V.z;X*=V.w;vec4 U=max(.6-vec4(dot(x,x),dot(m,m),dot(C,C),dot(p,p)),0.);U=U*U;return 42.*dot(U*U,vec4(dot(E,x),dot(Z,m),dot(Y,C),dot(X,p)));}uniform mediump vec2 u_Resolution;uniform float u_Amplitude,u_Realtime,u_Seed;uniform vec3 u_BaseColor;uniform int u_LayerCount;uniform struct WaveLayers{float noiseCeil;float noiseFloor;float noiseFlow;float noiseSeed;float noiseSpeed;vec2 noiseFreq;vec3 color;} u_WaveLayers[9];in vec3 a_Position;out vec3 v_Color;void main(){float T=u_Realtime*5e-6;vec2 Q=vec2(.00014,.00029),N=u_Resolution*a_Position.xy*Q;float M=u_Amplitude*(2./u_Resolution.y),K=t(vec3(N.x*3.+T*3.,N.y*4.,T*10.+u_Seed));K*=1.-pow(abs(a_Position.y),2.);K=max(0.,K);gl_Position=vec4(a_Position.x,a_Position.y+K*M,a_Position.z,1.);v_Color=u_BaseColor;for(int a=0;a<u_LayerCount;a++){WaveLayers J=u_WaveLayers[a];float K=t(vec3(N.x*J.noiseFreq.x+T*J.noiseFlow,N.y*J.noiseFreq.y,T*J.noiseSpeed+J.noiseSeed));K=K/2.+.5;K=smoothstep(J.noiseFloor,J.noiseCeil,K);v_Color=o(v_Color,J.color,pow(K,4.));}}
`;
  var frag = `#version 300 es
precision mediump float;
uniform vec2 u_Resolution;
uniform float u_ShadowPower;
in vec3 v_Color;
out vec4 color;
void main(){
  vec2 I = gl_FragCoord.xy / u_Resolution.xy;
  float shadow = pow(clamp(I.y + sin(-12.0) * I.x, 0.0, 1.0), u_ShadowPower) * 0.22;
  color = vec4(v_Color - vec3(shadow * 0.4, shadow * 0.3, shadow * 0.15), 1.0);
}
`;

  function parseRGB(hex) {
    if (!hex) return [0, 0, 0];
    var result = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i) || hex.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
    return result ? result.slice(1, 4).map(function(c) {
      return parseInt(c.length < 2 ? c + c : c, 16) / 255;
    }) : [0, 0, 0];
  }

  var ClipSpace = function(config) {
    this.gl = config.gl;
    this.program = this.createProgram(config.shaders);
    this._attributes = {};
    this.setupAttributes(config.attributes);
    this._elementBuffer = null;
    this.setElements(config.elements);
    this._uniforms = {};
    this.setupUniforms(config.uniforms);
  };

  ClipSpace.prefixName = function(name, prefix) {
    return prefix + name[0].toUpperCase() + name.slice(1);
  };

  ClipSpace.prototype.compileShader = function(type, source) {
    var gl = this.gl;
    var shader = gl.createShader(type);
    if (!shader) throw new Error("can't create shader");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      var log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error("Shader compile error: " + log);
    }
    return shader;
  };

  ClipSpace.prototype.createProgram = function(shaders) {
    var gl = this.gl;
    var vs = this.compileShader(gl.VERTEX_SHADER, shaders[0]);
    var fs = this.compileShader(gl.FRAGMENT_SHADER, shaders[1]);
    var program = gl.createProgram();
    if (!program) throw new Error("can't create WebGL program");
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      var log = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error("Program link error: " + log);
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.useProgram(program);
    return program;
  };

  ClipSpace.prototype.createBuffer = function() {
    var gl = this.gl;
    var buffer = gl.createBuffer();
    if (!buffer) throw new Error("can't create buffer");
    return buffer;
  };

  ClipSpace.prototype.setupAttributes = function(attributes) {
    var gl = this.gl;
    var program = this.program;
    for (var name in attributes) {
      if (attributes.hasOwnProperty(name)) {
        var prefixedName = ClipSpace.prefixName(name, "a_");
        var buffer = this.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, attributes[name], gl.STATIC_DRAW);
        var location = gl.getAttribLocation(program, prefixedName);
        if (location !== -1) {
          gl.enableVertexAttribArray(location);
          gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
          this._attributes[name] = { buffer: buffer, location: location };
        }
      }
    }
  };

  ClipSpace.prototype.setAttribute = function(attributeName, dataBuffer) {
    var gl = this.gl;
    if (this._attributes[attributeName]) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this._attributes[attributeName].buffer);
      gl.bufferData(gl.ARRAY_BUFFER, dataBuffer, gl.STATIC_DRAW);
    }
  };

  ClipSpace.prototype.setElements = function(elements) {
    var gl = this.gl;
    if (!this._elementBuffer) {
      this._elementBuffer = this.createBuffer();
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._elementBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elements, gl.STATIC_DRAW);
  };

  ClipSpace.prototype.createUniformSetter = function(name, type, initialValue) {
    var gl = this.gl;
    var program = this.program;
    var uniformX = "uniform" + type;
    var location = gl.getUniformLocation(program, name);
    var setter = function(value) {
      if (!location) return;
      if (Array.isArray(value)) {
        gl[uniformX].apply(gl, [location].concat(value));
      } else {
        gl[uniformX](location, value);
      }
    };
    if (initialValue !== undefined) setter(initialValue);
    return setter;
  };

  ClipSpace.prototype.setupUniforms = function(uniforms) {
    for (var name in uniforms) {
      if (uniforms.hasOwnProperty(name)) {
        var prefixedName = ClipSpace.prefixName(name, "u_");
        var uniform = uniforms[name];
        if (uniform.type === undefined && Array.isArray(uniform.value)) {
          var structName = name;
          var prefixedStructName = prefixedName;
          for (var i = 0; i < uniform.value.length; i++) {
            var member = uniform.value[i];
            for (var name2 in member) {
              if (member.hasOwnProperty(name2)) {
                var key = structName + "[" + i + "]." + name2;
                var prefixedKey = prefixedStructName + "[" + i + "]." + name2;
                this._uniforms[key] = this.createUniformSetter(prefixedKey, member[name2].type, member[name2].value);
              }
            }
          }
        } else {
          this._uniforms[name] = this.createUniformSetter(prefixedName, uniform.type, uniform.value);
        }
      }
    }
  };

  ClipSpace.prototype.setUniform = function(uniformName, newValue) {
    if (this._uniforms[uniformName]) {
      this._uniforms[uniformName](newValue);
    }
  };

  ClipSpace.prototype.delete = function() {
    var gl = this.gl;
    gl.deleteProgram(this.program);
    for (var name in this._attributes) {
      if (this._attributes.hasOwnProperty(name)) {
        gl.deleteBuffer(this._attributes[name].buffer);
      }
    }
    if (this._elementBuffer) {
      gl.deleteBuffer(this._elementBuffer);
    }
  };

  var WaveGradient = function(canvas, options) {
    if (!canvas) throw new Error("WaveGradient: Canvas element required");
    var opts = options || {};
    var gl = canvas.getContext("webgl2", {
      antialias: true,
      depth: false,
      alpha: true,
      powerPreference: "low-power"
    });
    if (!gl) {
      throw new Error("WaveGradient: WebGL 2.0 not supported");
    }

    var amplitude = opts.amplitude !== undefined ? opts.amplitude : 300;
    var colors = opts.colors || ["#0A2843", "#DB7DB1", "#153C66", "#C567A0", "#1E4E85", "#E89BC6"];
    var density = opts.density || [0.035, 0.08]; // Otimizado para alta fluidez e baixo consumo de CPU/GPU
    var fps = opts.fps !== undefined ? opts.fps : 24; // Taxa de quadros suave e econômica
    var seed = opts.seed !== undefined ? opts.seed : 0;
    var speed = opts.speed !== undefined ? opts.speed : 1.0;
    var time = opts.time !== undefined ? opts.time : 0;
    var wireframe = opts.wireframe || false;

    var clientWidth = canvas.clientWidth || window.innerWidth;
    var clientHeight = canvas.clientHeight || 700;
    canvas.width = clientWidth;
    canvas.height = clientHeight;
    gl.viewport(0, 0, clientWidth, clientHeight);
    gl.enable(gl.CULL_FACE);
    gl.disable(gl.DITHER);
    gl.disable(gl.DEPTH_TEST);

    var geometry = WaveGradient.createGeometry(clientWidth * density[0], clientHeight * density[1]);
    var waveLayers = [];
    var otherColors = colors.slice(1);
    for (var i = 0; i < otherColors.length; i++) {
      var r = (i + 1) / otherColors.length + 1;
      waveLayers.push({
        noiseCeil: { value: 0.63 + 0.07 * (i + 1), type: "1f" },
        noiseFloor: { value: 0.1, type: "1f" },
        noiseFlow: { value: 6.5 + 0.3 * (i + 1), type: "1f" },
        noiseSeed: { value: seed + 10 * (i + 1), type: "1f" },
        noiseSpeed: { value: 11 + 0.3 * (i + 1), type: "1f" },
        noiseFreq: { value: [2 + r, 3 + r], type: "2f" },
        color: { value: parseRGB(otherColors[i]), type: "3f" }
      });
    }

    var clipSpace = new ClipSpace({
      gl: gl,
      shaders: [vert, frag],
      attributes: { position: geometry.positions },
      elements: geometry.indices,
      uniforms: {
        amplitude: { value: amplitude, type: "1f" },
        baseColor: { value: parseRGB(colors[0]), type: "3f" },
        realtime: { value: time, type: "1f" },
        resolution: { value: [clientWidth, clientHeight], type: "2f" },
        seed: { value: seed, type: "1f" },
        shadowPower: { value: 6, type: "1f" },
        layerCount: { value: otherColors.length, type: "1i" },
        waveLayers: { value: waveLayers }
      }
    });

    this.gl = gl;
    this.canvas = canvas;
    this.clipSpace = clipSpace;
    this.density = density;
    this.speed = speed;
    this.frameInterval = 1000 / fps;
    this.lastFrameTime = 0;
    this.shouldRender = true;
    this.drawMode = wireframe ? gl.LINES : gl.TRIANGLES;
    this.drawCount = geometry.count;
    this.time = time;

    var self = this;
    var renderLoop = function(now) {
      if (self.shouldRender) {
        requestAnimationFrame(renderLoop);
      }
      var delta = now - self.lastFrameTime;
      if (delta < self.frameInterval) return;
      self.lastFrameTime = now - (delta % self.frameInterval);
      self.time += Math.min(delta, self.frameInterval) * self.speed;
      self.clipSpace.setUniform("realtime", self.time);
      self.gl.drawElements(self.drawMode, self.drawCount, self.gl.UNSIGNED_INT, 0);
    };

    requestAnimationFrame(renderLoop);
  };

  WaveGradient.createGeometry = function(widthSegments, depthSegments) {
    var gridX = Math.max(8, Math.ceil(widthSegments));
    var gridZ = Math.max(8, Math.ceil(depthSegments));
    var vertexCount = 3 * (gridX + 1) * (gridZ + 1);
    var indexCount = 3 * 2 * gridX * gridZ;
    var positions = new ArrayBuffer(4 * vertexCount);
    var indices = new ArrayBuffer(4 * indexCount);

    for (var z = gridZ, i = 0, view = new DataView(positions); z >= 0; z--) {
      var v = z / gridZ;
      var clipY = v * 2 - 1;
      for (var x = gridX; x >= 0; x--, i += 3) {
        var clipX = (x / gridX) * 2 - 1;
        view.setFloat32((i + 0) * 4, clipX, true);
        view.setFloat32((i + 1) * 4, clipY, true);
        view.setFloat32((i + 2) * 4, v, true);
      }
    }

    var verticesAcross = gridX + 1;
    for (var z2 = 0, i2 = 0, view2 = new DataView(indices); z2 < gridZ; z2++) {
      for (var x2 = 0; x2 < gridX; x2++, i2 += 6) {
        view2.setUint32((i2 + 0) * 4, (z2 + 0) * verticesAcross + x2, true);
        view2.setUint32((i2 + 1) * 4, (z2 + 0) * verticesAcross + x2 + 1, true);
        view2.setUint32((i2 + 2) * 4, (z2 + 1) * verticesAcross + x2, true);
        view2.setUint32((i2 + 3) * 4, (z2 + 0) * verticesAcross + x2 + 1, true);
        view2.setUint32((i2 + 4) * 4, (z2 + 1) * verticesAcross + x2 + 1, true);
        view2.setUint32((i2 + 5) * 4, (z2 + 1) * verticesAcross + x2, true);
      }
    }
    return { positions: positions, indices: indices, count: indexCount };
  };

  WaveGradient.prototype.resize = function() {
    var canvas = this.canvas;
    var clientWidth = canvas.clientWidth;
    var clientHeight = canvas.clientHeight;
    if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
      canvas.width = clientWidth;
      canvas.height = clientHeight;
      this.gl.viewport(0, 0, clientWidth, clientHeight);
      this.clipSpace.setUniform("resolution", [clientWidth, clientHeight]);
      var geometry = WaveGradient.createGeometry(clientWidth * this.density[0], clientHeight * this.density[1]);
      this.clipSpace.setAttribute("position", geometry.positions);
      this.clipSpace.setElements(geometry.indices);
      this.drawCount = geometry.count;
    }
  };

  WaveGradient.prototype.pause = function() {
    this.shouldRender = false;
  };

  WaveGradient.prototype.play = function() {
    if (!this.shouldRender) {
      this.shouldRender = true;
      var self = this;
      var renderLoop = function(now) {
        if (self.shouldRender) {
          requestAnimationFrame(renderLoop);
        }
        var delta = now - self.lastFrameTime;
        if (delta < self.frameInterval) return;
        self.lastFrameTime = now - (delta % self.frameInterval);
        self.time += Math.min(delta, self.frameInterval) * self.speed;
        self.clipSpace.setUniform("realtime", self.time);
        self.gl.drawElements(self.drawMode, self.drawCount, self.gl.UNSIGNED_INT, 0);
      };
      requestAnimationFrame(renderLoop);
    }
  };

  WaveGradient.prototype.destroy = function() {
    this.shouldRender = false;
    if (this.clipSpace) this.clipSpace.delete();
  };

  root.WaveGradient = WaveGradient;
})(typeof window !== 'undefined' ? window : this);
