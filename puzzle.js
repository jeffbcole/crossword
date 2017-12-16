var puzzle = {};

var isSelectingBlackSquares = true;
var isSymetrical = true;

var isSelectingAcrossClues = true;

function Initialize() {

    document.getElementById('Title').addEventListener("input", OnTitleChanged);
    document.getElementById('Title').value = "";
    
    document.getElementById('ClueBarText').addEventListener("input", OnClueBarTextChanged);
    document.getElementById('ClueBarText').value = "";

    // Initialize the edit tool
    if (isSelectingBlackSquares) {
        document.getElementById('radioBlocks').checked = true;
    } else {
        document.getElementById('radioText').checked = true;
    }

    // Detect when user is typing
    MakeFocusDetectable(document.getElementById('ClueBarText'));
    MakeFocusDetectable(document.getElementById('Title'));

    MakeTextAreaAutoSizeHeight(document.getElementById('ClueBarText'), 200);

    InitializeEmptyPuzzle(true);

    document.onkeydown = checkKey;
}

var textEntryIsFocused = false;

function MakeFocusDetectable(element) {
    element.onfocus = function() {
        textEntryIsFocused = true;
    }
    element.onblur = function() {
        textEntryIsFocused = false;
    }
}

function MakeClueFocusDetectable(element) {
    element.onfocus = function() {
        var startCell = element.clue.startCell;
        isSelectingAcrossClues = element.clue.isAcross;
        SelectCell(element.clue.startCell);
        textEntryIsFocused = true;
    }
    element.onblur = function() {
        textEntryIsFocused = false;
    }
}

function MakeTextAreaAutoSizeHeight(element, maxSize) {
    element.oninput = function() {
        element.style.height = "";
        element.style.height = Math.min(element.scrollHeight, maxSize) + "px";
      };
}

function OnTitleChanged() {
    var el = document.getElementById('Title');
    var curTitle = el.value;
    puzzle.title = curTitle;
    // TODO: save puzzle state
}

function OnClueBarTextChanged() {
    if (currentSelectedCell != null) {
        var barText = document.getElementById('ClueBarText').value;
        if (isSelectingAcrossClues) {
            currentSelectedCell.acrossClue.text = barText;
            currentSelectedCell.acrossClue.clueView.children[1].value = barText;
        } else {
            currentSelectedCell.downClue.text = barText;
            currentSelectedCell.downClue.clueView.children[1].value = barText;
        }
    }
    // TODO: save puzzle state
}

function OnClueListItemTextChanged(ev) {
    ev.target.clue.text = ev.target.value;
    if (currentSelectedCell === null) {
        return;
    }
    if (ev.target.clue.isAcross) {
        if (isSelectingAcrossClues && currentSelectedCell.acrossClue === ev.target.clue) {
            document.getElementById('ClueBarText').value = ev.target.value;
        }
    } else {
        if (!isSelectingAcrossClues && currentSelectedCell.downClue === ev.target.clue) {
            document.getElementById('ClueBarText').value = ev.target.value;
        }
    }
}

function OnEditToolbarChanged(radio) {
    isSelectingBlackSquares = radio.value === 'radioBlocks';
    if (isSelectingBlackSquares) {
        SelectCell(null);
    } else {
        // Select the first non black square
        for (var i=0; i<puzzle.rows; i++) {
            for (var j=0; j<puzzle.columns; j++) {
                if (!puzzle.cells[i][j].isBlack) {
                    SelectCell(puzzle.cells[i][j]);
                    return;
                }
            }
        }
    }
}

