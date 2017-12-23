var puzzle = {};

var isSelectingAcrossClues = true;
var isSymetrical = true;

var boardBorder;

var currentSelectedPuzzleSize = 'Weekday';
var currentBoardWidth = 495.0;
var currentBoardHeight = 495.0;

function Initialize() {

    document.getElementById('Title').addEventListener("input", OnTitleChanged);
    document.getElementById('Title').value = "";
    
    document.getElementById('ClueBarText').addEventListener("input", OnClueBarTextChanged);
    document.getElementById('ClueBarText').value = "";

    document.getElementById('Board').oncontextmenu = function(e) { return false; };

    // Detect when user is typing
    MakeFocusDetectable(document.getElementById('ClueBarText'));
    MakeFocusDetectable(document.getElementById('Title'));
    MakeFocusDetectable(document.getElementById('CustomSizeRows'));
    MakeFocusDetectable(document.getElementById('CustomSizeColumns'));
    MakeFocusDetectable(document.getElementById('SettingsRegionTitle'));
    MakeFocusDetectable(document.getElementById('SettingsRegionAuthor'));
    MakeFocusDetectable(document.getElementById('SettingsRegionCopyright'));
    
    document.getElementById('SettingsRegionTitle').addEventListener("input", OnSettingsTitleChanged);
    document.getElementById('SettingsRegionAuthor').addEventListener("input", OnSettingsAuthorChanged);
    document.getElementById('SettingsRegionCopyright').addEventListener("input", OnSettingsCopyrightChanged);
    document.getElementById('CustomSizeRows').addEventListener("input", OnCustomSizesChanged);
    document.getElementById('CustomSizeColumns').addEventListener("input", OnCustomSizesChanged);
    
    MakeTextAreaAutoSizeHeight(document.getElementById('ClueBarText'), 200);

    // Load saved puzzle if it exists
    var savedPuzzleString = window.localStorage.getItem('SavePuzzle');
    if (savedPuzzleString) {
        var savedPuzzle = JSON.parse(savedPuzzleString);
        InitializeBoardForPuzzle(savedPuzzle);
    } else {
        InitializeBoardForPuzzle(null, 15, 15);        
    }
    
    document.onkeydown = checkKey;

    var xhttp = new XMLHttpRequest();
    xhttp.responseType = "text";
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        CreateWordsLookupTable(this.responseText);
      }
    };
    xhttp.open("GET", "data/words_all.txt", true);
    xhttp.send();
}

var wordsByLength = [];
function CreateWordsLookupTable(allwordsText) {
    var allWords = allwordsText.split(",");
    for (var i=0; i<allWords.length; i++) {
        var word = allWords[i];
        if (wordsByLength[word.length] === undefined) {
            wordsByLength[word.length] = [];
        }
        wordsByLength[word.length].push(word);
    }
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
    var otherTitle = document.getElementById('SettingsRegionTitle');
    otherTitle.value = curTitle;
    SavePuzzle();
}

function OnSettingsTitleChanged() {
    var el = document.getElementById('SettingsRegionTitle');
    var curTitle = el.value;
    puzzle.title = curTitle;
    var otherTitle = document.getElementById('Title');
    otherTitle.value = curTitle;
    SavePuzzle();
}

function OnSettingsAuthorChanged() {
    var el = document.getElementById('SettingsRegionAuthor');
    puzzle.author = el.value;
    SavePuzzle();
}

function OnSettingsCopyrightChanged() {
    var el = document.getElementById('SettingsRegionCopyright');
    puzzle.copyright = el.value;
    SavePuzzle();
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
    SavePuzzle();
}

