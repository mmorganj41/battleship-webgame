/* ----- Constants ----- */
// Countdown
// Player and computer arrays with objects indicating hit locations


/* ----- States ----- */
// Turn switch and turn #
// Hit counter
// Ship placements
// Setup or play bool
// Ship orientation bool




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


/* ----- Callback Functions ------ */
// Placement of player ships
// Ship orientation button changer
// Selection of square to fire upon
// Firer button function - checks if square has ship and if true updates the ships on bottom


/* ----- Main Functions ----- */

// Inititalizes and resets game state
// Updates scoreboard and message
// Removes hit markers and previous ships
// Assigns computer ships via randomization
// Allows for placement of player ships
// Forbids "firing" until all placement occurs
// Randomly choose player turn order
// Confirm with fire button (renamed confirm temporarily)

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