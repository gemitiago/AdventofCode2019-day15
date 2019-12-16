const fs = require('fs');
let input = fs.readFileSync('./input.txt').toString();
input = input.split(',').map(n => Number(n));

const ParamMode = Object.freeze({ position: '0', immediate: '1', relative: '2' });

const nextInstIndex = (instIndex, diagProg) => {
  let res = instIndex;
  const inst = diagProg[instIndex].toString().padStart(5, '0');
  const opCode = inst[3].toString() + inst[4].toString();

  if (opCode === '01' || opCode === '02' || opCode === '07' || opCode === '08') {
    res += 4;
  } else if (opCode === '03' || opCode === '04' || opCode === '09') {
    res += 2;
  } else if (opCode === '05' || opCode === '06') {
    res += 3;
  }

  return res;
};

const undefinedToZero = val => {
  return val === undefined ? 0 : val;
};

const calcIndexWithParamMode = (modeParam, positionArgValue, immediateArgValue, relativeBase, diagProg) => {
  switch (modeParam) {
    case ParamMode.position:
      return positionArgValue;
    case ParamMode.immediate:
      return immediateArgValue;
    case ParamMode.relative:
      return relativeBase + diagProg[immediateArgValue];
    default:
      break;
  }
};

const runOpCode = (instIndex, diagProg, arrayInputInst, logOutputsYN = true, relativeBase = 0) => {
  const inst = diagProg[instIndex].toString().padStart(5, '0');
  const opCode = inst[3].toString() + inst[4].toString();
  const modeFirstParam = inst[2].toString();
  const modeSecondParam = inst[1].toString();
  const modeThirdParam = inst[0].toString();

  let jumpToIndex = null;
  let output = null;

  if (opCode === '99') {
    return {
      success: false,
      jumpToIndex: jumpToIndex,
      output: output,
      relativeBase: relativeBase,
      isWaitingInst: null
    };
  } else {
    const auxArg1 = diagProg[instIndex + 1];
    const indexArg1 = undefinedToZero(
      calcIndexWithParamMode(modeFirstParam, auxArg1, instIndex + 1, relativeBase, diagProg)
    );
    const arg1 = diagProg[indexArg1];
    const auxArg2 = diagProg[instIndex + 2];
    const arg2 =
      diagProg[
        undefinedToZero(calcIndexWithParamMode(modeSecondParam, auxArg2, instIndex + 2, relativeBase, diagProg))
      ];
    const auxindexArg3 = diagProg[instIndex + 3];
    const indexArg3 = undefinedToZero(
      calcIndexWithParamMode(modeThirdParam, auxindexArg3, instIndex + 3, relativeBase, diagProg)
    );

    switch (opCode) {
      case '01':
        diagProg[indexArg3] = arg1 + arg2;
        break;
      case '02':
        diagProg[indexArg3] = arg1 * arg2;
        break;
      case '03':
        if (arrayInputInst.length === 0) {
          return {
            success: true,
            jumpToIndex: null,
            output: null,
            relativeBase: relativeBase,
            isWaitingInst: instIndex
          };
        }

        diagProg[indexArg1] = arrayInputInst[0];
        arrayInputInst.length >= 1 && arrayInputInst.shift();
        break;
      case '04':
        logOutputsYN && console.log(arg1);
        output = arg1;
        break;
      case '05':
        jumpToIndex = arg1 !== 0 ? arg2 : null;
        break;
      case '06':
        jumpToIndex = arg1 === 0 ? arg2 : null;
        break;
      case '07':
        diagProg[indexArg3] = arg1 < arg2 ? 1 : 0;
        break;
      case '08':
        diagProg[indexArg3] = arg1 === arg2 ? 1 : 0;
        break;
      case '09':
        relativeBase += arg1;
        break;
      default:
        break;
    }
  }

  if (jumpToIndex < 0) {
    return { success: false, jumpToIndex: jumpToIndex, output: null, relativeBase: relativeBase, isWaitingInst: null };
  } else {
    return { success: true, jumpToIndex: jumpToIndex, output: output, relativeBase: relativeBase, isWaitingInst: null };
  }
};

const runProgram = (arrayInputInst, diagProg, instIndex = 0, relativeBase = 0) => {
  let auxProg = [...diagProg];
  let executeOpCode = {};
  let output = null;
  let listOutputs = [];
  let isWaitingInst = null;

  instIndex === null ? (instIndex = 0) : (instIndex = instIndex);

  while (true) {
    executeOpCode = runOpCode(instIndex, auxProg, arrayInputInst, false, relativeBase);
    relativeBase = executeOpCode.relativeBase;
    isWaitingInst = executeOpCode.isWaitingInst;

    if (!executeOpCode.success || isWaitingInst !== null) {
      break;
    }

    if (executeOpCode.output !== null) {
      output = executeOpCode.output;
      listOutputs.push(output);
    }

    const jumpToIndex = executeOpCode.jumpToIndex;

    if (jumpToIndex === null) {
      instIndex = nextInstIndex(instIndex, auxProg);
    } else {
      instIndex = jumpToIndex;
    }
  }
  auxProg = auxProg.map(i => undefinedToZero(i));
  return {
    output: listOutputs,
    prog: auxProg,
    exit: !executeOpCode.success,
    isWaitingInst: isWaitingInst,
    relativeBase: relativeBase
  };
};

