/* ----- Constants ----- */
// Countdown changeable in console if necessary
let countdownAmount = 3;
let computerShipVisibility = false;

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

// placement object indicating which of the player ships have been placed on board

const placements = {
    carrier: false,
    battleship: false,
    destroyer: false,
    submarine: false,
    cruiser: false,
}

// player and computer ship hit counter - objects containg: 
// an array of the square objects for player to additionally assist with targetting
// or a tracking number for computers simply to show hit indicators on the bottom of the screen.

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

// length definitions, each ship takes up this many squares
const shipLengths = new Map();

shipLengths.set('destroyer', 2);
shipLengths.set('submarine', 3);
shipLengths.set('cruiser', 3);
shipLengths.set('battleship', 4);
shipLengths.set('carrier', 5);


/* ----- States ----- */

let playerTurn; // Is it the player's turn?
let setup; // Is it setup or game time?
let message; // What message is being shown to players?
let orient = false; // Will player's ships be oriented vertically or horizontally after bveing dragged;
let draggedElement; // What element (ship) is currently being dragged;
let firingSquare; // Which square will the player fire into
let aIShotsRemaining; // Array containing all the remaining squares that the AI can shoot into
let lastAIAction; //Where did the AI fire into last
let gameOver; //Is the game over?
let turnCount; // What is the turn number?
let playerWins = 0; // How many times has the player won
let computerWins = 0; // How many times has the computer won
let haltMoves = false; // Boolean to stop player from firing
let missCount;
let hardmode;
let lastMessage; // for checking if we need to reset animation;
let playerWon;


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
const playerBoardEl = document.getElementById('playerboard');
const computerBoardEl = document.getElementById('computerboard');
const playerShipEls = document.getElementById('playerships');
const computerShipEls = document.getElementById('computerships');
const messageEl = document.querySelector('h1')
const fireButtonEl = document.getElementById('fire');
const orientationIconEl = document.querySelector('.fa-arrow-circle-o-right');
const resetButtonEl = document.getElementById('reset');
const playerTurnEl = document.getElementById('playerturn');
const computerTurnEl = document.getElementById('computerturn');
const countdownEl = document.getElementById('countdown');
const turnCountEl = document.querySelector('#turn span');
const playerWinsEl = document.querySelector('#playerwin span');
const computerWinsEl = document.querySelector('#computerwin span');
const hardmodeCheckBox = document.getElementById('hardmode');

// Adding drag events so the player can move ships onto the board

playerShipEls.addEventListener('dragstart', (event) => {
    event.target.classList.add("dragging");
    draggedElement = event.target.classList[1];
})

playerShipEls.addEventListener('dragend', (event) => {
    event.target.classList.remove("dragging");
    draggedElement = undefined;
})

playerBoardEl.addEventListener('dragover', (event) => {
    if (event.target.classList.contains('board')) return;
    event.preventDefault();
    if (placements[draggedElement] === true) return;
    if (canPlace(event, playerBoard)) {
        event.target.classList.add("filling");
    } else {
        event.target.classList.add("cantfill");
    }
});

playerBoardEl.addEventListener("dragleave", (event) => {
    if (placements[draggedElement] === true) return;
    event.target.classList.remove("filling");
    event.target.classList.remove("cantfill")
});

playerBoardEl.addEventListener("drop", (event) => {
    if (placements[draggedElement] === true) return;
    event.target.classList.remove("filling");
    event.target.classList.remove("cantfill")
    if (canPlace(event, playerBoard, true)) {
        updatePlacement();
        // if (Object.values(placements).every(e => e === true)) setup = false;
        render();
    }
});

// reset game with button

resetButtonEl.addEventListener('click', init)

// remove set ships if placed incorrectly by clicking

playerShipEls.addEventListener('click', (event) => {
    if (!(event.target.parentNode.classList.contains('placed')) || setup === false) return;
    removeShip(event, playerBoard);
    render();
})

// rotate orientation by clicking the orientation icon

orientationIconEl.addEventListener('click', (event) => {
    event.target.classList.toggle('fa-rotate-90');
    orient = (event.target.classList.contains('fa-rotate-90'));
})

// FIRING!!!

