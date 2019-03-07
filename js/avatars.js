class Avatar {
    constructor(name, code) {
        this.name = name;
        this.code = code;
        this.url = /src=\"(.*?)\"/.exec(twemoji.parse(this.code))[1];
    }
}

function mapByName(avatars) {
    let result = {};
    for (var i = 0; i < avatars.length; i++) {
        result[avatars[i].name] = avatars[i];
    }
    return result;
}

let avatars = mapByName([
    new Avatar('monkey', '\uD83D\uDC35'),
    new Avatar('dog', '\uD83D\uDC36'),
    new Avatar('wolf', '\uD83D\uDC3A'),
    new Avatar('cat', '\uD83D\uDC31'),
    new Avatar('lion', '\uD83E\uDD81'),
    new Avatar('tiger', '\uD83D\uDC2F'),
    new Avatar('horse', '\uD83D\uDC34'),
    new Avatar('cow', '\uD83D\uDC2E'),
    new Avatar('dragon', '\uD83D\uDC32'),
    new Avatar('pig', '\uD83D\uDC37'),
    new Avatar('mouse', '\uD83D\uDC2D'),
    new Avatar('hamster', '\uD83D\uDC39'),
    new Avatar('rabbit', '\uD83D\uDC30'),
    new Avatar('bear', '\uD83D\uDC3B'),
    new Avatar('panda', '\uD83D\uDC3C'),
    new Avatar('frog', '\uD83D\uDC38'),
    new Avatar('octopus', '\uD83D\uDC19'),
    new Avatar('turtle', '\uD83D\uDC22'),
    new Avatar('bee', '\uD83D\uDC1D'),
    new Avatar('snail', '\uD83D\uDC0C'),
    new Avatar('penguin', '\uD83D\uDC27')
]);
/*,
    dromedary : new Avatar('dromedary', '\uD83D\uDC2A')*/

export default avatars;