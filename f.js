var state = []; // состояние, это история всех ходов
var width = 7;
var height = 6;
var lastX = width - 1;
var lastY = height - 1;
// создание мира
function World(hasUI) {
	this.hasUI = hasUI;
	this.state = [];
	this.wonLine = false;

	var cells = [];
	for (var x = 0; x < width; x++) {
		cells.push([]);
		for (var y = 0; y < height; y++) {
			cells[x].push( new Cell(x, y, this) );
		}
	}

	this.cells = cells;
}
World.prototype.applyState = function(state) {
	for (var i = 0; i < state.length; i++) {
		var move = state[i];
		this.ownCell(move.x, move.player);
	}
};
World.prototype.ownCell = function(x, player, afterAddCallback) {
	var changedCell;
	if (x < 0 || x > lastX) {
		console.error('Put stone between 0 and ' + lastX + ' inclusive, not ' + x);
		return false;
	}
	// находим на какую линию `y` упадет фишечка в колонке `x`
	for (var y = 0; y < height; y++) {
		if (this.cells[x][y].player == 0) {
			changedCell = this.cells[x][y];
			changedCell.player = player;
			break;
		} else if (y == lastY) {
			console.error('X:' + x + ' is already full');
			return false;
		}
	}

	// добавим ход в историю
	this.state.push({ x: x, player: player });

	return changedCell;
};
World.prototype.createUI = function() {
	var worldElement = document.querySelectorAll('.world')[0];
	for (var x = 0; x < width; x++) {
		var columnElement = document.createElement('div');
		columnElement.className = 'column x' + x;
		columnElement.setAttribute('data-x', x);
		for (var y = lastY; y > -1; y--) {
			var cellElement = document.createElement('div');
			cellElement.className = 'cell y' + y;
			cellElement.setAttribute('data-x', x);
			cellElement.setAttribute('data-y', y);
			columnElement.appendChild(cellElement);

			this.cells[x][y].element = cellElement;
		}
		worldElement.appendChild(columnElement);
	}
};
World.prototype.print = function() {
	var output = [];
	for (var i = 0; i < width; i++) {
		for (var j = 0; j < height; j++) {
			// на первой итерации сделаем все строками
			if (!i) {
				output[j] = '';
			}
			output[j] += this.cells[i][j].player + ' ';
		}
	}
	console.log( output.join('\n') );
};

var world = new World(true);
world.createUI();

/**
 * Добавить фишечку в определенную колонку.
 * @param {Object} world Возможно, воображаемый мир (клон world'a) при анализе ходов ботом, либо реальный world
 * @param {Number} x В какую колонку добавить фишечку
 * @param {Number} player Ид игрока [1|2]
 * @param {Function} afterAddCallback Функция вызывается сразу после добавления фишечки в колонку, перед расчетом весов этого хода
 * @returns {Boolean} 
 */
// function add(world, x, player, afterAddCallback) {
// 	var changedCell;
// 	if (x < 0 || x > lastX) {
// 		console.error('Put stone between 0 and ' + lastX + ' inclusive, not ' + x);
// 		return false;
// 	}
// 	// находим на какую линию `y` упадет фишечка в колонке `x`
// 	for (var y = 0; y < height; y++) {
// 		if (world[x][y].player == 0) {
// 			changedCell = world[x][y];
// 			changedCell.player = player;
// 			break;
// 		} else if (y == lastY) {
// 			console.error('This X is already full');
// 			return false;
// 		}
// 	}

// 	if (afterAddCallback) {
// 		// тут прогоняются все ходы противника, проверяем сможет ли он выиграть после нашего хода
// 		afterAddCallback();
// 		if (world.wonLine) {
// 			changedCell.weight = 1;
// 			return changedCell;
// 		}
// 	}

// 	// если противник не выиграл после нашего хода, то можно расчитать его вес
// 	for (var name in changedCell.directions) {
// 		changedCell.directions[name].update();
// 	}
// 	var cellWeight = 0;
// 	for (var name in changedCell.lines) {
// 		var line = changedCell.lines[name];
// 		line.update();
// 		cellWeight += line.weight;
// 		if (line.win) {
// 			world.wonLine = line;
// 		}
// 	}
// 	changedCell.weight = cellWeight;

// 	return changedCell;
// }

/**
 * Сущности:
 * Cell
 * Direction
 */

/**
 * @param {Number} player
 *					0 - пусто
 *					1 - 1ый игрок
 *					2 - 2ой игрок
 * @param {Number} x
 * @param {Number} y
 * @param {DOM} [element]
 * @param {Number} weight
 * @param {Array} directions
 * @param {Array} lines
 */
