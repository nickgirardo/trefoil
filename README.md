# trefoil
WebGL recreation of Philip Rideout's aa cel-shaded trefoil demo

Check it out [here](http://nickgirardo.github.io/trefoil/)

Philip Rideout's original blog post [here](https://prideout.net/blog/old/blog/index.html@p=22.html).  Original source available [here](https://github.com/prideout/blog-source/tree/master/p22)

## About

The original program was created by [Philip Rideout](https://github.com/prideout).
I've always been interested in toon shading, so I ported this to js and webgl.
Note that ceratain parts of the program, especially the shaders, are only minimally changed from the original program.

The rendered shape is a [Trefoil](https://en.wikipedia.org/wiki/Trefoil).

## Building and Running

Dependencies must be installed with npm, `npm install`.

To run this live use `npm run start:dev`.  This will use `webpack-dev-server` to serve the demo on localhost (default port 8080).
For more information, check out `webpack-dev-server` [here](https://github.com/webpack/webpack-dev-server).

To publish a bundle use `npm run publish`.  This will produce `build/bundle.js` and `build/bundle.js.map`.
Please note that `index.html` expects the bundle to be in the same directory as it, not in a build directory.
`build/bundle.js.map` is a source map.  It makes debugging and exploring the application easier, but is otherwise unnecessary.