function OnClueListItemTextChanged(ev) {
    ev.target.clue.text = ev.target.value;
    SavePuzzle();
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

function InitializeBoardForPuzzle(savedPuzzle, rows, columns) {
    puzzle = {};
    puzzle.title = savedPuzzle ? savedPuzzle.title : "";
    puzzle.author = savedPuzzle ? savedPuzzle.author : "";
    puzzle.copyright = savedPuzzle ? savedPuzzle.copyright : "";
    puzzle.cells = [];
    puzzle.cluesAcross = savedPuzzle ? savedPuzzle.cluesAcross : [];
    puzzle.cluesDown = savedPuzzle ? savedPuzzle.cluesDown : [];
    puzzle.rows = savedPuzzle ? savedPuzzle.rows : rows;
    puzzle.columns = savedPuzzle ? savedPuzzle.columns : columns;

    document.getElementById('Title').value = puzzle.title;
    document.getElementById('SettingsRegionTitle').value = puzzle.title;
    document.getElementById('SettingsRegionAuthor').value = puzzle.author;
    document.getElementById('SettingsRegionCopyright').value = puzzle.copyright;

    var gridTypeWeekday = document.getElementById('SettingsSizeWeekday');
    var gridTypeSunday = document.getElementById('SettingsSizeSunday');
    var gridTypeCustom = document.getElementById('SettingsSizeCustom');
    var gridCustomRows = document.getElementById('CustomSizeRows');
    var gridCustomColumns = document.getElementById('CustomSizeColumns');
    if (puzzle.rows == 15 && puzzle.columns == 15) {
        gridTypeWeekday.checked = true;
        currentSelectedPuzzleSize = 'Weekday';
        gridCustomRows.value = "";
        gridCustomColumns.value = "";
        gridCustomColumns.disabled = true;
        gridCustomRows.disabled = true;
    } else if (puzzle.rows == 21 && puzzle.columns == 21) {
        gridTypeSunday.checked = true;
        currentSelectedPuzzleSize = 'Sunday';
        gridCustomRows.value = "";
        gridCustomColumns.value = "";
        gridCustomColumns.disabled = true;
        gridCustomRows.disabled = true;
    } else {
        gridTypeCustom.checked = true;
        currentSelectedPuzzleSize = 'Custom';
        gridCustomRows.value = puzzle.rows;
        gridCustomColumns.value = puzzle.columns;
        gridCustomColumns.disabled = false;
        gridCustomRows.disabled = false;
    }

    var cellsContainer = document.getElementById('BoardCells')
    cellsContainer.innerHTML = "";
    var boardGrid = document.getElementById('BoardGrid');
    boardGrid.innerHTML = "";
    var acrossCluesContainer = document.getElementById('CluesListAcross');
    acrossCluesContainer.innerHTML = "";
    var downCluesContainer = document.getElementById('CluesListDown');
    downCluesContainer.innerHTML = "";
    
    var standardWidth = 495.0;
    var standardHeight = 495.0;

    if (puzzle.rows != puzzle.columns) {
        if (puzzle.rows > puzzle.columns) {
            standardWidth = standardWidth*puzzle.columns/puzzle.rows;
        } else {
            standardHeight = standardWidth*puzzle.rows/puzzle.columns;
        }
    }

    currentBoardHeight = standardHeight;
    currentBoardWidth = standardWidth;

    var cellWidth = standardHeight/puzzle.rows;
    var cellHeight = standardWidth/puzzle.columns;
    var cellNumberFontSize = puzzle.rows > 19 ? 7.67 : 10;
    var cellTextFontSize = puzzle.rows > 19 ? 15.33 : 22;
    var cellNumberOffsetX = 2;
    var cellNumberOffsetY = puzzle.rows > 19 ? 8.17 : 11.5;
    var cellTextOffsetX = puzzle.rows > 19 ?  11.5 : 16;
    var cellTextOffsetY = puzzle.rows > 19 ? 21.08 : 30.25;
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
            cell.text =  savedPuzzle ? savedPuzzle.cells[i][j].text : '';
            cell.isBlack = savedPuzzle ? savedPuzzle.cells[i][j].isBlack : false;    
            cell.isNumberedCell = savedPuzzle ? savedPuzzle.cells[i][j].isNumberedCell : false;
            cell.isAcrossWordStart = savedPuzzle ? savedPuzzle.cells[i][j].isAcrossWordStart : false;
            cell.isDownWordStart = savedPuzzle ? savedPuzzle.cells[i][j].isDownWordStart : false;
    
            if (!savedPuzzle) {
                if (i===0 || (i > 0 && puzzle.cells[i-1][j].isBlack)) {
                    cell.isNumberedCell = true;
                    cell.isDownWordStart = true;
                }
                if (j===0 || (j > 0 && curRow[j-1].isBlack)) {
                    cell.isNumberedCell = true;
                    cell.isAcrossWordStart = true;
                }
            }

            var cellView = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            var cellRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');          
            cellRect.setAttribute('x', curLeft);
            cellRect.setAttribute('y', curTop);
            cellRect.setAttribute('width', cellWidth);
            cellRect.setAttribute('height', cellHeight);
            if (cell.isBlack) {
                cellRect.setAttribute('fill', 'black');
            } else {
                cellRect.setAttribute('fill', 'none');
            }
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
            cellText.innerHTML = cell.text;
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
        pathText = pathText + "M" + curLeft + "," + curTop + " l" + standardWidth + ",0.00";
        curTop = curTop + cellHeight;
    }
    curLeft = 3.0 + cellWidth;
    curTop = 3.0;
    for (var i=0; i<puzzle.columns-1; i++) {
        pathText = pathText + "M" + curLeft + "," + curTop + " l0.0," + standardHeight;
        curLeft = curLeft + cellWidth;
    }
    boardGridLines.setAttribute('d', pathText);
    boardGrid.appendChild(boardGridLines);

    boardBorder = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    boardBorder.setAttribute('x', 1.5);
    boardBorder.setAttribute('y', 1.5);
    boardBorder.setAttribute('width', standardWidth + 3.0);
    boardBorder.setAttribute('height', standardHeight + 3.0);
    boardBorder.setAttribute('fill', 'none');
    boardBorder.setAttribute('stroke-width', 3.0);
    boardBorder.setAttribute('stroke', 'black');
    boardGrid.appendChild(boardBorder);

    GenerateCluesAndCellNumbers(savedPuzzle);
    if (puzzle.cluesAcross.length > 0) {
        SelectCell(puzzle.cluesAcross[0].startCell);
    }
}