function Cell(x, y, world) {
	this.player = 0;
	this.x = x;
	this.y = y;
	this.world = world;
	this.weight = 0;
	this.directions = {
		top: new Direction(this, 'top'),
		right: new Direction(this, 'right'),
		bottom: new Direction(this, 'bottom'),
		left: new Direction(this, 'left'),
		topRight: new Direction(this, 'topRight'),
		bottomRight: new Direction(this, 'bottomRight'),
		bottomLeft: new Direction(this, 'bottomLeft'),
		topLeft: new Direction(this, 'topLeft')
	};
	this.lines = {
		horizontal: new Line(this, 'horizontal'),
		vertical: new Line(this, 'vertical'),
		slash: new Line(this, 'slash'),
		backslash: new Line(this, 'backslash')
	};
}
Cell.prototype.calculateWeight = function() {
	var cellWeight = 0;

	for (var name in this.directions) {
		this.directions[name].update();
	}

	for (var name in this.lines) {
		var line = this.lines[name];
		line.update();
		cellWeight += line.weight;
		if (line.win) {
			this.world.wonLine = line;
		}
	}

	this.weight = cellWeight;

	return cellWeight;
};

/**
 * 8 направлений, но 4 линии:
 * 	 - вертикаль
 *   - горизонталь
 *   - слэш
 *   - бэкслэш
 *
 * Bottom всегда имеет 0 freedom.
 *
 * @param {Cell} cell
 * @param {String} name
 *					'top'
 *					'right'
 *					'bottom'
 *					'left'
 *					'topRight'
 *					'bottomRight'
 *					'bottomLeft'
 *					'topLeft'
 * @param {Number} freedom
 * @param {Number} ourCells
 * @param {Number} touchingOurCells
 */
function Direction(cell, name) {
	this.cell = cell;
	this.name = name;

	this.freedom = 0;
	this.ourCells = 0;
	this.dead = false;
}
function updateDirection() {
	var freedom = [];
	var ourCells = [];
	var touchingOurCells = [];
	var notOurCells = [];
	var touchingNotOurCells = [];
	var x = this.cell.x;
	var y = this.cell.y;
	var player = this.cell.player;

	function analyzeCell(cell) {
		switch (cell.player) {
			case 0: // пустая клетка - свобода
				if (notOurCells == 0) {
					freedom.push(cell);
				}
				break;
			case player: // если клетка занята нами - продолжаем смотреть дальше, если не нами - свободы закончились
				if (notOurCells == 0) {
					ourCells.push(cell);
					if (freedom.length == 0) {
						touchingOurCells.push(cell);
					}
				}
				break;
			default: // подсчитываем сколько вражеских фишечек перекроем
				if (ourCells.length == 0) {
					notOurCells.push(cell);
					if (freedom.length == 0) {
						touchingNotOurCells.push(cell);
					}
				} else {
					return false;
				}
		}
		return true;
	}

	switch (this.name) {
		case 'top':
			while (++y < height) {
				if (y > lastY) {
					break;
				}
				if (!analyzeCell(world.cells[x][y])) {
					break;
				}
			}
			break;
		case 'right': {
			while (++x < width) {
				if (x > lastX) {
					break;
				}
				if (!analyzeCell(world.cells[x][y])) {
					break;
				}
			}
			break;
		}
		case 'bottom': {
			while (--y > -1) {
				if (y < 0) {
					break;
				}
				if (!analyzeCell(world.cells[x][y])) {
					break;
				}
			}
			break;
		}
		case 'left': {
			while (--x > -1) {
				if (x < 0) {
					break;
				}
				if (!analyzeCell(world.cells[x][y])) {
					break;
				}
			}
			break;
		}
		case 'topRight': {
			while (++x < width && ++y < height) {
				if (x > lastX || y > lastY) {
					break;
				}
				if (!analyzeCell(world.cells[x][y])) {
					break;
				}
			}
			break;
		}
		case 'bottomRight': {
			while (++x < width && --y > -1) {
				if (x > lastX || y < 0) {
					break;
				}
				if (!analyzeCell(world.cells[x][y])) {
					break;
				}
			}
			break;
		}
		case 'bottomLeft': {
			while (--x > -1 && --y > -1) {
				if (x < 0 || y < 0) {
					break;
				}
				if (!analyzeCell(world.cells[x][y])) {
					break;
				}
			}
			break;
		}
		case 'topLeft': {
			while (--x > -1 && ++y < height) {
				if (x < 0 || y > lastY) {
					break;
				}
				if (!analyzeCell(world.cells[x][y])) {
					break;
				}
			}
			break;
		}
	}

	this.freedom = freedom;
	this.ourCells = ourCells;
	this.touchingOurCells = touchingOurCells;
	this.notOurCells = notOurCells;
	this.touchingNotOurCells = touchingNotOurCells;
}
Direction.prototype.update = updateDirection;

