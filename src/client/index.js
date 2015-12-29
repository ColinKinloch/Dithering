import vertexShaderSource from './post.glslv'

let canvas = document.querySelector('canvas')
let gl = window.gl = canvas.getContext('webgl', {
  alpha: true
})

gl.clearColor(0.8, 0.8, 1, 1)
gl.clearDepth(1)

let testTex = gl.createTexture()
gl.bindTexture(gl.TEXTURE_2D, testTex)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
gl.bindTexture(gl.TEXTURE_2D, null)

let bayer = [
   1, 49, 13, 61,  4, 52, 16, 64,
  33, 17, 45, 29, 36, 20, 48, 32,
   9, 57,  5, 53, 12, 60,  8, 56,
  41, 25, 37, 21, 44, 28, 40, 24,
   3, 51, 15, 63,  2, 50, 14, 62,
  35, 19, 47, 31, 34, 18, 46, 30,
  11, 59,  7, 55, 10, 58,  6, 54,
  43, 27, 39, 23, 42, 26, 38, 22
]
let m = 255 / 65
let width, height
width = height = 8
let channels = 1
let pixels = new Uint8Array(width * height * channels)

for (let i in bayer) {
  let p = i * channels
  let v = bayer[i] * m
  pixels[p] = v
}

let format
switch (channels) {
  case 1:
    format = gl.ALPHA
    break
  case 3:
    format = gl.RGB
    break
  case 4:
    format = gl.RGBA
}

let bayerTex = gl.createTexture()
gl.bindTexture(gl.TEXTURE_2D, bayerTex)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, gl.UNSIGNED_BYTE, pixels)
gl.bindTexture(gl.TEXTURE_2D, null)

let vertexBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
gl.bufferData(gl.ARRAY_BUFFER, new Int8Array([
  0, 0,
  0, 4,
  4, 0
]), gl.STATIC_DRAW)

let compileProgram = (shaders) => {
  let program = gl.createProgram()
  for (let shader of shaders) {
    gl.attachShader(program, shader)
  }
  gl.linkProgram(program)
  return program
}
let compileShader = (type, source) => {
  let shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader))
    let s = source.split('\n')
    source = ''
    let i = 0
    for (let l of s) {
      i++
      source += `${i}:${l}\n`
    }
    console.error(source)
    return null
  }
  return shader
}
let program = compileProgram([
  compileShader(gl.VERTEX_SHADER, vertexShaderSource),
  compileShader(gl.FRAGMENT_SHADER, require('./test.glslf'))
])
let frameUniform = gl.getUniformLocation(program, 'frame')
let bayerUniform = gl.getUniformLocation(program, 'bayer')
let sizeUniform = gl.getUniformLocation(program, 'destSize')

gl.useProgram(program)
gl.uniform1i(frameUniform, 0)
gl.uniform1i(bayerUniform, 1)

let positionAttrib = gl.getAttribLocation(program, 'position')
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
gl.vertexAttribPointer(positionAttrib, 2, gl.UNSIGNED_BYTE, false, 0, 0)

let render = () => {
  gl.useProgram(program)
  gl.uniform2iv(sizeUniform, [canvas.width, canvas.height])
  gl.activeTexture(gl.TEXTURE0 + 0)
  gl.bindTexture(gl.TEXTURE_2D, testTex)
  gl.activeTexture(gl.TEXTURE0 + 1)
  gl.bindTexture(gl.TEXTURE_2D, bayerTex)

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  gl.enableVertexAttribArray(positionAttrib)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
  gl.disableVertexAttribArray(positionAttrib)

  gl.activeTexture(gl.TEXTURE0 + 1)
  gl.bindTexture(gl.TEXTURE_2D, null)
  gl.activeTexture(gl.TEXTURE0 + 0)
  gl.bindTexture(gl.TEXTURE_2D, null)
}

fetch('./test.png')
.then((res) => {
  return res.blob()
})
.then((blob) => {
  return new Promise((resolve, reject) => {
    let img = new Image()
    img.onload = () => {
      resolve(img)
    }
    img.src = URL.createObjectURL(blob)
  })
})
.then((img) => {
  gl.bindTexture(gl.TEXTURE_2D, testTex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
  gl.bindTexture(gl.TEXTURE_2D, null)
  render()
})

let resize = (width, height) => {
  canvas.width = width
  canvas.height = height
  gl.viewport(0, 0, width, height)
  render()
}
window.addEventListener('resize', (e) => resize(canvas.clientWidth, canvas.clientHeight))
window.dispatchEvent(new Event('resize'))
