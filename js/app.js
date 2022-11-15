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

// sounds
const missSound = new Audio('audio/miss.mp3');
const hitSound = new Audio('audio/hit.mp3');

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
let lastAIAction;
let gameOver;
let turnCount;
let playerWins = 0;
let computerWins = 0;
let haltMoves = false;


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

const bodyEl = document.querySelector('body');
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
const countdownEl = document.getElementById('countdown');
const turnCountEl = document.querySelector('#turn span');
const playerWinsEl = document.querySelector('#playerwin span');
const computerWinsEl = document.querySelector('#computerwin span');

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

// improve efficiency: forEach -> parent div
computerBoardEl.forEach(e => e.addEventListener('click', event => {
    // set firing square to the id of target div
    firingSquare = event.target.id;
    
    render();
}))

fireButtonEl.addEventListener('click', fire);

bodyEl.addEventListener('keyup', (event) => {
    if (event.code === "KeyF") {
        fire();
    } else if (event.code === "KeyR") {
        init();
    }
})


/* ----- Callback Functions ------ */
// Placement of player ships
// Ship orientation button changer
// Selection of square to fire upon
// Firer button function - checks if square has ship and if true updates the ships on bottom

function fire(){
    // ensure the computer has moved
    if (haltMoves) return;

    missSound.pause();
    missSound.currentTime = 0;
    

    hitSound.pause();
    hitSound.currentTime = 0;

    // if game is over, can't play
    if (gameOver) {
        message = 'Game is over, press reset to play again!'
        return;
    }

    // if game is still in setup and all ships are on the board start the game
    if (Object.values(placements).every(e => e === true) && setup) {
        setup = false;
        message = `${(playerTurn) ? 'Player' : 'Computer'} goes first!`
    } else if (setup) {
        message = 'Place all your pieces by interacting with the bottom panel. Drag to board to set. Click the arrow to change orientation. Click on the ships to remove from board.'
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
            playerTurn = false;
            turnCount++;
            if (value.ship !== null) {
                message = `${value.ship[0].toUpperCase() + value.ship.slice(1)}, hit!`
                computerHitCounter[value.ship]++
                hitSound.play();
                
                if (Object.values(computerHitCounter).reduce((sum, element) => sum + element) >= 17) {
                    gameOver = true;
                    message = "You win. You sunk all of the enemy's ships.";
                    playerWins++;
                }
            } else {
                message = `Miss.`
                missSound.play()
            }
        }
        firingSquare = null;
    }

    render();

    if (!playerTurn && !setup && !gameOver) {
        let delay = 3;
        haltMoves = true;
        const countdown = setInterval(function() {
            countdownEl.innerText = delay;

            if (delay <= 0) {
                missSound.pause();
                missSound.currentTime = 0;
                
            
                hitSound.pause();
                hitSound.currentTime = 0;


                aIFireShot();
                playerTurn = true;
                turnCount++;
                
                if (Object.values(playerHitCounter).reduce((sum, element) => sum + element.length, 0) >= 17) {
                    gameOver = true;
                    message = 'You lose. The computer sunk all of your ships.';
                    computerWins++;
                } 

                haltMoves = false;
                countdownEl.innerText = '';
                render();
                
                clearInterval(countdown)    
            }
            
            delay--;
        }, 1000);
        if (delay < 1) {}
        
    }    
};

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

// function for aI firing and updating relevant arrays
function aIFireShot() {
    let chosenShot = aISelectShot()
    
    lastAIAction = chosenShot.name;
    chosenShot.hit = true;
    removeFromSelectionArray(chosenShot);

    if (chosenShot.ship !== null) {
        hitSound.play()
        message = `The computer hit your ${chosenShot.ship} at ${chosenShot.name}.`
        playerHitCounter[chosenShot.ship].push(chosenShot);
        
    } else {
        missSound.play()
        message = `The computer chose ${chosenShot.name} and missed.`
        
    }

    render();
}

