const doubleSize = 8;
// Note that it is possible to configure HiGHS compilation so that it's HighsInt is 8 bytes,
// so one does have to take care not to do that
const intSize = 4;

function setDoubleArray(jsArray, wasmArray) {
  for (let i = 0; i < jsArray.length; i++) {
    Module.setValue(wasmArray + i * doubleSize, jsArray[i], 'double');
  }
}

function setIntArray(jsArray, wasmArray) {
  for (let i = 0; i < jsArray.length; i++) {
    Module.setValue(wasmArray + i * intSize, jsArray[i], 'i32');
  }
}

function getDoubleArray(jsArray, wasmArray) {
  for (let i = 0; i < jsArray.length; i++) {
    jsArray[i] = Module.getValue(wasmArray + i * doubleSize, 'double');
  }
}

function getIntArray(jsArray, wasmArray) {
  for (let i = 0; i < jsArray.length; i++) {
    jsArray[i] = Module.getValue(wasmArray + i * intSize, 'i32');
  }
}

Highs_mipCall = Module.cwrap('Highs_mipCall', 'number', Array(18).fill('number'));

Module.ConstraintMatrixFormat = {CompressedSparseColumn: 1, CompressedSparseRow: 2}
Module.OptimizationSense = {Minimize: 1, Maximize: -1}
Module.VariableType = {Continuous: 0, Integer: 1, SemiContinuous: 2, SemiInteger: 3, ImplicitInteger: 4}

const solverStatusCodes = {
  "-1": "Error",
  "0": "Ok",
  "1": "Warning"
};

const modelStatusCodes = {
  0: "Not Set",
  1: "Load error",
  2: "Model error",
  3: "Presolve error",
  4: "Solve error",
  5: "Postsolve error",
  6: "Empty",
  7: "Optimal",
  8: "Infeasible",
  9: "Primal infeasible or unbounded",
  10: "Unbounded",
  11: "Bound on objective reached",
  12: "Target for objective reached",
  13: "Time limit reached",
  14: "Iteration limit reached",
  15: "Unknown",
};

Module.mipCall = function(numColumns, numRows, constraintMatrixFormat, sense, offset,
  columnCosts, columnLower, columnUpper, rowLower, rowUpper,
  constraintMatrixStarts, constraintMatrixIndices, constriantMatrixValues, integrality) {
  // Copy JavaScript arrays to Wasm memory
  const numNonZeros = constriantMatrixValues.length;
  const columnCostBuffer = Module._malloc(columnCosts.length * doubleSize);
  setDoubleArray(columnCosts, columnCostBuffer);
  const columnLowerBuffer = Module._malloc(columnLower.length * doubleSize);
  setDoubleArray(columnLower, columnLowerBuffer);
  const columnUpperBuffer = Module._malloc(columnUpper.length * doubleSize);
  setDoubleArray(columnUpper, columnUpperBuffer);
  const rowLowerBuffer = Module._malloc(rowLower.length * doubleSize);
  setDoubleArray(rowLower, rowLowerBuffer);
  const rowUpperBuffer = Module._malloc(rowUpper.length * doubleSize);
  setDoubleArray(rowUpper, rowUpperBuffer);
  const constraintStartBuffer = Module._malloc(constraintMatrixStarts.length * intSize);
  setIntArray(constraintMatrixStarts, constraintStartBuffer);
  const constraintIndexBuffer = Module._malloc(constraintMatrixIndices.length * intSize);
  setIntArray(constraintMatrixIndices, constraintIndexBuffer);
  const constraintValueBuffer = Module._malloc(constriantMatrixValues.length * doubleSize);
  setDoubleArray(constriantMatrixValues, constraintValueBuffer);
  const integralityBuffer = Module._malloc(integrality.length * intSize);
  setIntArray(integrality, integralityBuffer);

  // Set up outputs
  const columnValueBuffer = Module._malloc(numColumns * doubleSize);
  const rowValueBuffer = Module._malloc(numRows * doubleSize);
  const modelStatusBuffer = Module._malloc(intSize);

  const status = Highs_mipCall(numColumns, numRows, numNonZeros, constraintMatrixFormat, sense, offset, 
    columnCostBuffer, columnLowerBuffer, columnUpperBuffer,
    rowLowerBuffer, rowUpperBuffer, constraintStartBuffer, constraintIndexBuffer,
    constraintValueBuffer, integralityBuffer, columnValueBuffer, rowValueBuffer, modelStatusBuffer);

  const columnValues = new Array(numColumns);
  const rowValues = new Array(numRows);
  const modelStatusA = new Array(1);

  getDoubleArray(columnValues, columnValueBuffer);
  getDoubleArray(rowValues, rowValueBuffer);
  getIntArray(modelStatusA, modelStatusBuffer);

  const solverStatus = solverStatusCodes[status];
  const modelStatus = modelStatusCodes[modelStatusA[0]];

  // Clean up
  Module._free(columnCostBuffer);
  Module._free(columnLowerBuffer);
  Module._free(columnUpperBuffer);
  Module._free(rowLowerBuffer);
  Module._free(rowUpperBuffer);
  Module._free(constraintStartBuffer);
  Module._free(constraintIndexBuffer);
  Module._free(constraintValueBuffer);
  Module._free(integralityBuffer);
  Module._free(columnValueBuffer);
  Module._free(rowValueBuffer);
  Module._free(modelStatusBuffer);

  return {'solverStatus': solverStatus, 'modelStatus': modelStatus, 'columnValues': columnValues, 'rowValues': rowValues};
}