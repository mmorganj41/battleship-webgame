/* ----- Constants ----- */
// Countdown
// Player and computer arrays with objects indicating hit locations
const playerBoard = new Array(10).fill().map(() => (new Array(10).fill().map(() => {
    return {name: null, hit: false, ship: null}
})));
const computerBoard = new Array(10).fill().map(() => (new Array(10).fill().map(() => {
    return {name: null, hit: false, ship: null}
})));

// Update naming for each object 

for (let i = 0; i<playerBoard.length; i++) {
    for (let j = 0; j<playerBoard[i].length; j++) {
        let letter = String.fromCharCode('a'.charCodeAt(0) + j); 
        playerBoard[i][j].name = letter+(i+1);
    }
}
for (let i = 0; i<computerBoard.length; i++) {
    
    for (let j = 0; j<computerBoard[i].length; j++) {
        let letter = String.fromCharCode('a'.charCodeAt(0) + j); 
        computerBoard[i][j].name = 'c'+letter+(i+1);
    }
}


// placement object

const placements = {
    carrier: false,
    battleship: false,
    destroyer: false,
    submarine: false,
    cruiser: false,
}

// player and computer ship hit counter

const playerHitCounter = {
    carrier: [],
    battleship: [],
    destroyer: [],
    submarine: [],
    cruiser: [],
}

const computerHitCounter = {
    carrier: 0,
    battleship: 0,
    destroyer: 0,
    submarine: 0,
    cruiser: 0,
}

// length definitions
const shipLengths = new Map();

shipLengths.set('destroyer', 2);
shipLengths.set('submarine', 3);
shipLengths.set('cruiser', 3);
shipLengths.set('battleship', 4);
shipLengths.set('carrier', 5);


/* ----- States ----- */
// Turn switch and turn #
// Hit counter
// Ship placements
// Setup or play bool
// Ship orientation bool

let playerTurn;
let setup;
let message;
let orient = false;
let draggedElement;
let firingSquare;
let aIShotsRemaining;



/* ----- Cached elements ----- */
// Gameboards
// Countdown
// Ships
// Scoreboard
// Message
// Orientation button
// Fire button
// Reset Button
// Turn indicator

const playerBoardEl = document.querySelectorAll('#playerboard > div');
const computerBoardEl = document.querySelectorAll('#computerboard > div');
const playerShipEls = document.getElementById('playerships');
const computerShipEls = document.getElementById('computerships');
const messageEl = document.getElementById('message');
const fireButtonEl = document.getElementById('fire');
const orientationIconEl = document.querySelector('.fa-arrow-circle-o-right');
const resetButtonEl = document.getElementById('reset');
const playerTurnEl = document.getElementById('playerturn');
const computerTurnEl = document.getElementById('computerturn');

// Adding drag events

playerShipEls.addEventListener('dragstart', (event) => {
    event.target.classList.add("dragging");
    draggedElement = event.target.classList[1];
})

playerShipEls.addEventListener('dragend', (event) => {
    event.target.classList.remove("dragging");
    draggedElement = undefined;
})

playerBoardEl.forEach(element => {
    element.addEventListener('dragover', (event) => {
        event.preventDefault();
        if (placements[draggedElement] === true) return;
        if (canPlace(event, playerBoard)) {
            event.target.classList.add("filling");
        } else {
            event.target.classList.add("cantfill");
        }
    });
});

playerBoardEl.forEach(element => {
    element.addEventListener("dragleave", (event) => {
        if (placements[draggedElement] === true) return;
        event.target.classList.remove("filling");
        event.target.classList.remove("cantfill")
    });
})

playerBoardEl.forEach(element => {
    element.addEventListener("drop", (event) => {
        if (placements[draggedElement] === true) return;
        event.target.classList.remove("filling");
        event.target.classList.remove("cantfill")
        if (canPlace(event, playerBoard, true)) {
            updatePlacement();
            // if (Object.values(placements).every(e => e === true)) setup = false;
            render();
        }
    })
})

// reset game with button

resetButtonEl.addEventListener('click', init)

// remove set ships if placed incorrectly by clicking

