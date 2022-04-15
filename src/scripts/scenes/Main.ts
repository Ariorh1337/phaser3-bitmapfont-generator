import WebFont from "webfontloader";
import {
    createTexture,
    createXML,
    downloadBlob,
    downloadLink,
} from "../util/extra";

type InputElement = HTMLInputElement | HTMLTextAreaElement;
const getInputValue = (id: string): string => {
    return (document.querySelector(id)! as InputElement).value;
};
const getButton = (id: string): HTMLButtonElement => {
    return document.querySelector(id)! as HTMLButtonElement;
};

export default class Main extends Phaser.Scene {
    private filename?: string;
    private dataXML?: string;
    private dataPNG?: string;

    private symbols?: Phaser.GameObjects.Container;

    constructor() {
        super({
            key: "Main",
        });
    }

    preload() {}

    create() {
        const { generate, loadPNG, loadXML } = this.getInputs();

        generate.addEventListener("click", () => {
            this.loadFont(getInputValue("#fontFamilyName"));
        });
        loadPNG.addEventListener("click", () => {
            if (!this.dataPNG || !this.filename) return;
            downloadLink(this.dataPNG, `${this.filename}.png`, "image/png");
        });
        loadXML.addEventListener("click", () => {
            if (!this.dataXML || !this.filename) return;
            downloadBlob(this.dataXML, `${this.filename}.xml`, "text/xml");
        });
    }

    loadFont(font: string) {
        WebFont.load({
            google: {
                families: [font],
            },
            fontactive: () => {
                this.clearScene();
                this.initResize();
            },
            fontinactive: () => {
                alert("Font not found");
            },
        });
    }

    clearScene() {
        if (this.symbols) this.symbols.destroy();
    }

    initResize() {
        const {
            fontText,
            fontFamily,
            fontSize,
            fontColor,
            strokeSize,
            strokeColor,
        } = this.getInputs();

        const charArray = [...new Set(fontText.split("")).keys()];

        const objArray = [] as Phaser.GameObjects.Text[];
        const widthArray = [] as number[];
        const heightArray = [] as number[];

        const style = {
            fontFamily: fontFamily,
            fontSize: fontSize + "px",
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

        this.symbols = this.add.container(0, 0, objArray);

        let maxWidth = Math.max(...widthArray);
        let maxHeight = Math.max(...heightArray);

        const gridWidth = 10;
        const gridHeight = charArray.length / gridWidth + 1;

        Phaser.Actions.GridAlign(objArray, {
            width: gridWidth,
            height: gridHeight,
            cellWidth: maxWidth,
            cellHeight: maxHeight,
            position: Phaser.Display.Align.TOP_LEFT,
            x: maxWidth / 2,
            y: maxHeight / 2,
        });

        objArray.forEach((obj) => {
            obj.x = obj.x + maxWidth / 2 - obj.width / 2;
        });

        const width = maxWidth * gridWidth;
        const height = maxHeight * gridHeight;

        this.symbols.width = width;
        this.symbols.height = height;

        this.scene.scene.scale.once("resize", () => {
            this.generateFont(maxHeight, objArray);
        });

        this.scale.resize(width, height);
    }

    generateFont(maxHeight: number, objArray: Phaser.GameObjects.Text[]) {
        const filename = prompt("Enter filename", "font");

        const { fontFamily, fontSize, strokeSize } = this.getInputs();

        const xml = createXML({
            filename: `${filename}.png`,
            objArray,
            maxHeight,
            fontFamily,
            fontSize,
            strokeSize,
        });

        const key = `${filename}_${new Date().getTime()}`;
        const { width, height } = this.symbols!;

        createTexture(this, key, this.symbols!, width, height).then((data) => {
            this.filename = filename || "";
            this.dataXML = xml;
            this.dataPNG = data.base64;
        });
    }

    getInputs() {
        const fontText = getInputValue("#fontText");
        const fontFamily = getInputValue("#fontFamilyName");
        const fontSize = parseInt(getInputValue("#fontSize"));
        const fontColor = getInputValue("#fontColor");
        const strokeSize = parseInt(getInputValue("#strokeSize"));
        const strokeColor = getInputValue("#strokeColor");

        const generate = getButton("#generate");
        const loadPNG = getButton("#loadPNG");
        const loadXML = getButton("#loadXML");

        return {
            fontText,
            fontFamily,
            fontSize,
            fontColor,
            strokeSize,
            strokeColor,
            generate,
            loadPNG,
            loadXML,
        };
    }
}