function OnBoardClick(evt) {
    evt = evt || window.event;

    var board = document.getElementById('Board');
    var pt = board.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    var clickLoc = pt.matrixTransform(board.getScreenCTM().inverse());
    var column = Math.floor((puzzle.columns)*(clickLoc.x-5)/currentBoardWidth);
    column = Math.min(Math.max(column, 0), puzzle.columns-1);
    var row = Math.floor((puzzle.rows)*(clickLoc.y-5)/currentBoardHeight);
    row = Math.min(Math.max(row, 0), puzzle.rows-1);
    var cell = puzzle.cells[row][column];

    var isRightButton = false;
    if ("which" in evt) {
        isRightButton = evt.which === 3;
    } else if ("button" in evt) {
        // IE and Opera
        isRightButton = evt.button === 2;
    }

    if (isRightButton) {
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
        GenerateCluesAndCellNumbers(null);
        SavePuzzle();

        // Indicate if the layout is valid
        var fastGrid = GetFastGrid(puzzle);
        var [isValid, wordCount, avgLength] = GetFastGridStats(fastGrid);
        if (isValid) {
            boardBorder.setAttribute('stroke' , 'black');
        } else {
            boardBorder.setAttribute('stroke' , 'red');

        }

        SelectCell(currentSelectedCell);
        ShowCluesWithNoKnownSolution();

    } else {
        if (!cell.isBlack) {
            SelectCell(cell);
        }
    }
}