playerShipEls.addEventListener('click', (event) => {
    if (!(event.target.parentNode.classList.contains('placed')) || setup === false) return;
    removeShip(event, playerBoard);
    render();
})

// rotate orientation by clicking

orientationIconEl.addEventListener('click', (event) => {
    event.target.classList.toggle('fa-rotate-90');
    orient = (event.target.classList.contains('fa-rotate-90'));
})

// FIRING!!!

computerBoardEl.forEach(e => e.addEventListener('click', event => {
    // set firing square to the id of target div
    firingSquare = event.target.id;
    
    render();
}))

fireButtonEl.addEventListener('click', event => {
    // if game is still in setup and all ships are on the board start the game
    if (Object.values(placements).every(e => e === true) && setup) {
        setup = false;
        message = `${(playerTurn) ? 'Player' : 'Computer'} goes first!`
    }

    // act as confirmation for shot if it's players turn
    if (playerTurn && !setup) {
        let value = findfromName(computerBoard, firingSquare);
        if (value === undefined) {
            message = 'Select a valid square';
        } else if (value.hit === true) {
            message = 'Choose a new square';
        } else {
            value.hit = true;
            if (value.ship !== null) {
                message = `${value.ship[0].toUpperCase() + value.ship.slice(1)}, hit!`
                computerHitCounter[value.ship]++
            } else {
                message = `Miss.`
            }
        }
        firingSquare = null;
    }

    render();
})


/* ----- Callback Functions ------ */
// Placement of player ships
// Ship orientation button changer
// Selection of square to fire upon
// Firer button function - checks if square has ship and if true updates the ships on bottom


// Finds the array element from its name property
function findfromName(arr, name) {
    for (let i = 0; i < arr.length; i++) {
        let value = arr[i].find(e => e.name === name);
        if (value !== undefined) {
            return value;
        }
    }
}

// Get the array indices by matching the DOM element id to the array index name property
function getArrayCoordinates(element, array) {
    for (let i = 0; i<array.length; i++) {
        for (let j=0; j<array[i].length; j++) {
            if (array[i][j].name === element.id) return [i, j];
        }
    }
}

// Check to see if drag event can be dropped
function canPlace(event, board, update = false) {
    const [row, column] = getArrayCoordinates(event.target, board);

    // construct temp array to check for ships and edges easily
    let tempArray = [];
    // alter check based on ship orientation;
    if (orient) {
        for (let i = 0; i<shipLengths.get(draggedElement); i++) {
            tempArray.push((board[row+i] === undefined) ? undefined : board[row+i][column]);
        }
    } else {
        for (let i = 0; i<shipLengths.get(draggedElement); i++) {
            tempArray.push((board[row][column + i]));
        }
    }

    // only place ship if nothing is there
    if (tempArray.every(e => e !== undefined && e.ship === null) ) {
        if (update) tempArray.map(e => e.ship = draggedElement)
        return true;
        
    } else {
        return false;
    }

}

//  checks to see if AI can place ship at row and column, updates board and available squares depending
function canAIPlace(row, column, board, orientation, ship) {
    let tempArray = [];
    if (orientation) {
        for (let i = 0; i<shipLengths.get(ship); i++) {
            tempArray.push((board[row+i] === undefined) ? undefined : board[row+i][column]);
        }
    } else {
        for (let i = 0; i<shipLengths.get(ship); i++) {
            tempArray.push((board[row][column + i]));
        }
    }

    if (tempArray.every(e => e !== undefined && e.ship === null) ) {
        tempArray.map(e => e.ship = ship);
        return true;
        
    } else {
        return false;
    }
}


// Returns the indices of an array by its ship property only if its hit property is true (aka it's been fired upon)
function getIndexOfHit(arr, name) {
    for (let i = 0; i < arr.length; i++) {
        let index = arr[i].findIndex(e => e.hit === true && e.ship === name);
        if (index > -1) {
            return [i, index];
        }
    }
}

// update ship elements on bottom of screen to indicate if they've been placed
function updatePlacement() {
    placements[draggedElement] = true;
    const shipEl = document.querySelector('#playerships > .'+draggedElement);
    shipEl.classList.add('placed');
}