function InitializeEmptyPuzzle(isSunday) {
    puzzle = {};
    puzzle.title = "Untitled";
    puzzle.cells = [];
    puzzle.cluesAcross = [];
    puzzle.cluesDown = [];
    puzzle.isSunday = isSunday;
    if (isSunday) {
        puzzle.rows = 21;
        puzzle.columns = 21;
    } else {
        puzzle.rows = 15;
        puzzle.columns = 15;
    }

    document.getElementById('Title').value = puzzle.title;
    
    var cellsContainer = document.getElementById('BoardCells')
    cellsContainer.innerHTML = "";
    var boardGrid = document.getElementById('BoardGrid');
    boardGrid.innerHTML = "";
    var acrossCluesContainer = document.getElementById('CluesListAcross');
    acrossCluesContainer.innerHTML = "";
    var downCluesContainer = document.getElementById('CluesListDown');
    downCluesContainer.innerHTML = "";
    
    var cellWidth = 495.0/puzzle.rows;
    var cellHeight = 495.0/puzzle.columns;
    var cellNumberFontSize = puzzle.isSunday ? 7.67 : 10;
    var cellTextFontSize = puzzle.isSunday ? 15.33 : 22;
    var cellNumberOffsetX = 2;
    var cellNumberOffsetY = puzzle.isSunday ? 8.17 : 11.5;
    var cellTextOffsetX = puzzle.isSunday ?  11.5 : 16;
    var cellTextOffsetY = puzzle.isSunday ? 21.08 : 30.25;
    var curTop = 3.0;
    var curLeft = 3.0;
    var curIndex = 1;
    for (var i=0; i<puzzle.rows; i++) {
        curLeft = 3.0;
        var curRow = [];
        for (var j=0; j<puzzle.columns; j++) {
            var cell = {};
            cell.row = i;
            cell.column = j;
            cell.text = '';
            cell.isBlack = false;
            cell.isNumberedCell = false;
            cell.isAcrossWordStart = false;
            cell.isDownWordStart = false;
            
            if (i===0 || (i > 0 && puzzle.cells[i-1][j].isBlack)) {
                cell.isNumberedCell = true;
                cell.isDownWordStart = true;
            }
            if (j===0 || (j > 0 && curRow[j-1].isBlack)) {
                cell.isNumberedCell = true;
                cell.isAcrossWordStart = true;
            }

            var cellView = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            var cellRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            
            cellRect.setAttribute('x', curLeft);
            cellRect.setAttribute('y', curTop);
            cellRect.setAttribute('width', cellWidth);
            cellRect.setAttribute('height', cellHeight);
            cellRect.setAttribute('fill', 'none');
            cellView.appendChild(cellRect);
            
            var cellText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            cellText.setAttribute('x', curLeft + cellNumberOffsetX);
            cellText.setAttribute('y', curTop + cellNumberOffsetY);
            cellText.setAttribute('text-anchor', "start");
            cellText.setAttribute('font-size', cellNumberFontSize);
            cellText.innerHTML = cell.isNumberedCell ? curIndex : "";
            cellView.appendChild(cellText);
            
            var cellText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            cellText.setAttribute('x', curLeft + cellTextOffsetX);
            cellText.setAttribute('y', curTop + cellTextOffsetY);
            cellText.setAttribute('text-anchor', "middle");
            cellText.setAttribute('font-size', cellTextFontSize);
            cellText.innerHTML = '';
            cellView.appendChild(cellText);
            cellsContainer.appendChild(cellView);

            cell.cellView = cellView;
            curRow.push(cell);
            
            curLeft = curLeft + cellWidth;
            if (cell.isNumberedCell) {
                cell.clueNumber = curIndex;
                curIndex = curIndex + 1;
            }
        }
        puzzle.cells.push(curRow);
        curTop = curTop + cellHeight;
    }

    var boardGridLines = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    boardGridLines.setAttribute('fill', 'none');
    boardGridLines.setAttribute('vector-effect', "non-scaling-stroke");
    boardGridLines.setAttribute('stroke', 'dimgray');
    var pathText = "";

    curLeft = 3.0;
    curTop = 3.0 + cellHeight;
    for (var i=0; i<puzzle.rows-1; i++) {
        pathText = pathText + "M" + curLeft + "," + curTop + " l495.00,0.00";
        curTop = curTop + cellHeight;
    }
    curLeft = 3.0 + cellWidth;
    curTop = 3.0;
    for (var i=0; i<puzzle.columns-1; i++) {
        pathText = pathText + "M" + curLeft + "," + curTop + " l0.0,495.0";
        curLeft = curLeft + cellWidth;
    }
    boardGridLines.setAttribute('d', pathText);
    boardGrid.appendChild(boardGridLines);

    var boardBorder = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    boardBorder.setAttribute('x', 1.5);
    boardBorder.setAttribute('y', 1.5);
    boardBorder.setAttribute('width', 498);
    boardBorder.setAttribute('height', 498);
    boardBorder.setAttribute('fill', 'none');
    boardBorder.setAttribute('stroke-width', 3.0);
    boardBorder.setAttribute('stroke', 'black');
    boardGrid.appendChild(boardBorder);

    UpdateClues();
}

