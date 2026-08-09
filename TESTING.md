# Testing checklist
Stuff that needs to be tested after a major upgrade or rework.
## Client
### Lobby
- [ ] Internal QR code scanner works
- [ ] Automatically join if name entered before scanning QR code
- [ ] External QR code scanner works
- [ ] Avatar selector works
- [ ] Player can join the game
### Question
- [ ] Wakelock is active preventing screen from turning off
- [ ] Stats updates after question
- [ ] Wrong answer is highlighted in red
- [ ] Correct answer is highlighted in green
- [ ] Selected answer is highlighted in blue
- [ ] Answer buttons are disabled after answering
- [ ] Player can rejoin on disconnect
### Results
- [ ] Player gets automatically disconnected and can join a new lobby with same code

## Monitor
### Lobby
- [ ] Player list updates when players join or leave
- [ ] Rules changes when settings are changed
- [ ] Preload is shown for categories
- [ ] Number of total questions updated when categories are selected
- [ ] Player can be kicked from the lobby
- [ ] Failed to load category marked in red (turn off server to test)
- [ ] Unchecking the spinner shouldn't use the spinner
- [ ] Unchecking background music shouldn't play background music
- [ ] Unchecking sound effects shouldn't play sound effects
- [ ] Unchecking text to speech shouldn't play text to speech
- [ ] Unchecking saving stats shouldn't save stats
### Question
- [ ] Question banner showing which index it is before the question is shown
- [ ] Category spinner works and stops at the correct category, playing a clicking sound
- [ ] Top left should show category name and index during question
- [ ] Questions with answers playback is displayed correctly
- [ ] Text to speech works for category name and question text
- [ ] Questions with audio playback is displayed correctly, pauses background music and resumes after
- [ ] Questions with image playback is displayed correctly
- [ ] Questions with list playback is displayed correctly
- [ ] Questions with quote playback is displayed correctly
- [ ] Questions with video playback is displayed correctly, pauses background music and resumes after
- [ ] Each guess is marking the player as answered and plays a different pitched ping sound for each player
- [ ] When all players guessed correct, play applauds sound
- [ ] When one player loses their maximum multiplier, play a sad trombone sound
- [ ] The timer works and also counts down the points
- [ ] When it's 5 seconds left, a timer warning is shown and a ticking sound is played and the background music gets slower
- [ ] The correct answer is revealed and the point changes are shown for each player
- [ ] The player list is updated with the correct order showing an animation moving the players
- [ ] The crown is shown on the player with the highest score
### Results
- [ ] It reveals each players avatar and score one by one
- [ ] Plays applauds sound for the winning player who plays a victory animation
- [ ] It minimizes the player list and shows the credits
- [ ] Hover over credits should pause the scrolling and show links
- [ ] Restart button takes you back to the lobby with the same gameid

## Others
- [ ] Bots work
- [ ] Stats are saved