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

// placement array

const placements = {
    carrier: false,
    battleship: false,
    destroyer: false,
    submarine: false,
    cruiser: false,
}


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
let dragLength;
let draggedElement;



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
const messageEl = document.getElementById('message');
const fireButtonEl = document.getElementById('fire');
const orientationIconEl = document.querySelector('.fa-arrow-circle-o-right');

// Adding drag events

playerShipEls.addEventListener('dragstart', (event) => {
    event.target.classList.add("dragging");
    dragLength = event.target.children.length;
    draggedElement = event.target.classList[1];
})

playerShipEls.addEventListener('dragend', (event) => {
    event.target.classList.remove("dragging");
    dragLength = undefined;
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

/*


*/


/* ----- Callback Functions ------ */
// Placement of player ships
// Ship orientation button changer
// Selection of square to fire upon
// Firer button function - checks if square has ship and if true updates the ships on bottom


// Get the array indices by matching the DOM element id to the array index name property
function getArrayCoordinates(element, array) {
    for (let i = 0; i<array.length; i++) {
        for (let j=0; j<array[i].length; j++) {
            if (array[i][j].name === element.id) return [i, j];
        }
    }
}

function canPlace(event, board, update = false) {
    const [row, column] = getArrayCoordinates(event.target, board);

    // construct temp array to check for ships and edges easily
    let tempArray = [];
    // alter check based on ship orientation;
    if (orient) {
        for (let i = 0; i<dragLength; i++) {
            tempArray.push((board[row+i] === undefined) ? undefined : board[row+i][column]);
        }
    } else {
        for (let i = 0; i<dragLength; i++) {
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

function updatePlacement() {
    placements[draggedElement] = true;
    const shipEl = document.querySelector('#playerships > .'+draggedElement);
    shipEl.classList.add('placed');
}

function removeShip(event, board) {
    event.target.parentNode.classList.remove('placed');
    for (let row of board) {
        for (let element of row) {
            if (element.ship === event.target.parentNode.classList[1]) element.ship = null;
        }
    }
    placements[event.target.parentNode.classList[1]] = false;
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

function init(){
    
    setup = true;

    for (placed in placements) {
        placements[placed]  = false;
    }


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
            element.hit = true;
        })
    })

    render();
}

function render(){
    

    renderBoardEls(playerBoard, playerBoardEl);
    renderBoardEls(computerBoard, computerBoardEl);
    
    fireButtonEl.innerText = (setup) ? "Start" : "FIRE!"

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
            node++;
        })
    })
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
