// создание мира
function World(hasUI) {
	this.hasUI = hasUI;
	this.state = [];
	this.wonLine = false;

	var cells = [];
	for (var x = 0; x < width; x++) {
		cells.push([]);
		for (var y = 0; y < height; y++) {
			cells[x].push( new Cell(x, y) );
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
	this.state.push(x, player);

	// @TODO: выпилить это в отдельные функции

	if (afterAddCallback) {
		// тут прогоняются все ходы противника, проверяем сможет ли он выиграть после нашего хода
		afterAddCallback();
		if (this.wonLine) {
			changedCell.weight = 1;
			return changedCell;
		}
	}

	// если противник не выиграл после нашего хода, то можно расчитать его вес
	for (var name in changedCell.directions) {
		changedCell.directions[name].update();
	}
	var cellWeight = 0;
	for (var name in changedCell.lines) {
		var line = changedCell.lines[name];
		line.update();
		cellWeight += line.weight;
		if (line.win) {
			this.wonLine = line;
		}
	}
	changedCell.weight = cellWeight;

	// UI
	if (this.hasUI) {
		changedCell.element.className = changedCell.element.className + ' ' + playerColors[currentPlayer];
		if (this.wonLine) {
			alert('The "' + playerColors[currentPlayer] + '" player has won!');
			document.body.removeEventListener('click', clickHandler);
			document.body.removeEventListener('touchend', clickHandler);
			// wonLine.name подскажет какие клетки подсветить
		} else {
			switchTurn();
		}
	}

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

var world = new World(true);
world.createUI();