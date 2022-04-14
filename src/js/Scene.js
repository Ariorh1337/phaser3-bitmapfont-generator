import Phaser from 'phaser';
import WebFont from 'webfontloader';
const js2xmlparser = require("js2xmlparser");

export default class Main extends Phaser.Scene {
    constructor() {
        super({
            key: 'Main',
        });
    }

    preload() {}

    create() {
        const btnGenerate = document.querySelector('#generate');
        btnGenerate.addEventListener('click', () => {
            const fontFamily = document.querySelector('#fontFamilyName').value;

            this.loadFont(fontFamily);
        });
    }

    loadFont(font) {
        WebFont.load({
            google: {
                families: [font]
            },
            fontloading: () => {
                this.clearScene();
                this.initResize();
            }
        });
    }

    clearScene() {
        if (this.symbols) this.symbols.destroy();
    }

    initResize() {
        const fontText = document.querySelector('#fontText').value;
        const fontFamily = document.querySelector('#fontFamilyName').value;
        const fontSize = parseInt(document.querySelector('#fontSize').value);
        const fontColor = document.querySelector('#fontColor').value;
        const strokeSize = parseInt(document.querySelector('#strokeSize').value);
        const strokeColor = document.querySelector('#strokeColor').value;

        const charArray = fontText.split("");

        /** @type {Phaser.GameObjects.Text[]} */
        const objArray = [];
        const widthArray = [];
        const heightArray = [];

        const style = {
            fontFamily: fontFamily,
            fontSize: fontSize + 'px',
            color: fontColor,
        };

        if (strokeSize) style["strokeThickness"] = strokeSize;
        if (strokeColor.length) style["stroke"] = strokeColor;

        charArray.forEach((char) => {
            const obj = this.add.text(0, 0, char, style);

            widthArray.push(obj.width);
            heightArray.push(obj.height);
            objArray.push(obj);
        });

        this.symbols = this.add.container(0,0, objArray);

        let maxWidth = Math.max(...widthArray);
        let maxHeight = Math.max(...heightArray);

        const gridWidth = 10;
        const gridHeight = (charArray.length / gridWidth) + 1;

        Phaser.Actions.GridAlign(objArray, {
            width: gridWidth,
            height: gridHeight,
            cellWidth: maxWidth,
            cellHeight: maxHeight,
            position: Phaser.Display.Align.TOP_LEFT,
            x: maxWidth / 2,
            y: maxHeight / 2
        });

        objArray.forEach((obj) => {
            obj.x = obj.x + (maxWidth/2) - (obj.width/2);
        });

        const width = maxWidth * gridWidth;
        const height = maxHeight * gridHeight;

        this.symbols.width = width;
        this.symbols.height = height;

        this.scene.scene.scale.once('resize', () => {
            this.generateFont(maxWidth, maxHeight, objArray);
        });

        this.scale.resize(width, height);
    }

    generateFont(maxWidth, maxHeight, objArray) {
        // Generate Font
        const fontFamily = document.querySelector('#fontFamilyName').value;

        const fontSize = parseInt(document.querySelector('#fontSize').value);
        const fontColor = document.querySelector('#fontColor').value;
        const strokeSize = parseInt(document.querySelector('#strokeSize').value);

        const charDataArr = [];

        objArray.forEach((obj) => {
            // Test Generate Data Array
            charDataArr.push({
                "@": {
                    "id": obj.text.charCodeAt(0),
                    "char": obj.text,
                    "x": obj.x,
                    "y": obj.y,
                    "width": obj.width,
                    "height": obj.height,
                    "xoffset": "0",
                    "yoffset": maxHeight - obj.height,
                    "xadvance": obj.width,
                    "page": "0",
                    "chnl": "15"
                }
            });
        });

        const xml = js2xmlparser.parse("font", {
            "info": {
                "@": {
                    "face": fontFamily,
                    "size": fontSize,
                    "bold": "0",
                    "italic": "0",
                    "charset": "",
                    "unicode": "1",
                    "stretchH": "100",
                    "smooth": "0",
                    "aa": "1",
                    "padding": "0,0,0,0",
                    "spacing": "0,0",
                    "outline": String(strokeSize)
                }
            },
            "common": {
                "@": {
                    "lineHeight": maxHeight,
                    "base": maxHeight,
                    "scaleW": "512",
                    "scaleH": "512",
                    "pages": "1",
                    "packed": "0",
                    "alphaChnl": "0",
                    "redChnl": "4",
                    "greenChnl": "4",
                    "blueChnl": "4"
                }
            },
            "pages": {
                "pages": {
                    "@": {
                        "id": "0",
                        "file": "font.png",
                    }
                }
            },
            "chars": {
                "@": {
                    "count": charDataArr.length
                },
                "char": charDataArr
            }
        }, {
            format: {
                doubleQuotes: true
            }
        });
    
        document.querySelector('#xmlMap').href = `data:text/xml;base64,${btoa(xml)}`;

        this.downloadCanvas({
            element: document.querySelector('#fontMap'),
            fontFamily,
            fontSize,
            fontColor,
        });       
    }

    downloadCanvas(data) {
        const { element, fontFamily, fontSize, fontColor } = data;
        const { width, height } = this.symbols; 

        const key = `${fontFamily}_${fontSize}_${fontColor}_${new Date().getTime()}`;
        this.createTexture(this, key, this.symbols, width, height).then(() => {
            element.href = this.textures.getBase64(key);
        });
    }

    /**
     * @param {Phaser.Scene} scene 
     * @param {string} key 
     * @param {Phaser.GameObjects.Container} container 
     * @param {number} width 
     * @param {number} height 
     * @returns {Promise<string>}
     */
    createTexture(scene, key, container, width, height) {
        return new Promise((resolve) => {
            if (scene.textures.get(key).key !== "__MISSING") {
                console.debug(
                    `createTexture was used more than once, texture: ${key}`
                );

                return resolve(key);
            }
    
            const totalTexture = scene.add.renderTexture(0, 0, width, height);
    
            totalTexture.draw(container);
    
            totalTexture.snapshot((element) => {
                const base64 = element.getAttribute("src");
                scene.textures.addBase64(key, base64);
    
                totalTexture.destroy();
    
                setTimeout(() => {
                    resolve(key);
                }, 100);
            });
        });
    }
}
