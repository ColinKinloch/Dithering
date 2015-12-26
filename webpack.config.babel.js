let config = {
  context: `${__dirname}/src`,
  entry: {
    client: './client'
  },
  output: {
    filename: '[name].js'
  },
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel' },
      { test: /\.(frag|vect|glsl[vf]?)$/, exclude: /node_modules/, loader: 'raw' },
      { test: /\.(frag|vect|glsl[vf]?)$/, exclude: /node_modules/, loader: 'glslify' }
    ]
  }
}

export default config
