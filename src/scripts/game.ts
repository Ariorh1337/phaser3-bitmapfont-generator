import "phaser";
import Main from "./scenes/Main";

const config = {
    width: 512,
    height: 512,
    type: Phaser.WEBGL,
    parent: "phaser",
    transparent: true,
    scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.NO_CENTER,
    },
    disableContextMenu: false,
    render: {
        antialias: false,
        pixelArt: true,
        roundPixels: true,
    },
    scene: [Main],
};

window.addEventListener("load", () => {
    new Phaser.Game(config);
});