function OnBoardClick(evt) {
    var board = document.getElementById('Board');
    var pt = board.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    var clickLoc = pt.matrixTransform(board.getScreenCTM().inverse());
    var column = Math.floor((puzzle.columns)*(clickLoc.x-5)/495.0);
    column = Math.min(Math.max(column, 0), puzzle.columns-1);
    var row = Math.floor((puzzle.rows)*(clickLoc.y-5)/495.0);
    row = Math.min(Math.max(row, 0), puzzle.rows-1);
    var cell = puzzle.cells[row][column];

    if (isSelectingBlackSquares) {
        if (cell.isBlack) {
            cell.isBlack = false;
            cell.cellView.children[0].setAttribute("fill", "none");
        } else {
            cell.isBlack = true;
            cell.cellView.children[0].setAttribute("fill", "black");
        }
        if (isSymetrical) {
            var oppRow = puzzle.rows - 1 - row;
            var oppCol = puzzle.columns - 1 - column;
            if (!(oppRow === row && oppCol === column)) {
                cell = puzzle.cells[oppRow][oppCol];
                if (cell.isBlack) {
                    cell.isBlack = false;
                    cell.cellView.children[0].setAttribute("fill", "none");
                } else {
                    cell.isBlack = true;
                    cell.cellView.children[0].setAttribute("fill", "black");
                }
            }
        }
        UpdateCellNumbers();
        UpdateClues();
        // TODO: save puzzle state
    } else {
        if (!cell.isBlack) {
            SelectCell(cell);
        }
    }
}

function UpdateCellNumbers() {
    
    // TODO: can I retain clues if the answer still exists?
    var acrossCluesContainer = document.getElementById('CluesListAcross');
    acrossCluesContainer.innerHTML = "";
    var downCluesContainer = document.getElementById('CluesListDown');
    downCluesContainer.innerHTML = "";
    puzzle.cluesAcross = [];
    puzzle.cluesDown = [];

    var curIndex = 1;
    for (var i=0; i<puzzle.rows; i++) {
        for (var j=0; j<puzzle.columns; j++) {
            var cell = puzzle.cells[i][j];
            if (cell.isBlack) {
                cell.cellView.children[1].innerHTML = "";
                cell.cellView.children[2].innerHTML = "";
                cell.isNumberedCell = false;
                cell.isAcrossWordStart = false;
                cell.isDownWordStart = false;
                continue;
            }
            cell.isNumberedCell = false;
            cell.isAcrossWordStart = false;
            cell.isDownWordStart = false;
            if (i===0 || (i > 0 && puzzle.cells[i-1][j].isBlack)) {
                cell.isNumberedCell = true;
                cell.isDownWordStart = true;
            }
            if (j===0 || (j > 0 && puzzle.cells[i][j-1].isBlack)) {
                cell.isNumberedCell = true;
                cell.isAcrossWordStart = true;
            }

            if (cell.isNumberedCell) {
                cell.clueNumber = curIndex;
                cell.cellView.children[1].innerHTML = curIndex;
                curIndex++;
            } else {
                cell.cellView.children[1].innerHTML = "";
            }
        }
    }
}


function UpdateClues() {
    for (var i=0; i<puzzle.rows; i++) {
        for (var j=0; j<puzzle.columns; j++) {
            var cell = puzzle.cells[i][j];
            if (cell.isNumberedCell) {
                if (cell.isAcrossWordStart) {
                    var clue = AddClue(true, cell.clueNumber, "", cell);
                    //traverse all cells for this clue to make reference to this clue
                    var x = j;
                    var y = i;
                    while (x < puzzle.columns && !puzzle.cells[y][x].isBlack) {
                        puzzle.cells[y][x].acrossClue = clue;
                        x++;
                    }
                }
                if (cell.isDownWordStart) {
                    var clue = AddClue(false, cell.clueNumber, "", cell);
                    //traverse all cells for this clue to make reference to this clue
                    var x = j;
                    var y = i;
                    while (y < puzzle.rows && !puzzle.cells[y][x].isBlack) {
                        puzzle.cells[y][x].downClue = clue;
                        y++;
                    }
                }
            }
        }
    }
}