// ai helper function for choosing shots
function aISelectShot() {
    // let randRow, randCol;
    let stretch;
    
    // check if the computer has hit each ship but not fully sunk
    for (let key in playerHitCounter) {

        // randomly determine a square around a hit if a ship has been hit once
        if (playerHitCounter[key].length === 1) {
            
            let adjacentSet = randomSelectionArrayCreator(playerHitCounter[key][0].name, true, true);
             // randomly select from array and slowly decrease size of array if unselectable 
            while (adjacentSet.size > 0) {
                let randomKey = getRandomKey(adjacentSet)
                let currentSquare = findfromName(aIShotsRemaining, randomKey);

                if (currentSquare !== undefined) {
                    return currentSquare;
                }
                adjacentSet.delete(randomKey);
            }
        
        // if a ship has been hit at least once, direction has been determined, randomly select from adjacent squares in that direction
        } else if (playerHitCounter[key].length > 1 && playerHitCounter[key].length < shipLengths.get(key)) {

            // create new set to hold elements along direction
            let adjacentSet = new Set();
            let addRows = false;
            let addCols = false;

            // check to see if the first letter (aka the column) is the same, otherwise, the row must be the same
            if (playerHitCounter[key][0].name[0] === playerHitCounter[key][1].name[0]) {
                addRows = true;
            } else {
                addCols = true;
            }

            // iterate down the found squares adding all adjacents
            for (let square of playerHitCounter[key]) {
                randomSelectionArrayCreator(square.name, addRows, addCols, adjacentSet);
            }

            while (adjacentSet.size > 0) {
                let randomKey = getRandomKey(adjacentSet)
                let currentSquare = findfromName(aIShotsRemaining, randomKey);

                if (currentSquare !== undefined) {
                    return currentSquare;
                }
                adjacentSet.delete(randomKey);
            }

            // track shortest available ship to sink
        } else if (playerHitCounter[key].length === 0) {
            if (stretch === undefined || shipLengths.get(key) > stretch) {
                stretch = shipLengths.get(key);
            }
        }
    }

    // if AI makes it here, each ship has been either untouched or fully sunk, focus on stretches that are at least as long as the shortest ship that can be sunk

    let randomArraySwitch;

    let tempTransposed = new Array(10).fill().map(() => (new Array()));
    for (let row of aIShotsRemaining) {
        for (let element of row) {
            tempTransposed[Number(element.name.charCodeAt(0)-'a'.charCodeAt(0))].push(element);
        }
    }

    function concatenateStretches(arr, stretch = 1) {
        const concatenatedArray = new Array(10).fill().map(() => (new Array()));

        for (i=0; i<arr.length; i++) {

            for (j=0; j<arr[i].length-stretch+1;j++) {

                if (stretch < 2) return concatenatedArray;
                // push stretches to new array - duplicates intended to maximize chance - works on both transposed and regular array
                if (arr[i][j].name[0] === arr[i][j+1].name[0]) {

                    if (Number(arr[i][j].name.match(/\d+/))+stretch-1 === Number(arr[i][j+stretch-1].name.match(/\d+/))) {
                        concatenatedArray[i].push(...arr[i].slice(j, j+stretch));
                    }

                } else if (Number(arr[i][j].name.match(/\d+/)) === Number(arr[i][j+1].name.match(/\d+/))){

                    if (String.fromCharCode(arr[i][j].name.charCodeAt(0)+stretch-1) === arr[i][j+stretch-1].name[0]) {
                        concatenatedArray[i].push(...arr[i].slice(j, j+stretch));
                    }

              }

            }
        }
        // remove empty arrays or empty spaces
        return concatenatedArray.filter(e => (e) && e.length > 0);
    }

    function filterSaveLongest(longest, current){
        if (longest[0].length < current.length) {
            return [current]
        } else if (longest[0].length === current.length) {
            longest.push(current);
            return longest;
        } else {
            return longest;
        }
    }


    let stretchedTransposed = concatenateStretches(tempTransposed, stretch).reduce(filterSaveLongest, [[]]);
    let stretched = concatenateStretches(aIShotsRemaining, stretch).reduce(filterSaveLongest, [[]]);;


    if (stretchedTransposed[0].length > stretched[0].length) {
        randomArraySwitch = true;
    } else if (stretchedTransposed[0].length < stretched[0].length) {
        randomArraySwitch = false;
    } else {
        randomArraySwitch = !!Math.floor(Math.random()*2);
    }


    if (randomArraySwitch) {
        let firstIndex = Math.floor(Math.random()*stretchedTransposed.length);
        let secondIndex = Math.floor(Math.random()*stretchedTransposed[firstIndex].length);
        let shot = stretchedTransposed[firstIndex][secondIndex]
        if (shot) return shot
    } else {
        let firstIndex = Math.floor(Math.random()*stretched.length);
        let secondIndex = Math.floor(Math.random()*stretched[firstIndex].length);
        let shot = stretched[firstIndex][secondIndex];
        if (shot) return shot
    }

    // // just in case somehow the ai can't still hit ships even when focusing on stretches only



    let reducedTransposed = tempTransposed.filter(e => (e.length > 0)).reduce(filterSaveLongest, [[]]);
    let reduced = aIShotsRemaining.reduce(filterSaveLongest, [[]]);

    // in case of equality randomly choose whether to focus on column or row


    if (reducedTransposed[0].length > reduced[0].length) {
        randomArraySwitch = true;
    } else if (reducedTransposed[0].length < reduced[0].length) {
        randomArraySwitch = false;
    } else {
        randomArraySwitch = !!Math.floor(Math.random()*2);
    }

    
    if (randomArraySwitch) {
        let firstIndex = Math.floor(Math.random()*reducedTransposed.length);
        let secondIndex = Math.floor(Math.random()*reducedTransposed[firstIndex].length);
        return reducedTransposed[firstIndex][secondIndex];
    } else {
        let firstIndex = Math.floor(Math.random()*reduced.length);
        let secondIndex = Math.floor(Math.random()*reduced[firstIndex].length);
        return reduced[firstIndex][secondIndex];
    }

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

// returns random key from set
function getRandomKey(set) {
    let keys = Array.from(set.keys());
    return keys[Math.floor(Math.random() * keys.length)];
}

// remove shot from selection array for future random selection
function removeFromSelectionArray(square) {
    for (let i = 0; i < aIShotsRemaining.length; i++) {
        let index = aIShotsRemaining[i].findIndex(e => e === square);
        if (index > -1) {
            if (aIShotsRemaining[i].length === 1) {
                return aIShotsRemaining.splice(i, 1)[index];
            } else {
                return aIShotsRemaining[i].splice(index, 1);
            }
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
    gameOver = false;
    turnCount = 0;
    haltMoves = false;

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
    
    Array.from(playerShipEls.children).forEach(e => e.classList.remove('placed'));

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
    lastAIAction = null;

    // update model
    render();
}

function render(){
    
    renderTurn();

    renderBoardEls(playerBoard, playerBoardEl);
    renderBoardEls(computerBoard, computerBoardEl);

    renderHitTrack();
    
    fireButtonEl.innerHTML = (setup) ? "Start" : "<u>F</u>IRE!";

    messageEl.innerText = message;

    turnCountEl.innerText = turnCount;

    playerWinsEl.innerText = playerWins;
    computerWinsEl.innerText = computerWins;
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
            } else if (boardEl[node].id === lastAIAction) {
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
