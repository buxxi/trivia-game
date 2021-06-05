# Trivia Game
A couch trivia game with multiple possible categories where the players use their smart phone as a controller and a browser in fullscreen for the game.
Accompanying the question a movie clip, music or an image could be played with 4 possible answers.
This project previously used WebRTC and tried to use do everything in the browser which made a nightmare to support.

### Build instructions:
with node (tested on node16):
```
git clone https://github.com/buxxi/trivia-game.git
npm install
npm run start
```
or with Docker:
```
git clone https://github.com/buxxi/trivia-game.git
sudo docker build -t buxxi/trivia .
sudo docker run -d -p 8080:8080 --name trivia buxxi/trivia
```

### Sample screenshot:
(a bit outdated)
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

### API's used:
- Youtube: https://developers.google.com/youtube/v3
- The movie database: http://docs.themoviedb.apiary.io
- Spotify: https://developer.spotify.com/web-api/
- REST Countries: https://restcountries.eu
- IGDB: https://www.igdb.com/api
- Random Famous Quotes: https://market.mashape.com/andruxnet/random-famous-quotes
- Reponsive Voice: http://responsivevoice.org/api/
- The Cocktail DB: http://www.thecocktaildb.com/api/json/v1/1/random.php

### Clips from:
- https://www.youtube.com/user/movieclips/videos
- https://www.youtube.com/user/SupraDarky/videos

### Music & sound from:
- http://soundbible.com/tags-beep.html
- http://www.purple-planet.com/

### Background pattern from:
- http://subtlepatterns.com/

 [screenshot]: https://github.com/buxxi/trivia-game/blob/master/trivia_screenshot.gif

### Avatars from:
- Twemoji: https://github.com/twitter/twemoji
