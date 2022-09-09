# highs-wasm

This provides a [Emscripten](https://emscripten.org)-based [WebAssembly](https://webassembly.org/) binary of the [HiGHS](https://highs.dev) optimization software
along with JavaScript wrappers of the low-level solvers from its C API.

## Use case

The intended use of this is for situations where you need access to a high-performance MILP/LP/QP solver, but you do not want to use commercial
solvers, and where you want to be able to access the solvers from a Wasm runtime such as a browser. In particular, this is useful when you want
to ship a piece of software that embeds the solver in a way that is easy for users to work with (as a web page is), and where you do not want
to manage a server backend hosting the optimization software, but would rather that everything runs entirely on the client.

If you can provide the program in LP format, then the [highs-js](https://github.com/lovasoa/highs-js) project (which we draw heavily on) solves
this problem. Here, instead, we expose the lower-level solver methods and assume that you are able to provide the constraint matrix of your
program in [compressed sparse](https://en.wikipedia.org/wiki/Sparse_matrix) (CSC/CSR) format. This is often the case and going directly to
this level avoids a potentially expensive model creation step.

## Example usage

The example below shows how to make use of the solver in vanilla JavaScript. After loading `highs.js`, the Emscripten module can be obtained
from the `Highs()` promise, and the module then provides functions wrapping the solvers from the HiGHS C API.

The example below can be seen in action on https://fuglede.github.io/highs-wasm/.

```html
<html>
  <head>
    <!-- Do not rely on the URL below never changing. For now, download highs.js and highs.wasm. -->
    <script src="https://fuglede.github.io/highs-wasm/highs.js"></script>
    <script>
      Highs().then(highs => {
        // Let us solve the following maximization problem:
        //
        // Max    f  =  x_0 +  x_1 + 3
        // s.t.                x_1 <= 7
        //        5 <=  x_0 + 2x_1 <= 15
        //        6 <= 3x_0 + 2x_1
        // 0 <= x_0 <= 4; 1 <= x_1
        // x_0, x_1 integers
        //
        // The constraint matrix is the 3x2 matrix [[0, 1], [1, 2], [3, 2]] which
        // we will be providing in compressed sparse column (CSC) format; that is,
        // we read the non-zero entries column-by-column, and for each entry note
        // its value and which row it is in, as well as how many values are in each
        // column. See https://en.wikipedia.org/wiki/Sparse_matrix
        const numColumns = 2;
        const numRows = 3;
        const constraintMatrixFormat = highs.ConstraintMatrixFormat.CompressedSparseColumn;
        const constraintMatrixValues = [1, 3, 1, 2, 2];
        const constraintMatrixIndices = [1, 2, 0, 1, 2];
        const constraintMatrixStarts = [0, 2];
        // The bounds in the constraints are given as separate arrays. We use large
        // positive/negative values to indicate bounds that should not be included.
        const rowLower = [-1e30, 5, 6];
        const rowUpper = [7, 15, 1e30];
        // Similarly, the bounds for each variable are given as separate arrays.
        const columnLower = [0, 1];
        const columnUpper = [4, 1e30];
        // The objective is given in terms of the coefficients of each variable, as
        // well as the constant term.
        const offset = 3;
        const columnCosts = [1, 1];
        const optimizationSense = highs.OptimizationSense.Maximize;
        // Finally, we specify that both variables have integer values.
        const integrality = [highs.VariableType.Integer, highs.VariableType.Integer];
  
        // That's all. Now we can let HiGHS solve the problem and spit out the
        // values of the two variables leading to the maximum objective value.
        var res = highs.mipCall(
          numColumns, numRows, constraintMatrixFormat, optimizationSense, offset,
          columnCosts, columnLower, columnUpper, rowLower, rowUpper,
          constraintMatrixStarts, constraintMatrixIndices, constraintMatrixValues, integrality);

        console.log(res);
        document.getElementById("x0").innerText = res.columnValues[0];
        document.getElementById("x1").innerText = res.columnValues[1];
      });
    </script>
  </head>
  <body>
    <p>
      <i>x</i><sub>0</sub>: <span id="x0"></span>,<br />
      <i>x</i><sub>1</sub>: <span id="x1"></span>
    </p>
  </body>
</html>
```