function AddClue(isAcross, number, text, startCell) {
    var clue = {};
    clue.startCell = startCell;
    clue.text = text;
    clue.number = number;
    clue.isAcross = isAcross;
    
    var clueContainer = document.createElement("li");
    clueContainer.className = "ClueLI";
    var clueNumber = document.createElement("span");
    clueNumber.className = "ClueLabel";
    clueNumber.innerHTML = number;
    clueContainer.appendChild(clueNumber);
    var clueText = document.createElement("textarea");
    clueText.className = "ClueText";
    clueText.type = "text";
    clueText.value = text;
    clueText.clue = clue;
    clueText.addEventListener("input", OnClueListItemTextChanged)
    MakeClueFocusDetectable(clueText);
    MakeTextAreaAutoSizeHeight(clueText, 300);
    clueContainer.appendChild(clueText);
    clue.clueView = clueContainer;
    
    if (isAcross) {
        puzzle.cluesAcross.push(clue);
        document.getElementById('CluesListAcross').appendChild(clueContainer);        
    } else {
        puzzle.cluesDown.push(clue);
        document.getElementById('CluesListDown').appendChild(clueContainer);        
    }

    return clue;
}

var currentSelectedCell = null;
var currentHighlightedCells = [];

function SelectCell(cell) {
    if (currentSelectedCell != undefined) {
        currentSelectedCell.cellView.children[0].setAttribute('fill', 'none');
        currentSelectedCell.acrossClue.clueView.style.background = 'none';
        currentSelectedCell.acrossClue.clueView.style.borderLeftColor = 'transparent';
        currentSelectedCell.downClue.clueView.style.background = 'none';
        currentSelectedCell.downClue.clueView.style.borderLeftColor = 'transparent';
        document.getElementById('ClueBarText').value = "";
        for (var i=0; i<currentHighlightedCells.length; i++) {
            currentHighlightedCells[i].cellView.children[0].setAttribute("fill", "transparent");
        }
    }

    currentSelectedCell = cell;
    currentHighlightedCells = [];
    if (currentSelectedCell === null) {
        return;
    }

    currentSelectedCell.cellView.children[0].setAttribute('fill', '#ffda00');
    if (isSelectingAcrossClues) {
        currentSelectedCell.acrossClue.clueView.style.background = '#a7d8ff';
        currentSelectedCell.downClue.clueView.style.borderLeftColor = '#a7d8ff';
        document.getElementById('ClueBarNumber').innerHTML = currentSelectedCell.acrossClue.number + "A";
        document.getElementById('ClueBarText').value = currentSelectedCell.acrossClue.text;
    
        ScrollToViewClue(currentSelectedCell.acrossClue);
        ScrollToViewClue(currentSelectedCell.downClue);
        
        var curRow = currentSelectedCell.acrossClue.startCell.row;
        var curColumn = currentSelectedCell.acrossClue.startCell.column;
        while (curColumn < puzzle.columns && !puzzle.cells[curRow][curColumn].isBlack) {
            curCell = puzzle.cells[curRow][curColumn];
            if (curCell === currentSelectedCell) {
                curColumn++;
                continue;
            }
            curCell.cellView.children[0].setAttribute("fill", "#a7d8ff");
            currentHighlightedCells.push(curCell);
            curColumn++;
        }
    } else {
        currentSelectedCell.acrossClue.clueView.style.borderLeftColor = '#a7d8ff';
        currentSelectedCell.downClue.clueView.style.background = '#a7d8ff';
        document.getElementById('ClueBarNumber').innerHTML = currentSelectedCell.downClue.number + "D";
        document.getElementById('ClueBarText').value = currentSelectedCell.downClue.text;

        ScrollToViewClue(currentSelectedCell.downClue);
        ScrollToViewClue(currentSelectedCell.acrossClue);

        var curRow = currentSelectedCell.downClue.startCell.row;
        var curColumn = currentSelectedCell.downClue.startCell.column;
        while (curRow < puzzle.rows && !puzzle.cells[curRow][curColumn].isBlack) {
            curCell = puzzle.cells[curRow][curColumn];
            if (curCell === currentSelectedCell) {
                curRow++;
                continue;
            }
            curCell.cellView.children[0].setAttribute("fill", "#a7d8ff");
            currentHighlightedCells.push(curCell);
            curRow++;
        }
    }
}

