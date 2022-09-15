const assert = require('assert').strict;

function testMipCall(highs) {
        const numColumns = 2;
        const numRows = 3;
        const constraintMatrixFormat = highs.ConstraintMatrixFormat.CompressedSparseColumn;
        const constraintMatrixValues = [1, 3, 1, 2, 2];
        const constraintMatrixIndices = [1, 2, 0, 1, 2];
        const constraintMatrixStarts = [0, 2];
        const rowLower = [-1e30, 5, 6];
        const rowUpper = [7, 15, 1e30];
        const columnLower = [0, 1];
        const columnUpper = [4, 1e30];
        const offset = 3;
        const columnCosts = [1, 1];
        const optimizationSense = highs.OptimizationSense.Maximize;
        const integrality = [highs.VariableType.Integer, highs.VariableType.Integer];

        const res = highs.mipCall(
          numColumns, numRows, constraintMatrixFormat, optimizationSense, offset,
          columnCosts, columnLower, columnUpper, rowLower, rowUpper,
          constraintMatrixStarts, constraintMatrixIndices, constraintMatrixValues, integrality);

	const expected = {
          solverStatus: 'Ok',
          modelStatus: 'Optimal',
          columnValues: [ 4, 5 ],
          rowValues: [ 5, 14, 22 ]
        };

	assert.deepStrictEqual(res, expected);
}

async function runTests() {
    highs = await require("build/highs.js")();
    testMipCall(highs);
}

runTests();
