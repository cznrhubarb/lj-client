# "Do Lumberjacks Dream of Wooden Sheep?" (Don't have a name yet)

## Dev Log:
I am making a lumberjack MMO and I have no idea what I am doing. The concept is that players will be people who, every time 
they fall asleep, wake up in a shared dream with everyone else in the world where they are lumberjacks in an endless forest.

#### Goals!
* There will be no combat and no talking. 
  * I'm thinking you'll still be able to see the names of other players though.
  * I am going to append '-jack' to whatever you pick to be your name though.
* Players will be placed randomly in an infinite forest. 
  * Each time they log in, they will start in a different random spot. 
  * The forest will regrow, so players will never really know if they've been someplace before or not. 
  * There will be random structures and events to find placed throughout the forest.
* There will be resource collection/management.
  * The primary resource will be wood.
* Players will be able to build structures.
  * Not sure what they'll do yet.
  * These too shall decay.
* You may or may not find other players while you're walking around. 
  * I want it to be somewhat rare so that it seems special.
  * There will be an algorithm to place players so that they don't start too close to each other.
    * I may tweak or disable this for the game jam demo.
* There will be a skill tree that is represented by a graphic of an actual tree.
  * I'm not sure what the skills will be yet, but I have some ideas.
  * Experience will be earned only while players are _away_ from the game.
  * The rate of xp gain, and the duration for which it can be gained, will be determined by the amount of interesting shit the player sees while dreaming they are a lumberjack.
* There will be a lot of puns.

#### Other Notes
* Art will be whatever I can scrounge from open source art repositories on the internet.
  * Attributions will be collected at the bottom of this file.
* Sound will probably be open source stuff when I get around to it.
  * Or I may try to make my own music and sound effects. I'm not sure yet. It will come down to whether I have any extra time or not.
* Front-end client is being developed in JavaScript using Phaser 3.0, which was just released a couple weeks ago and has minimal documentation still.
* Back-end client is being developed in Elixir using Phoenix, of which I have almost no prior experience in.
* I have no idea how to architect an MMO server, so I will be using worst-practices.
  * It will very likely be easy to cheat at this game if I can't figure a lot of it out.

### V1 (2/22/18):
![V1 Screenshot](https://github.com/cznrhubarb/lj-client/blob/master/ScreenshotFriday_v1.gif?raw=true)
* Players control a lumberjack using single mouseclick/fingertap controls.
  * The lumberjack is a goblin because I found goblin lumberjack art on an open source game art site.
  * Player is (mostly) fully animated, with directionality.
* Multiple client to single server connection is implemented.
* Player input replicated to other clients (minus some color and animation out-of-syncness).
* Terrain is stored in a server side database. 
  * Anything not marked as a specific type in the DB is considered a tree by default.
  * There are also 'stump's and 'dirt', but dirt is just the absence of a sprite.
* Players chop down trees as they walk.
* Some grass is in place, but it's just a single patch. It's not set to scroll with the camera yet.
* The forest is "endless". (There are probably some Number.MAX_VALUE constraints I imagine.)

#### Attributions
Goblin Lumberjack and Grass tiles by Clint Bellanger
 
  https://opengameart.org/users/clint-bellanger

Stump by Pixsquare

  https://opengameart.org/users/pixquare

Trees by b_o

  https://opengameart.org/content/pine-tree-tiles

Rope icon by Pixture

  http://www.iconarchive.com/show/board-game-icons-by-pixture/Rope-icon.html

Building icon by IronDevil

  http://www.iconarchive.com/show/ids-3d-icons-12-icons-by-iron-devil/Big-pink-house-icon.html

Other resource icons by 7soul1

  https://7soul1.deviantart.com/art/420-Pixel-Art-Icons-for-RPG-129892453
  https://7soul1.deviantart.com/art/15-Quest-Related-Icons-134333487

UI resources and buildings by Kenney

  http://kenney.nl/assets/ui-pack-rpg-expansion
  http://kenney.nl/assets/hexagon-pack
  
Lumberjack font by Alexey Kalinin

  https://www.behance.net/gallery/30812011/Lumberjack-Free-fontThanks