// создадим поле для игры
(function() {
	// var worldElement = document.querySelectorAll('.world')[0];
	// for (var x = 0; x < width; x++) {
	// 	var columnElement = document.createElement('div');
	// 	columnElement.className = 'column x' + x;
	// 	columnElement.setAttribute('data-x', x);
	// 	for (var y = lastY; y > -1; y--) {
	// 		var cellElement = document.createElement('div');
	// 		cellElement.className = 'cell y' + y;
	// 		cellElement.setAttribute('data-x', x);
	// 		cellElement.setAttribute('data-y', y);
	// 		columnElement.appendChild(cellElement);
	// 	}
	// 	worldElement.appendChild(columnElement);
	// }
})();

function moveDone(column) {
	var x = column.getAttribute('data-x');
	var changedCell = world.ownCell(x, currentPlayer);
	changedCell.calculateWeight();
	changedCell.element.className = changedCell.element.className + ' ' + playerColors[currentPlayer];
	if (world.wonLine) {
		alert('The "' + playerColors[currentPlayer] + '" player has won!');
		cellElement.off('click', 'touchend', clickHandler);
		// wonLine.name подскажет какие клетки подсветить
	} else {
		switchTurn();
	}
}

// навешаем событие клика на колонки
var cellElement = D('.cell');
cellElement.on('click', 'touchend', clickHandler);
function clickHandler(e) {
	var column = e.target.parentElement;
	moveDone(column);
}

// логика перехода ходов
var playerColors = ['white', 'red', 'blue'];
var currentPlayer = 1;
function switchTurn() {
	currentPlayer = currentPlayer == 1 ? 2 : 1;

	if (currentPlayer == 2) {
		var move = getBestMove(world, currentPlayer);
		var column = document.querySelectorAll('.x' + move.x)[0];
		moveDone(column);
	}
}

var modeSelectors = D('.mode-selectors');
D('.mode').on('click', function(e) {
	setMode(e.target.getAttribute('data-mode'));
});