//-------------------------------------Day15

const getBitDirection = direction => {
  const array = ['U', 'D', 'L', 'R'];

  return array.indexOf(direction) + 1;
};

const calcNextPos = (currentPos, direction, step = 1) => {
  const pos = [...currentPos.pos];
  const arrayDirection = ['U', 'D', 'L', 'R'];
  const arrayCoordinate = [1, 1, 0, 0];
  const arrayStep = [1 * step, -1 * step, -1 * step, 1 * step];
  const index = arrayDirection.indexOf(direction);

  pos[arrayCoordinate[index]] += arrayStep[index];

  return { pos: pos, type: '.' };
};

const canMove = (currentPos, grid, direction) => {
  let nextPos = calcNextPos(currentPos, direction);
  let pos = getPos(grid, nextPos.pos);

  if (pos === null || pos.type === '.') return true;

  return false;
};

const getNextDirection = (currentPos, grid, previousPos, previousDirection) => {
  if (previousPos === null) return previousDirection;

  const posU = getPos(grid, calcNextPos(currentPos, 'U').pos);
  const posD = getPos(grid, calcNextPos(currentPos, 'D').pos);
  const posL = getPos(grid, calcNextPos(currentPos, 'L').pos);
  const posR = getPos(grid, calcNextPos(currentPos, 'R').pos);

  if (posL === null) return 'L';
  if (posU === null) return 'U';
  if (posR === null) return 'R';
  if (posD === null) return 'D';

  const canMoveU = canMove(currentPos, grid, 'U');
  const canMoveL = canMove(currentPos, grid, 'L');
  const canMoveR = canMove(currentPos, grid, 'R');
  const canMoveD = canMove(currentPos, grid, 'D');

  let countBadDirections = 0;
  if (!canMoveU) countBadDirections++;
  if (!canMoveD) countBadDirections++;
  if (!canMoveL) countBadDirections++;
  if (!canMoveR) countBadDirections++;

  if (countBadDirections === 3) {
    const auxPos = getPos(grid, currentPos.pos);
    auxPos.type = '#';
  }

  if (!canMoveR && !canMoveU && previousDirection === 'R') return canMoveD ? 'D' : 'L';
  if (!canMoveR && !canMoveU && previousDirection === 'U') return canMoveL ? 'L' : 'D';
  if (!canMoveL && !canMoveU && previousDirection === 'L') return canMoveD ? 'D' : 'R';
  if (!canMoveL && !canMoveU && previousDirection === 'U') return canMoveR ? 'R' : 'D';
  if (!canMoveR && !canMoveD && previousDirection === 'R') return canMoveU ? 'U' : 'L';
  if (!canMoveR && !canMoveD && previousDirection === 'D') return canMoveL ? 'L' : 'U';
  if (!canMoveL && !canMoveD && previousDirection === 'L') return canMoveU ? 'U' : 'R';
  if (!canMoveL && !canMoveD && previousDirection === 'D') return canMoveR ? 'R' : 'U';
  if (!canMoveL && !canMoveR && previousDirection === 'D') return canMoveD ? 'D' : 'U';
  if (!canMoveL && !canMoveR && previousDirection === 'U') return canMoveU ? 'U' : 'D';

  if (canMove(currentPos, grid, previousDirection)) return previousDirection;
  if (canMoveL) return 'L';
  if (canMoveU) return 'U';
  if (canMoveR) return 'R';
  if (canMoveD) return 'D';
};

const getPos = (grid, _pos) => {
  for (const pos of grid) {
    if (pos.pos[0] === _pos[0] && pos.pos[1] === _pos[1]) {
      return pos;
    }
  }

  return null;
};

const printGrid = (_grid, currentPos = null, startingPos = null) => {
  const grid = [];
  const minY = Math.min(..._grid.map(obj => obj.pos[1]));
  const maxY = Math.max(..._grid.map(obj => obj.pos[1]));
  const minX = Math.min(..._grid.map(obj => obj.pos[0]));
  const maxX = Math.max(..._grid.map(obj => obj.pos[0]));
  const offsetX = minX < 0 ? Math.abs(minX) : 0;

  for (let i = maxY; i >= minY; i--) {
    const line = [];

    for (let j = maxX; j >= minX; j--) {
      const pos = getPos(_grid, [j, i]);

      if (pos === null) {
        line[j + offsetX] = ' ';
      } else {
        line[j + offsetX] = pos.type;
      }

      if (currentPos !== null && j === currentPos.pos[0] && i === currentPos.pos[1]) {
        line[j + offsetX] = 'D';
      } else if (startingPos !== null && j === 0 && i === 0) {
        line[j + offsetX] = 'X';
      }
    }

    grid.push(line.join(''));
  }

  return grid.join('\n');
};