computerBoardEl.addEventListener('click', event => {
    // set firing square to the id of target div
    firingSquare = event.target.id;

    render();
});

fireButtonEl.addEventListener('click', fire);

bodyEl.addEventListener('keyup', (event) => {
    if (event.code === "KeyF") {
        fire();
    } else if (event.code === "KeyR") {
        init();
    }
})

// Hardmode activated with checkbox;
hardmodeCheckBox.addEventListener('click', event => {
    hardmode = event.target.checked;
})


/* ----- Callback Functions ------ */

// Function for firing, includes player and computer move actions

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
        message = 'Place all your ships first.'
    }

    // act as confirmation for shot if it's players turn
    if (playerTurn && !setup) {
        let chosenSquare = findfromName(computerBoard, firingSquare);
        if (chosenSquare === undefined) {
            message = 'Select a valid square';
        } else if (chosenSquare.hit === true) {
            message = 'Choose a new square';
        } else {
            chosenSquare.hit = true;
            playerTurn = false;
            turnCount++;
            if (chosenSquare.ship !== null) {
                message = `${chosenSquare.ship[0].toUpperCase() + chosenSquare.ship.slice(1)} hit at ${chosenSquare.name.slice(1)}!`
                computerHitCounter[chosenSquare.ship]++
                hitSound.play();
                
                if (Object.values(computerHitCounter).reduce((sum, element) => sum + element) >= 17) {
                    gameOver = true;
                    message = "You win. You sunk all of the enemy's ships.";
                    playerWon = true;
                    playerWins++;
                }
            } else {
                message = `You chose ${chosenSquare.name.slice(1)}. Miss.`
                missSound.play()
            }
        }
        firingSquare = null;
    }

    render();

    if (!playerTurn && !setup && !gameOver) {

        // add a countdown timer to give space between human and computer actions
        let delay = countdownAmount;
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
                    playerWon = false;
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

function findShipNotHit(arr) {
    for (let i = 0; i < arr.length; i++) {
        let value = arr[i].find(e => e.ship !== null && e.hit === false);
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
    if (event.target.children.length > 50) return false;
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
        missCount = 0;
        
    } else {
        missSound.play()
        message = `The computer chose ${chosenShot.name} and missed.`
        missCount++;
        
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

    // HARDMODE
    if (hardmode) {
        if (missCount > 7) {
            let shot = findShipNotHit(playerBoard);
            if (shot) return shot;
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

    // create new arrays only containing elements with consecutive board elements at least as long as the stretch variable.
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

    // reduction function to remove all save the longest nested arrays, to increase odds of hitting a shit
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


    // Check if rows or if columns have the longest stretch, if both are equally randomly choose between them;
    if (stretchedTransposed[0].length > stretched[0].length) {
        randomArraySwitch = true;
    } else if (stretchedTransposed[0].length < stretched[0].length) {
        randomArraySwitch = false;
    } else {
        randomArraySwitch = !!Math.floor(Math.random()*2);
    }

    // return a shot element 
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

// init function - initializes starting game state
function init(){
    
    setup = true;
    gameOver = false;
    turnCount = 0;
    haltMoves = false;
    playerWon = undefined;

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

    missCount = 0; // for hardmode

    // update model
    render();
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


function render(){
    
    renderTurn();

    renderBoardEls(playerBoard, playerBoardEl);
    renderBoardEls(computerBoard, computerBoardEl, computerShipVisibility);

    renderHitTrack();
    
    fireButtonEl.innerHTML = (setup) ? "Start" : "<u>F</u>IRE!";

    messageEl.innerText = message;
    if (message !== lastMessage) reset_animation();
    lastMessage = message;

    turnCountEl.innerText = turnCount;

    playerWinsEl.innerText = playerWins;
    computerWinsEl.innerText = computerWins;

    if (!setup) {
        hardmodeCheckBox.disabled = true;
    } else {
        hardmodeCheckBox.disabled = false;
    }

    renderWinLoss();
}

// function for rendering a board given an array, can set ships to render or not
function renderBoardEls(array, boardEl, renderShips=true) {
    // initiate variables, shipIterator used for checking for rotation or how many squares have been found so far
    let node = 0;
    let shipIterator = {
        destroyer: [1, true],
        cruiser: [1, true],
        submarine: [1, true],
        battleship: [1, true],
        carrier: [1, true],
    }

    // array for asigning images to pictures based on number
    let namingArray = {'half': 2, 'third': 3, 'fourth': 4, 'fifth': 5};

    // only need to check rotation if rendering ship
    if (renderShips) {
        array.forEach(row => {
            let previousElement;
            row.forEach(element => {
        
                if (previousElement && previousElement === element.ship) {
        
                    shipIterator[element.ship][1] = false;
                } 
                previousElement = element.ship;
            })
        })
    }

    array.forEach(row => {
        row.forEach(element => {

            // remove classes from shipless squares
            if (element.ship === null) {
                boardEl.children[node].classList.remove('hittable');
                boardEl.children[node].classList.remove('rotated');
                boardEl.children[node].classList.remove('sub');
                boardEl.children[node].classList.remove('cruise');
                for (let partOne in namingArray) {
                    for (i=1; i<=namingArray[partOne]; i++) {
                        boardEl.children[node].classList.remove(`${partOne}${i}`);
                    }
                }
            } else {
                boardEl.children[node].classList.add('hittable');

                // assign classes for ship images and add a rotation if rendering ship
                if (renderShips) {
                    switch (element.ship) {
                        case 'destroyer':
                            boardEl.children[node].classList.add('half'+shipIterator[element.ship][0]);
                            shipIterator[element.ship][0]++
                            break;
                        case 'cruiser':
                            boardEl.children[node].classList.add('third'+shipIterator[element.ship][0]);
                            boardEl.children[node].classList.add('cruise');
                            shipIterator[element.ship][0]++
                            break;
                        case 'submarine':
                            boardEl.children[node].classList.add('third'+shipIterator[element.ship][0]);
                            boardEl.children[node].classList.add('sub');
                            shipIterator[element.ship][0]++
                            break;
                        case 'battleship':
                            boardEl.children[node].classList.add('fourth'+shipIterator[element.ship][0]);
                            shipIterator[element.ship][0]++
                            break;
                        case 'carrier':
                            boardEl.children[node].classList.add('fifth'+shipIterator[element.ship][0]);
                            shipIterator[element.ship][0]++
                            break;
                    }
                    if (shipIterator[element.ship][1]) {
                        boardEl.children[node].classList.add('rotated');     
                    }
                } else {
                    boardEl.children[node].classList.remove('rotated');
                    boardEl.children[node].classList.remove('sub');
                    boardEl.children[node].classList.remove('cruise');
                    for (let partOne in namingArray) {
                        for (i=1; i<=namingArray[partOne]; i++) {
                            boardEl.children[node].classList.remove(`${partOne}${i}`);
                        }
                    }
                }
            }

            // add or remove hit markers from squares
            if (element.hit === false) {
                boardEl.children[node].classList.remove('hit');
                boardEl.children[node].classList.remove('miss');
            } else {
                if (boardEl.children[node].classList.contains('hittable')) {
                    boardEl.children[node].classList.add('hit');
                } else {
                    boardEl.children[node].classList.add('miss');
                }
            }
            // render firing selection square from previous turn
            if (boardEl.children[node].id === firingSquare) {
                boardEl.children[node].classList.add('firingsquare');
            } else if (boardEl.children[node].id === lastAIAction) {
                boardEl.children[node].classList.add('firingsquare');
            } else {
                boardEl.children[node].classList.remove('firingsquare');
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

function renderWinLoss() {
    if (playerWon === true) {
        playerShipEls.classList.add('won');
        resetButtonEl.classList.add('gameover');
    } else if (playerWon === false) {
        playerShipEls.classList.add('lost');
        resetButtonEl.classList.add('gameover');
    } else {
        playerShipEls.classList.remove('lost');
        playerShipEls.classList.remove('won');
        resetButtonEl.classList.remove('gameover');
    }
}

// reset message animation

function reset_animation() {
    messageEl.style.animation = 'none';
    messageEl.offsetHeight;
    messageEl.style.animation = null; 
  }

init();