// allow for removal of placed ship elements
function removeShip(event, board) {
    event.target.parentNode.classList.remove('placed');
    for (let row of board) {
        for (let element of row) {
            if (element.ship === event.target.parentNode.classList[1]) element.ship = null;
        }
    }
    placements[event.target.parentNode.classList[1]] = false;
}

// place AI ships function
function placeAIShips() {
    
    // for future use if want to optimize randomization 
    // const availableSquaresOrient = computerBoard.map((row, i) => {
    //     return (row.map((element, j) => {
    //         return [i, j];
    //     }))
    // })

    
    // const availableSquaresNorm = computerBoard.map((col, i) => {
    //     return (col.map((element, j) => {
    //         return [j, i];
    //     }))
    // })

    for (let [key, value] of shipLengths) {
        while (true) {
            let row;
            let col;
            let randOrient = !!Math.floor(Math.random()*2);
            if (randOrient) {
                // ignore rows that will have ship off the board
                row = Math.floor(Math.random()*(computerBoard.length+1-value));
                col = Math.floor(Math.random()*computerBoard[row].length);
                if (canAIPlace(row, col, computerBoard, randOrient, key)) {
                    break;
                } 
            } else {
                col = Math.floor(Math.random()*(computerBoard.length+1-value));
                row = Math.floor(Math.random()*computerBoard[col].length);
                if (canAIPlace(row, col, computerBoard, randOrient, key)) {
                    break;
                } 
            }
        }
    }
    render()
}

// ai for making shots
function aISelectShot() {
    let randRow, randCol;

    // check if the computer has hit each ship but not fully sunk
    for (let key in playerHitCounter) {

        // randomly determine a square around a hit if a ship has been hit once
        if (playerHitCounter[key].length === 1) {
            let adjacentArray = randomSelectionArrayCreator(playerHitCounter[key][0].name, true, true);

            // randomly select from array and slowly decrease size of array if unselectable 
            while (adjacentArray.length > 0) {
                let currentSquare = findfromName(aIShotsRemaining, adjacentArray.splice(Math.floor(Math.random()*adjacentArray.length), 1));
                if (currentSquare !== undefined) {
                    return currentSquare;
                }
            }
        
        // if a ship has been hit at least once, direction has been determined, randomly select from adjacent squares in that direction
        } else if (playerHitCounter[key].length > 1 && playerHitCounter[key].length < shipLengths.get(key)) {


        }
    }

    // if AI makes it here, each ship has been either untouched or fully sunk, randomly select any square available, hoping for a hit
    randRow = Math.floor(Math.random()*aIShotsRemaining.length);
    randCol = Math.floor(Math.random()*aIShotsRemaining[randRow].length);
    return aIShotsRemaining[randRow][randCol];
}

// generates a set around the square input (matches element.name of the board arrays)
function randomSelectionArrayCreator(squareStr, rowBool, columnBool, randomSelection = new Set()) {
    const directionArr = [1, -1];

    let colCharCode = squareStr.charCodeAt(0);
    let rowValue = Number(squareStr.match(/\d+/));

    if (rowBool) {
        for (let num of directionArr) {
            let newRow = rowValue+num;
            if (newRow > 0 && newRow < 11) {
                randomSelection.add(`${String.fromCharCode(colCharCode)}${String(newRow)}`);
            }
        }
    }
    if (columnBool) {
        for (let num of directionArr) {
            let newCol = String.fromCharCode(colCharCode+num);
            if (newCol >= 'a' && newCol <= 'j') {
                randomSelection.add(`${newCol}${String(rowValue)}`);
            }
        }
    }
    return randomSelection;
}

// remove shot from selection array for future random selection
function removeFromSelectionArray(square) {
    for (let i = 0; i < aIShotsRemaining.length; i++) {
        let index = aIShotsRemaining[i].findIndex(e => e === square);
        if (index > -1) {
            return aIShotsRemaining[i].splice(index, 1)
        }
    }
}

/* ----- Main Functions ----- */

// Inititalizes and resets game state
// Updates scoreboard and message
// Removes hit markers and previous ships
// Assigns computer ships via randomization
// Allows for placement of player ships
// Forbids "firing" until all placement occurs
// Randomly choose player turn order
// Confirm with fire button (renamed confirm temporarily)