function SelectNextCell() {
    if (currentSelectedCell === null) {
        return;
    }
    
    var curColumn = currentSelectedCell.column;
    var curRow = currentSelectedCell.row;
    
    if (isSelectingAcrossClues) {
        if (curColumn >= puzzle.columns-1) {
            return;
        }
        else if (!puzzle.cells[curRow][curColumn+1].isBlack) {
            curColumn++;
        }
        SelectCell(puzzle.cells[curRow][curColumn]);
    } else {
        if (curRow >= puzzle.rows-1) {
            return;
        }
        else if (!puzzle.cells[curRow+1][curColumn].isBlack) {
            curRow++;
        }
        SelectCell(puzzle.cells[curRow][curColumn]);
    }
}

function SelectPreviousCell(clearCell) {
    if (currentSelectedCell === null) {
        return;
    }
    
    var curColumn = currentSelectedCell.column;
    var curRow = currentSelectedCell.row;
    
    if (isSelectingAcrossClues) {
        if (curColumn <= 0) {
            return;
        }
        else if (!puzzle.cells[curRow][curColumn-1].isBlack) {
            curColumn--;
        }
    }
    else {
        if (curRow <= 0) {
            return;
        }
        else if (!puzzle.cells[curRow-1][curColumn].isBlack) {
            curRow--;
        }
    }

    if (clearCell) {
        puzzle.cells[curRow][curColumn].cellView.children[2].innerHTML = "";
        // TODO: save puzzle state
    }
    SelectCell(puzzle.cells[curRow][curColumn]);
}

function SelectNextClue() {
    if (currentSelectedCell === null) {
        return;
    }

    if (isSelectingAcrossClues) {
        for (var i=0; i<puzzle.cluesAcross.length; i++) {
            if (puzzle.cluesAcross[i] === currentSelectedCell.acrossClue) {
                if (i === puzzle.cluesAcross.length-1) {
                    isSelectingAcrossClues = false;
                    SelectCell(puzzle.cluesDown[0].startCell);
                } else {
                    SelectCell(puzzle.cluesAcross[i+1].startCell);
                }
                return;
            }
        }
    } else {
        for (var i=0; i<puzzle.cluesDown.length; i++) {
            if (puzzle.cluesDown[i] === currentSelectedCell.downClue) {
                if (i === puzzle.cluesDown.length-1) {
                    isSelectingAcrossClues = true;
                    SelectCell(puzzle.cluesAcross[0].startCell);
                } else {
                    SelectCell(puzzle.cluesDown[i+1].startCell);
                }
                return;
            }
        }
    }
}

function SelectPreviousClue() {
    if (currentSelectedCell === null) {
        return;
    }

    if (isSelectingAcrossClues) {
        for (var i=0; i<puzzle.cluesAcross.length; i++) {
            if (puzzle.cluesAcross[i] === currentSelectedCell.acrossClue) {
                if (i == 0) {
                    isSelectingAcrossClues = false;
                    SelectCell(puzzle.cluesDown[puzzle.cluesDown.length-1].startCell);
                } else {
                    SelectCell(puzzle.cluesAcross[i-1].startCell);
                }
                return;
            }
        }
    } else {
        for (var i=0; i<puzzle.cluesDown.length; i++) {
            if (puzzle.cluesDown[i] === currentSelectedCell.downClue) {
                if (i == 0) {
                    isSelectingAcrossClues = true;
                    SelectCell(puzzle.cluesAcross[puzzle.cluesAcross.length-1].startCell);
                } else {
                    SelectCell(puzzle.cluesDown[i-1].startCell);
                }
                return;
            }
        }
    }
}

function ScrollToViewClue(clue) {
    var container = clue.isAcross ? document.getElementById('CluesListAcross') : document.getElementById('CluesListDown');
    var offset = clue.clueView.offsetTop - container.offsetTop;
    var distanceFromCurScrollTop = offset - container.scrollTop;
    if (distanceFromCurScrollTop < 0 ) {
        AnimateScroll(container, offset, 200);
    } else if (distanceFromCurScrollTop > container.clientHeight - clue.clueView.clientHeight) {
        var bottomOffset = offset - container.clientHeight + clue.clueView.clientHeight;
        AnimateScroll(container, bottomOffset, 200);
    }
}

