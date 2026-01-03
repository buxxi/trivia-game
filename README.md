# Trivia Game
A couch trivia game with multiple possible categories where the players use their smartphone as a controller and a browser in fullscreen for the game.
Accompanying the question a movie clip, music or an image could be played with 4 possible answers.
This project previously used WebRTC and tried to use do everything in the browser which made a nightmare to support.

### Build instructions:
with node (tested on node20):
```sh
git clone https://github.com/buxxi/trivia-game.git
cd trivia-game
npm install
mkdir ~/.config/trivia-game
cp config.json.sample ~/.config/trivia-game/config.json
npm run start
```
or with Docker:
```sh
git clone https://github.com/buxxi/trivia-game.git
cd trivia-game
sudo docker build -t buxxi/trivia .
mkdir ~/.config/trivia-game
cp config.json.sample ~/.config/trivia-game/config.json
sudo docker run -d -p 8080:8080 --volume ~/.local/share/trivia-game:/opt/trivia/data/trivia-game --volume ~/.config/trivia-game:/opt/trivia/conf/trivia-game --volume ~/.cache/trivia-game:/opt/trivia/cache/trivia-game --name trivia buxxi/trivia
```

### Sample screenshot:
![Trivia Screenshot][screenshot]

### Notable libraries used:
- Vue.js: https://vuejs.org/
- SASS: https://sass-lang.com/
- FontAwesome: http://fontawesome.io/
- qcode-decode: https://github.com/cirocosta/qcode-decoder
- pizzicato: https://alemangui.github.io/pizzicato
- wavesurfer: https://wavesurfer-js.org/
- randomColor: https://github.com/davidmerfield/randomColor
- Compromise: https://github.com/nlp-compromise/compromise

### Music & sound from:
- http://soundbible.com/tags-beep.html
- https://soundbible.com/1830-Sad-Trombone.html
- https://soundbible.com/1964-Small-Crowd-Applause.html
- https://samplefocus.com/samples/tick-tock-clock
- Last Haze - https://open.spotify.com/track/4fMVIYFWlSXxXQowcB8csH?si=9562dc0736ce4a9f

### Background pattern from:
- http://subtlepatterns.com/

 [screenshot]: https://github.com/buxxi/trivia-game/blob/master/trivia_screenshot.gif

### Avatars from:
- Twemoji: https://github.com/twitter/twemoji