/**
 * @param {Cell} cell
 * @param {String} name
 *                 - horizontal
 *                 - vertical
 *                 - slash
 *                 - backslash
 * @param {Number} ourCells 
 * @param {Number} freedom
 * @param {Number} weight Вес линии
 * @param {Boolean} dead По этой линии уже не собрать 4
 */
function Line(cell, name) {
	this.cell = cell;
	this.name = name;
	this.freedom = 0;
	this.ourCells = 0;
	this.touchingOurCells = 0;
	this.notOurCells = 0;
	this.touchingNotOurCells = 0;
	this.dead = true;
}
Line.prototype.fields = [
	'freedom',
	'ourCells',
	'touchingOurCells',
	'notOurCells',
	'touchingNotOurCells'
];
function updateLine() {
	var cell = this.cell;
	var fields = this.fields;
	function concatOppositeDirections(first, second) {
		var direction1 = cell.directions[first];
		var direction2 = cell.directions[second];
		for (var i = 0; i < fields.length; i++) {
			direction1[ fields[i] ].concat( direction2[ fields[i] ] );
		}
	}
	switch (this.name) {
		case 'horizontal':
			concatOppositeDirections('left', 'right');
			break;
		case 'vertical':
			concatOppositeDirections('top', 'bottom');
			break;
		case 'slash':
			concatOppositeDirections('bottomLeft', 'topRight');
			break;
		case 'backslash':
			concatOppositeDirections('topLeft', 'bottomRight');
			break;
	}

	// количество свобод + количество наших фишечек должно быть хотя бы 3, чтобы собрать ряд
	this.dead = (this.freedom.length + this.ourCells.length) < 3;
	this.win = this.touchingOurCells.length > 2;

	// подсчитаем вес линии
	var weight = 0;

	var ourCellsWeightMultiplier = 100;
	var freedomWeightMultiplier = 10;
	var verticalFreedomWeightMultiplier = 5; // вес вертикальных свобод должен быть меньше, т.к. их больше всего на первой линии, а она не вин
	if (!this.dead) {
		weight += this.ourCells.length * ourCellsWeightMultiplier;
		weight += this.freedom.length * (name == 'vertical' ? verticalFreedomWeightMultiplier : freedomWeightMultiplier);
	}
	switch (this.notOurCells) {
		case 1:
			weight += this.notOurCells.length * 100;
			break;
		case 2:
			weight += this.notOurCells.length * 150;
			break;
		case 3:
		case 4:
		case 5:
			weight += this.notOurCells.length * 1000;
			break;
	}
	if (this.touchingNotOurCells.length > 2) {
		weight += 100000;
	}
	if (this.win) {
		weight += 1000000;
	}
	this.weight = weight;
}
Line.prototype.update = updateLine;

function getBestMove(world, player, deeper) {
	var bestMove = {x: 0, weight: 0};

	for (var x = 0; x < width; x++) {
		var imaginaryWorld = new World();
		imaginaryWorld.applyState(world.state);

		var changedCell = imaginaryWorld.ownCell(x, player);
		if (!changedCell) { // если колонка уже полная, продолжаем
			continue;
		}
		changedCell.calculateWeight();

		if (imaginaryWorld.wonLine) {
			bestMove.x = x;
			bestMove.weight = changedCell.weight;
			return bestMove;
		}

		var opponent = player == 1 ? 2 : 1;
		calculateAllWeightsForGivenWorld(imaginaryWorld, opponent);

		if (imaginaryWorld.wonLine) {
			changedCell.weight = 1;
		}

		if (changedCell.weight > bestMove.weight) {
			bestMove.x = x;
			bestMove.weight = changedCell.weight;
		}
	}

	return bestMove;
}

function calculateAllWeightsForGivenWorld(world, player) {
	var changedCells = [];
	for (var x = 0; x < width; x++) {
		var changedCell = world.ownCell(x, player);
		if (changedCell) {
			changedCell.calculateWeight();
			changedCell.player = 0;
			changedCells.push(changedCell);
		}
	}
	return changedCells;
}