const minStepsFindOxigenSystem = (input, discoverAllMap = false, printGridYN = false) => {
  let resultRunProg = { prog: [...input] };
  let grid = [];
  const startingPos = { pos: [0, 0], type: '.', realType: '' };
  let oxigenSystemPos = null;
  let currentPos = { pos: [...startingPos.pos], type: '.' };
  let nextPos = null;
  let direction = 'L';
  let previousPos = currentPos;

  grid.push(startingPos);

  let countSteps = 0;

  while (true) {
    direction = getNextDirection(currentPos, grid, previousPos, direction);
    nextPos = calcNextPos(currentPos, direction);
    resultRunProg = runProgram(
      [getBitDirection(direction)],
      resultRunProg.prog,
      resultRunProg.isWaitingInst,
      resultRunProg.relativeBase
    );

    previousPos = currentPos;

    if (resultRunProg.output[0] === 2) {
      //output 2 = its new position is the location of the oxygen system.
      nextPos.type = 'S';
      currentPos = nextPos;
      oxigenSystemPos = nextPos;
      grid.push(oxigenSystemPos);

      const res = grid.map(obj => {
        if (obj.type === '.') {
          countSteps++;
        }
        return obj;
      });

      if (!discoverAllMap) break;
    } else if (resultRunProg.output[0] === 0) {
      //output 0 = The repair droid hit a wall. didnt move
      nextPos.type = '#';
      previousPos = nextPos;
    } else if (resultRunProg.output[0] === 1) {
      //output 1 = The repair droid has moved one step in the requested direction.
      nextPos.type = '.';
      currentPos = nextPos;
    } else {
      nextPos.type = ' ';
    }

    nextPos.realType = nextPos.type;

    const pos = getPos(grid, nextPos.pos);

    if (pos === null) {
      grid.push(nextPos);
    }

    if (printGridYN) {
      console.log('Grid----------------------------------:');
      console.log(printGrid(grid, currentPos, startingPos));
      console.log('');
    }

    if (discoverAllMap) {
      const countLocations = grid.reduce((acc, obj) => {
        if (obj.type === '.') acc++;
        return acc;
      }, 0);

      if (countLocations === 1 && oxigenSystemPos !== null) break;
    }
  }

  grid = grid.map(obj => {
    obj.type = obj.realType;
    return obj;
  });

  if (printGridYN) {
    console.log('Grid----------------------------------:');
    console.log(printGrid(grid, currentPos, startingPos));
    console.log('');
  }

  return { count: countSteps, list: grid, oxigenSystemPos: oxigenSystemPos };
};

const minToFill = (input, printGridYN = false) => {
  const resultMinSteps = minStepsFindOxigenSystem(input, true);
  const grid = resultMinSteps.list;
  const oxigenSystemPos = resultMinSteps.oxigenSystemPos;
  let count = 0;

  listCurrentPos = [];
  listCurrentPos.push(oxigenSystemPos);

  while (true) {
    let listLastFilled = [];

    for (const position of listCurrentPos) {
      const canMoveU = canMove(position, grid, 'U');
      const canMoveL = canMove(position, grid, 'L');
      const canMoveR = canMove(position, grid, 'R');
      const canMoveD = canMove(position, grid, 'D');

      if (canMoveU) {
        let posU = getPos(grid, calcNextPos(position, 'U').pos);

        posU.type = 'O';
        listLastFilled.push(posU);
      }

      if (canMoveD) {
        let posD = getPos(grid, calcNextPos(position, 'D').pos);

        posD.type = 'O';
        listLastFilled.push(posD);
      }

      if (canMoveR) {
        let posR = getPos(grid, calcNextPos(position, 'R').pos);

        posR.type = 'O';
        listLastFilled.push(posR);
      }

      if (canMoveL) {
        let posL = getPos(grid, calcNextPos(position, 'L').pos);

        posL.type = 'O';
        listLastFilled.push(posL);
      }
    }

    listCurrentPos = [...listLastFilled];
    listLastFilled = [];

    count++;

    if (printGridYN) {
      console.log('Grid----------------------------------:');
      console.log(printGrid(grid));
      console.log('');
    }

    const countLocations = grid.reduce((acc, obj) => {
      if (obj.type === '.') acc++;
      return acc;
    }, 0);

    if (countLocations === 0) break;
  }

  return count;
};

console.time('part1');
console.log(minStepsFindOxigenSystem(input).count);
console.timeEnd('part1');
console.time('part2');
console.log(minToFill(input));
console.timeEnd('part2');
