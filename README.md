# battleship-webgame

# Battleship

###### Game involves two players, each with their own board of 10x10 squares, and try to sink all of their opponent's ships by choosing a random square, which are hidden from the enemy.

![Screenshot](/Screenshot.png)

###### Technologies Used:

- HTML
- CSS
- Javascript

###### Getting StarteD:

On a new game, the player can drag each of their 5 ships (which can be rotated by clicking the orientation button). The computer will randomly generate ship locations which will be hidden from the player. The game can be started by pressing start after all ships have been placed.

The game randomly assigns a turn start. Which will be indicated by an appearing turn indicator below the boards. 

On computer turn start, computer randomly selects a square unless they get a hit where they choose nearby squares until they sink the ship. On player hit, a hit message and indicator will show up. Hit indicators will appear on board and on player ship indicators on a panel below to indicate hits. These will be red for hits. Whites will indicate misses. A countdown will go off before to put time in between turns.

On player turn start, player can click on an empty computer square on the board to indicate where they want to fire. They click the fire button to confirm and recieve a hit indication. 

The scoreboard on the side indicates turn # and whose turn it is along with player and computer wins. 

A reset button restarts the game. 

###### Next Steps:

- Difficulty Modes
- Explosion Animation
- Complete hovered square displaying ship


