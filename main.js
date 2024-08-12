import "./style.css";
import Phaser from "phaser";
import _, { fill } from "lodash";
async function fetcher(numberOfWords) {
    try {
        const url = `https://random-word-api.herokuapp.com/word?number=${numberOfWords}`;
        const res = await fetch(url);
        const data = await res.json();
        const usedLetters = new Set();
        const filteredWords = [];
        for (const word of data) {
            const firstLetter = word[0].toLowerCase();
            if (!usedLetters.has(firstLetter)) {
                filteredWords.push(word);
                usedLetters.add(firstLetter);
                if (filteredWords.length === numberOfWords) {
                    break;
                }
            }
        }
        return filteredWords;
    } catch (err) {
        console.error(err.message);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 500,
    height: 670,
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 5 },
            debug: false,
        },
    },
};
const game = new Phaser.Game(config);
let player;
let wordsGroup;
let level = 0;
let score = 0;
let scoreText;
let levelText;
let lossText;
let targetWord = "";
let splitWord = [];
// let words = [];
function preload() {
    this.load.spritesheet("spaceship", "./assets/spaceship.jpg", {
        frameWidth: 200,
        frameHeight: 120,
    });
}
async function create() {
    player = this.physics.add.sprite(250, 670, "spaceship");
    player.setCollideWorldBounds(true);

    wordsGroup = this.physics.add.group();
    await fetchAndAddWords.call(this);
    this.physics.add.collider(wordsGroup, player);
    this.physics.add.overlap(player, wordsGroup, hitword, null, this);
    document.body.addEventListener("keydown", handleKeyDown.bind(this));
    scoreText = this.add.text(20, 10, "score: 0", {
        fontSize: "32px",
        fill: "#fff",
    });
    levelText = this.add.text(350, 15, "level: 1", {
        fontSize: "24px",
        fill: "#fff",
    });
}
async function fetchAndAddWords() {
    const words = await fetcher(level + 3);
    words.forEach((word, _) => {
        const x = Phaser.Math.Between(40, 400);
        const y = Phaser.Math.Between(-100, 0);

        const wordText = this.add.text(x, y, word, {
            fontSize: "20px",
            fill: "#fff",
            margin: {
                left: 10,
                right: 10,
                top: 5,
                bottom: 5,
            },
        });
        wordsGroup.add(wordText);
        this.physics.world.enable(wordText);
        wordText.body.setVelocity(0, 20);
    });
    return words;
}
async function handleKeyDown(event) {
    if (targetWord === "") {
        wordsGroup.children.iterate((child) => {
            if (_.startsWith(child._text, event.key)) {
                targetWord = child._text;
                splitWord = _.split(targetWord, "");
                return false;
            }
        });
    }
    if (event.key === splitWord[0]) {
        targetWord = splitWord.join("");
        splitWord.shift();
        wordsGroup.children.iterate((child) => {
            if (child._text === targetWord) {
                targetWord = splitWord.join("");
                child.setText(targetWord);
                if (targetWord === "") {
                    child.destroy();
                    score += 10;
                    scoreText.setText(`Score: ${score}`);
                    targetWord = "";
                    splitWord = [];
                }
            }
        });
    }
    if (wordsGroup.countActive(true) === 0) {
        level++;
        levelText.setText(`level: ${level + 1} `);
        await fetchAndAddWords.call(this);
    }
}
function hitword(player) {
    player.setTint(0xff0000);
    lossText = this.add.text(250, 335, "You lost", {
        fontSize: "32px",
        fill: "#FFF",
    });
    this.physics.pause();

    setTimeout(() => {
        window.location.reload();
    }, 5000);
}
async function update() {}