init();

// init function - initializes starting game state
function init(){
    
    setup = true;

    // clear placement object
    for (placed in placements) {
        placements[placed]  = false;
    }

    // randomly deterine who moves first
    playerTurn = !!Math.floor(Math.random()*2);

    message = 'Setup your board!'
    // Clear Boards
    playerBoard.forEach(row => {
        row.forEach(element => {
            element.ship = null;
            element.hit = false;
        })
    })
    computerBoard.forEach(row => {
        row.forEach(element => {
            element.ship = null;
            element.hit = false;
        })
    })

    playerBoard[5][5].ship = 'cruiser';
    playerBoard[5][5].hit = true;

    // place ships for computer
    placeAIShips()

    // reset hitCounters
    for (let key in playerHitCounter) {
        playerHitCounter[key] = [];
        computerHitCounter[key] = 0;
    }

    // build shot array for AI random selection - references board squares
    aIShotsRemaining = new Array(10).fill().map(() => (new Array(10).fill().map(() => {
        return null;
    })));
    for (let i = 0; i<playerBoard.length; i++) {
        for (let j = 0; j<playerBoard[i].length; j++) {
            aIShotsRemaining[i][j] = playerBoard[i][j];
        }
    }


    // clear firing square
    firingSquare = null;

    // update model
    render();
}

function render(){
    
    renderTurn();

    renderBoardEls(playerBoard, playerBoardEl);
    renderBoardEls(computerBoard, computerBoardEl);

    renderHitTrack();
    
    fireButtonEl.innerText = (setup) ? "Start" : "FIRE!";

    messageEl.innerText = message;

    
}

// function for rendering a board given an array
function renderBoardEls(array, boardEl) {
    let node = 0;

    array.forEach(row => {
        row.forEach(element => {
            if (element.ship === null) {
                boardEl[node].classList.remove('hittable');
            } else {
                boardEl[node].classList.add('hittable');
            }
            if (element.hit === false) {
                boardEl[node].classList.remove('hit');
                boardEl[node].classList.remove('miss');
            } else {
                if (boardEl[node].classList.contains('hittable')) {
                    boardEl[node].classList.add('hit');
                } else {
                    boardEl[node].classList.add('miss');
                }
            }
            // render firing square
            if (boardEl[node].id === firingSquare) {
                boardEl[node].classList.add('firingsquare');
            } else {
                boardEl[node].classList.remove('firingsquare');
            }
            node++;
        })
    })
}

// render turn indicator

function renderTurn() {
    if (playerTurn) {
        playerTurnEl.classList.add('visible');
        computerTurnEl.classList.remove('visible');
    } else {
        computerTurnEl.classList.add('visible');
        playerTurnEl.classList.remove('visible');
    }
}

// Render hit indicators on bottom ship elements

function renderHitTrack() {
    for (let indicator of playerShipEls.children) {
        indicator.classList.remove('sunk');
        for (descendent of indicator.children) {
            descendent.classList.remove('damage')
        }
        if (playerHitCounter[indicator.classList[1]].length >= shipLengths.get(indicator.classList[1])) {
            indicator.classList.add('sunk');
        } else {
            for (i = 0; i<playerHitCounter[indicator.classList[1]].length; i++) {
                indicator.children[i].classList.add('damage');    
            }
        }
    }
    for (let indicator of computerShipEls.children) {
        indicator.classList.remove('sunk');
        for (descendent of indicator.children) {
            descendent.classList.remove('damage')
        }
        if (computerHitCounter[indicator.classList[1]] >= shipLengths.get(indicator.classList[1])) {
            indicator.classList.add('sunk');
        } else {
            for (i = 0; i<computerHitCounter[indicator.classList[1]]; i++) {
                indicator.children[i].classList.add('damage');    
            }
        }
    }
}

// Render board elements:
/*  
    Message
    Scoreboard
        Turn
        Player Wins
        Computer Wins
    Boards
        Player ship locations
        Both hit locations
        Hit indicators
        Hit notification
    Countdown
    Turn
    Ships
        Hit
        Sunk
    Ship Orientation
 */