function GenerateCluesAndCellNumbers(savedPuzzle) {
    
    // Keep old clues if they exist and still have the same answer starting from the start cell
    var prevPuzzle = savedPuzzle ? savedPuzzle : puzzle;
    var prevCluesAcross = [];
    for (var i=0; i<prevPuzzle.cluesAcross.length; i++) {
        if (prevPuzzle.cluesAcross[i].text.length > 0) {
            prevCluesAcross.push(prevPuzzle.cluesAcross[i]);
        }
    }
    var prevCluesDown = [];
    for (var i=0; i<prevPuzzle.cluesDown.length; i++) {
        if (prevPuzzle.cluesDown[i].text.length > 0) {
            prevCluesDown.push(prevPuzzle.cluesDown[i]);
        }
    }
    
    var acrossCluesContainer = document.getElementById('CluesListAcross');
    acrossCluesContainer.innerHTML = "";
    var downCluesContainer = document.getElementById('CluesListDown');
    downCluesContainer.innerHTML = "";
    puzzle.cluesAcross = [];
    puzzle.cluesDown = [];

    // Set all the cell clue numbers
    var curIndex = 1;
    for (var i=0; i<puzzle.rows; i++) {
        for (var j=0; j<puzzle.columns; j++) {
            var cell = puzzle.cells[i][j];
            if (cell.isBlack) {
                cell.cellView.children[1].innerHTML = "";
                cell.cellView.children[2].innerHTML = "";
                cell.text = "";
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

    // Generate all the clues
    for (var i=0; i<puzzle.rows; i++) {
        for (var j=0; j<puzzle.columns; j++) {
            var cell = puzzle.cells[i][j];
            if (cell.isNumberedCell) {
                if (cell.isAcrossWordStart) {
                    
                    // Find the length of the answer
                    var x = j;
                    var y = i;
                    var answerLength = 0;
                    while (x < puzzle.columns && !puzzle.cells[y][x].isBlack) {
                        answerLength++;
                        x++;
                    }

                    // Find a previous clue that matches
                    var clueText = '';
                    for (var k=0; k<prevCluesAcross.length; k++) {
                        if (prevCluesAcross[k].startRow === i && prevCluesAcross[k].startColumn === j && prevCluesAcross[k].answerLength === answerLength) {
                            clueText = prevCluesAcross[k].text;
                            break;
                        }
                    }

                    // Create the new clue and add it to the view
                    var clue = AddClue(true, cell.clueNumber, clueText, cell, answerLength);
                    x = j;
                    y = i;
                    while (x < puzzle.columns && !puzzle.cells[y][x].isBlack) {
                        puzzle.cells[y][x].acrossClue = clue;
                        x++;
                    }
                }
                if (cell.isDownWordStart) {
                    // Find the length of the answer
                    var x = j;
                    var y = i;
                    var answerLength = 0;
                    while (y < puzzle.rows && !puzzle.cells[y][x].isBlack) {
                        answerLength++;
                        y++;
                    }

                    // Find a previous clue that matches
                    var clueText = '';
                    for (var k=0; k<prevCluesDown.length; k++) {
                        if (prevCluesDown[k].startRow === i && prevCluesDown[k].startColumn === j && prevCluesDown[k].answerLength === answerLength) {
                            clueText = prevCluesDown[k].text;
                            break;
                        }
                    }

                    var clue = AddClue(false, cell.clueNumber, clueText, cell, answerLength);
                    x = j;
                    y = i;
                    while (y < puzzle.rows && !puzzle.cells[y][x].isBlack) {
                        puzzle.cells[y][x].downClue = clue;
                        y++;
                    }
                }
            }
        }
    }
}

function AddClue(isAcross, number, text, startCell, answerLength) {
    var clue = {};
    clue.startCell = startCell;
    clue.startRow = startCell.row;
    clue.startColumn = startCell.column;
    clue.answerLength = answerLength;
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
            if (!currentHighlightedCells[i].isBlack) {
                currentHighlightedCells[i].cellView.children[0].setAttribute("fill", "transparent");
            }
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

    ShowCurrentAnswerLetters();
    SuggestLettersForCurrentSelectedClue();
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
        puzzle.cells[curRow][curColumn].text = "";
        SavePuzzle();
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
            e.preventDefault();
            if(currentSelectedCell.cellView.children[2].innerHTML === "") {
                SelectPreviousCell(true);
            } else {
                currentSelectedCell.cellView.children[2].innerHTML = "";
                currentSelectedCell.text = "";
                SavePuzzle();
            }
            ShowCluesWithNoKnownSolution();
        } 
        else if (e.keyCode == '9') {
            // Tab
            e.preventDefault();
            if (e.shiftKey) {
                SelectPreviousClue();
            } else {
                SelectNextClue();        
            }
        }
        else if (e.keyCode >= 65 && e.keyCode <= 90) {
            if (e.metaKey) {
                // Apple command key was used so we ignore
            } else {
                var letter = e.key.toUpperCase();
                currentSelectedCell.cellView.children[2].innerHTML = letter;
                currentSelectedCell.text = letter;
                SavePuzzle();
                SelectNextCell();
                ShowCluesWithNoKnownSolution();
            }
        }
    }
}

function SavePuzzle() {
    var savePuzzle = {};
    savePuzzle.title = puzzle.title;
    savePuzzle.author = puzzle.author;
    savePuzzle.copyright = puzzle.copyright;
    savePuzzle.rows = puzzle.rows;
    savePuzzle.columns = puzzle.columns;
    savePuzzle.cells = [];
    for (var i=0; i<puzzle.rows; i++) {
        var cellRow = [];
        for (var j=0; j<puzzle.columns; j++) {
            var cell = {};
            var copyCell = puzzle.cells[i][j];
            cell.text =  copyCell.text;
            cell.isBlack = copyCell.isBlack;    
            cell.isNumberedCell = copyCell.isNumberedCell;
            cell.isAcrossWordStart = copyCell.isAcrossWordStart;
            cell.isDownWordStart = copyCell.isDownWordStart;
            cellRow.push(cell);
        }
        savePuzzle.cells.push(cellRow);
    }
    
    savePuzzle.cluesAcross = [];
    for (var i=0; i<puzzle.cluesAcross.length; i++) {
        var clue = {};
        clue.text = puzzle.cluesAcross[i].text;
        clue.number = puzzle.cluesAcross[i].number;
        clue.startRow = puzzle.cluesAcross[i].startCell.row;
        clue.startColumn = puzzle.cluesAcross[i].startCell.column;
        clue.answerLength = puzzle.cluesAcross[i].answerLength;
        savePuzzle.cluesAcross.push(clue);
    }
    savePuzzle.cluesDown = [];
    for (var i=0; i<puzzle.cluesDown.length; i++) {
        var clue = {};
        clue.text = puzzle.cluesDown[i].text;
        clue.number = puzzle.cluesDown[i].number;
        clue.startRow = puzzle.cluesDown[i].startCell.row;
        clue.startColumn = puzzle.cluesDown[i].startCell.column;
        clue.answerLength = puzzle.cluesDown[i].answerLength;
        savePuzzle.cluesDown.push(clue);
    }

    window.localStorage.setItem('SavePuzzle', JSON.stringify(savePuzzle));
}

function OnAutoGridButtonClick() {

    var fastGrid = GetFastGrid(puzzle);
    GetFastGridStats(fastGrid); 
}

function GetFastGrid(aPuzzle) {
    // FastGrid is used for searching for automatic black square layouts
    // '.' means black (editable)
    // '#' means black (not editable)
    // 'A' means not black (editable)
    // '@' means not black (not editable)
    var fastGrid = [];
    for (var i=0; i<aPuzzle.rows; i++) {
        var curRowData = [];
        for (var j=0; j<aPuzzle.columns; j++) {
            if (aPuzzle.cells[i][j].isBlack) {
                curRowData.push("#");
            } else if (aPuzzle.cells[i][j].text.length != 0) {
                curRowData.push("@");
            } else {
                curRowData.push("A");
            }
        }
        fastGrid.push(curRowData);
    }
    return fastGrid;
}

function GetFastGridStats(fastGrid) {
    // All words must be at least 3 letters long
    var isValid = true;
    var wordLengths = [];
    var avgWordLength = 0;
    var wordCount = 0;
    for (var i=0; i<fastGrid.length; i++) {
        var curRow = fastGrid[i];
        var j=0;
        while (j<curRow.length) {
            // Go to the start of the next solution
            while (j < curRow.length && (curRow[j] === '.' || curRow[j] === '#')) {
                j++;
            }
            // Count the letters
            var curWordLength = 0;
            while (j < curRow.length && (curRow[j] === 'A' || curRow[j] === '@')) {
                curWordLength++;
                j++;
                if (j === curRow.length) {
                    break;
                }
            }
            if (curWordLength === 0) {
                continue;
            }
            if (curWordLength < 3) {
                isValid = false;
            }
            avgWordLength += curWordLength;
            wordCount++;
            if (wordLengths[curWordLength] === undefined) {
                wordLengths[curWordLength] = 1;
            } else {
                wordLengths[curWordLength]++;
            }
        }
    }
    for (var i=0; i<fastGrid[0].length; i++) {
        var j=0;
        while (j<fastGrid.length) {
            // Go to the start of the next solution
            while (j < fastGrid.length && (fastGrid[j][i] === '.' || fastGrid[j][i] === '#')) {
                j++;
            }
            // Count the letters
            var curWordLength = 0;
            while (j < fastGrid.length && (fastGrid[j][i] === 'A' || fastGrid[j][i] === '@')) {
                curWordLength++;
                j++;
                if (j === fastGrid.length) {
                    break;
                }
            }
            if (curWordLength === 0) {
                continue;
            }
            if (curWordLength < 3) {
                isValid = false;
            }
            avgWordLength += curWordLength;
            wordCount++;
            if (wordLengths[curWordLength] === undefined) {
                wordLengths[curWordLength] = 1;
            } else {
                wordLengths[curWordLength]++;
            }
        }
    }

    avgWordLength = avgWordLength / wordCount;
    return [isValid, wordCount, avgWordLength];
}

function ShowCurrentAnswerLetters() {
    var answerContainer = document.getElementById('SelectedWordPatternGridRegion');
    answerContainer.innerHTML = "";

    if (currentSelectedCell === null) {
        return;
    }
    
    var clue = isSelectingAcrossClues ? currentSelectedCell.acrossClue : currentSelectedCell.downClue;
    var shrinkSizeNeeded = false;
    var shrinkSize = 30;
    if (clue.answerLength > 14) {
        shrinkSizeNeeded = true;
        shrinkSize = 400.0 / clue.answerLength;
    }
    
    if (clue.isAcross) {
        var curColumn = clue.startCell.column;
        var curRow = clue.startCell.row;
        var startIndex = clue.startCell.column;
        var endIndex = startIndex + clue.answerLength;
        for (var i=startIndex; i<endIndex; i++) {
            var gridCell = document.createElement("div");
            gridCell.className = "SelectedWordPatternGridCell";
            gridCell.innerHTML = puzzle.cells[curRow][curColumn].text;
            if(shrinkSizeNeeded) {
                gridCell.style.width = shrinkSize + "px";
                gridCell.style.height = shrinkSize + "px";
                gridCell.style.lineHeight = shrinkSize + "px";
                gridCell.style.fontSize = 14 * shrinkSize/30 + "pt";
            }
            answerContainer.appendChild(gridCell);
            curColumn++;
        }
    } else {
        var curColumn = clue.startCell.column;
        var curRow = clue.startCell.row;
        var startIndex = clue.startCell.row;
        var endIndex = startIndex + clue.answerLength;
        for (var i=startIndex; i<endIndex; i++) {
            var gridCell = document.createElement("div");
            gridCell.className = "SelectedWordPatternGridCell";
            gridCell.innerHTML = puzzle.cells[curRow][curColumn].text;
            if(shrinkSizeNeeded) {
                gridCell.style.width = shrinkSize + "px";
                gridCell.style.height = shrinkSize + "px";
                gridCell.style.lineHeight = shrinkSize + "px";
                gridCell.style.fontSize = 14 * shrinkSize/30 + "pt";
            }
            answerContainer.appendChild(gridCell);
            curRow++;
        }
    }
}

function SuggestLettersForCurrentSelectedClue() {
    if (currentSelectedCell === null ) {
        return;
    }

    var answerList = document.getElementById('SuggestedAnswerList');
    answerList.innerHTML = "";

    var clue = isSelectingAcrossClues ? currentSelectedCell.acrossClue : currentSelectedCell.downClue;
    var [matches, atLeastOneLetterAlready, alreadyAnswered] = GetPossibleSolutionsForClue(clue);
    if (atLeastOneLetterAlready) {
        for (var i=0; i<matches.length; i++) {
            var li = document.createElement('li');
            li.innerHTML = matches[i];
            answerList.appendChild(li);
        }
        document.getElementById('SuggestWordsTitle').innerHTML = "(" + matches.length + ") Answer suggestions:";
    } else {
        document.getElementById('SuggestWordsTitle').innerHTML = "Answer suggestions:";
    }
}

function GetPossibleSolutionsForClue(clue, limitMatches) {
    var answerPattern = "";
    var atLeastOneLetterAlready = false;
    var alreadyAnswered = true;
    if (clue.isAcross) {
        var curColumn = clue.startCell.column;
        var curRow = clue.startCell.row;
        var startIndex = clue.startCell.column;
        var endIndex = startIndex + clue.answerLength
        for (var i=startIndex; i<endIndex; i++) {
            if (puzzle.cells[curRow][curColumn].text.length === 0) {
                answerPattern += ".";
                alreadyAnswered = false;
            } else if (puzzle.cells[curRow][curColumn].text.length === 1) {
                answerPattern += puzzle.cells[curRow][curColumn].text;
                atLeastOneLetterAlready = true;
            }
            curColumn++;
        }
    } else {
        var curColumn = clue.startCell.column;
        var curRow = clue.startCell.row;
        var startIndex = clue.startCell.row;
        var endIndex = startIndex + clue.answerLength
        for (var i=startIndex; i<endIndex; i++) {
            if (puzzle.cells[curRow][curColumn].text.length === 0) {
                answerPattern += ".";
                alreadyAnswered = false;
            } else if (puzzle.cells[curRow][curColumn].text.length === 1) {
                answerPattern += puzzle.cells[curRow][curColumn].text;
                atLeastOneLetterAlready = true;
            }
            curRow++;
        }
    }

    var matches = [];
    var wordsOfLength = wordsByLength[answerPattern.length];
    if (wordsOfLength !== undefined) {
        for (var i=0; i<wordsOfLength.length; i++) {
            var checkWord = wordsOfLength[i];
            if (checkWord.search(answerPattern) === 0) {
                matches.push(checkWord);
                if (limitMatches && matches.length >= limitMatches) {
                    break;
                }
            }
        }    
    }
    return [matches, atLeastOneLetterAlready, alreadyAnswered];
}

function ShowCluesWithNoKnownSolution() {
    var cluesAndMatches = [];
    for (var i=0; i<puzzle.cluesAcross.length; i++) {
        var [matches, atLeastOneLetterAlready, alreadyAnswered] = GetPossibleSolutionsForClue(puzzle.cluesAcross[i], 1);
        var clueAndMatches = {};
        clueAndMatches.clue = puzzle.cluesAcross[i];
        clueAndMatches.matches = matches;
        clueAndMatches.atLeastOneLetterAlready = atLeastOneLetterAlready;
        clueAndMatches.alreadyAnswered = alreadyAnswered;
        cluesAndMatches.push(clueAndMatches);
    }
    for (var i=0; i<puzzle.cluesDown.length; i++) {
        var [matches, atLeastOneLetterAlready, alreadyAnswered] = GetPossibleSolutionsForClue(puzzle.cluesDown[i], 1);
        var clueAndMatches = {};
        clueAndMatches.clue = puzzle.cluesDown[i];
        clueAndMatches.matches = matches;
        clueAndMatches.atLeastOneLetterAlready = atLeastOneLetterAlready;
        clueAndMatches.alreadyAnswered = alreadyAnswered;
        cluesAndMatches.push(clueAndMatches);
    }

    cluesAndMatches.sort(function(a,b) { return a.matches.length - b.matches.length;});

    // First clear all warnings
    for (var i=0; i<puzzle.rows; i++) {
        for (var j=0; j<puzzle.columns; j++) {
            puzzle.cells[i][j].cellView.children[0].setAttribute("stroke", "none");
        }
    }

    for (var i=0; i<cluesAndMatches.length; i++) {
        var clue = cluesAndMatches[i].clue;
        var isProblemCell = cluesAndMatches[i].matches.length == 0 && !cluesAndMatches[i].alreadyAnswered;
        var curRow = clue.startCell.row;
        var curColumn = clue.startCell.column;
        for (var j=0; j<clue.answerLength; j++) {
            var cellView = puzzle.cells[curRow][curColumn].cellView;
            if (isProblemCell) {
                cellView.children[0].setAttribute("stroke", "red");
                cellView.children[0].setAttribute("stroke-width", "2px");
            }
            if (clue.isAcross) {
                curColumn++;
            } else {
                curRow++;
            }
        }
        
    }
}

function SizeTypeChanged(value) {
    
    var puzzleIsEmpty = true;
    for (var i=0; i<puzzle.cells.length; i++) {
        for (var j=0; j<puzzle.cells[i].length; j++) {
            if (puzzle.cells[i][j].isBlack || puzzle.cells[i][j].text.length > 0) {
                puzzleIsEmpty = false;
                break;
            }
        }
        if (!puzzleIsEmpty) {
            break;
        }
    }

    if(!puzzleIsEmpty) {
        var confirm = window.confirm("This will reset your puzzle words and grid.  Are you sure you want to do this?");
        if (!confirm) {
            switch(currentSelectedPuzzleSize) {
                case 'Weekday':
                document.getElementById('SettingsSizeWeekday').checked = true;
                break;
                case 'Sunday':
                document.getElementById('SettingsSizeSunday').checked = true;
                break;
                case 'Custom':
                document.getElementById('SettingsSizeCustom').checked = true;
                break;
            }
            return;
        }
    }

    currentSelectedPuzzleSize = value;
    var customRows = document.getElementById('CustomSizeRows');
    var customColumns = document.getElementById('CustomSizeColumns');

    switch(value) {
        case 'Weekday':
            customRows.value = "";
            customColumns.value = "";
            customRows.disabled = true;
            customColumns.disabled = true;
            if (puzzle.columns != 15 || puzzle.rows != 15) {
                InitializeBoardForPuzzle(null, 15, 15);
                SavePuzzle();
            }
        break;
        case 'Sunday':
            customRows.value = "";
            customColumns.value = "";
            customRows.disabled = true;
            customColumns.disabled = true;
            if (puzzle.columns != 21 || puzzle.rows != 21) {
                InitializeBoardForPuzzle(null, 21, 21);
                SavePuzzle();
            }
        break;
        case 'Custom':
            customRows.disabled = false;
            customColumns.disabled = false;
            var desiredRows = Number(customRows.value);
            var desiredColumns = Number(customColumns.value);
            if (desiredRows > 0 && desiredColumns > 0) {
                InitializeBoardForPuzzle(null, desiredRows, desiredColumns);
                SavePuzzle();
            }
        break;
    }
}

function OnCustomSizesChanged() {
    var customRows = document.getElementById('CustomSizeRows');
    var customColumns = document.getElementById('CustomSizeColumns');
    var desiredRows = Number(customRows.value);
    var desiredColumns = Number(customColumns.value);
    if (desiredRows > 0 && desiredColumns > 0) {
        InitializeBoardForPuzzle(null, desiredRows, desiredColumns);
        SavePuzzle();
    }
}