function AnimateScroll(element, to, duration) {
    if (duration <= 0) return;
    var difference = to - element.scrollTop;
    var perTick = difference / duration * 10;

    setTimeout(function() {
        element.scrollTop = element.scrollTop + perTick;
        if (element.scrollTop === to) return;
        AnimateScroll(element, to, duration - 10);
    }, 10);
}

function checkKey(e) {

    e = e || window.event;
    
    if (currentSelectedCell === null) {
        return;
    }

    if (!textEntryIsFocused) {
        // Handle Arrow Keys
        var curRow = currentSelectedCell.row;
        var curColumn = currentSelectedCell.column;
        if (e.keyCode == '38') {
            // up arrow
            if (isSelectingAcrossClues) {
                isSelectingAcrossClues = false;
            }
            else if (curRow <= 0) {
                return;
            }
            else if (!puzzle.cells[curRow-1][curColumn].isBlack) {
                curRow--;
            } else {
                var skip = curRow;
                while (true) {
                    skip--;
                    if (skip === puzzle.rows) {
                        break;
                    } else if (!puzzle.cells[skip][curColumn].isBlack) {
                        curRow = skip;
                        break;
                    }
                }
            }
            SelectCell(puzzle.cells[curRow][curColumn]);
        }
        else if (e.keyCode == '40') {
            // down arrow
            if (isSelectingAcrossClues) {
                isSelectingAcrossClues = false;
            }
            else if (curRow >= puzzle.rows-1) {
                return;
            }
            else if (!puzzle.cells[curRow+1][curColumn].isBlack) {
                curRow++;
            } else {
                var skip = curRow;
                while (true) {
                    skip++;
                    if (skip === puzzle.rows) {
                        break;
                    } else if (!puzzle.cells[skip][curColumn].isBlack) {
                        curRow = skip;
                        break;
                    }
                }
            }
            SelectCell(puzzle.cells[curRow][curColumn]);
        }
        else if (e.keyCode == '37') {
            // left arrow
            if (!isSelectingAcrossClues) {
                isSelectingAcrossClues = true;
            }
            else if (curColumn <= 0) {
                return;
            }
            else if (!puzzle.cells[curRow][curColumn-1].isBlack) {
                curColumn--;
            } else {
                var skip = curColumn;
                while (true) {
                    skip--;
                    if (skip < 0) {
                        break;
                    } else if (!puzzle.cells[curRow][skip].isBlack) {
                        curColumn = skip;
                        break;
                    }
                }
            }
            SelectCell(puzzle.cells[curRow][curColumn]);
        }
        else if (e.keyCode == '39') {
            // right arrow
            if (!isSelectingAcrossClues) {
                isSelectingAcrossClues = true;
            }
            else if (curColumn >= puzzle.columns-1) {
                return;
            }
            else if (!puzzle.cells[curRow][curColumn+1].isBlack) {
                curColumn++;
            } else {
                var skip = curColumn;
                while (true) {
                    skip++;
                    if (skip === puzzle.columns) {
                        break;
                    } else if (!puzzle.cells[curRow][skip].isBlack) {
                        curColumn = skip;
                        break;
                    }
                }
            }
            SelectCell(puzzle.cells[curRow][curColumn]);
        }
        else if (e.keyCode == '8' || e.keyCode == '46') {
            // Backspace and Delete
            if(currentSelectedCell.cellView.children[2].innerHTML === "") {
                SelectPreviousCell(true);
            } else {
                currentSelectedCell.cellView.children[2].innerHTML = "";
            }
        } 
        else if (e.keyCode == '9') {
            e.preventDefault();
            if (e.shiftKey) {
                SelectPreviousClue();
            } else {
                SelectNextClue();        
            }
        }
        else if (e.keyCode >= 65 && e.keyCode <= 90) {
            var letter = e.key.toUpperCase();
            currentSelectedCell.cellView.children[2].innerHTML = letter;
            // TODO: save the current state of the puzzle
            SelectNextCell();
        }
    }
}