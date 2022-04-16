import WebFont from "webfontloader";
import {
    createTexture,
    createXML,
    downloadBlob,
    downloadLink,
    makeGradient,
} from "../util/extra";
import { event } from "../util/globals";

type InputElement = HTMLInputElement | HTMLTextAreaElement;
const getInput = (id: string): InputElement => {
    return document.querySelector(id)! as InputElement;
};
const getInputValue = (id: string): string => {
    return getInput(id).value;
};
const getButton = (id: string): HTMLButtonElement => {
    return document.querySelector(id)! as HTMLButtonElement;
};

function getGradients() {
    const lines = document.querySelectorAll(".gradientLine");
    const options = [] as any;

    lines.forEach((line) => {
        const color = line.getAttribute("data-color");
        const percent = line.getAttribute("data-percent");

        if (color && percent) {
            options.push({
                color,
                percent: Number(percent),
            });
        }
    });

    return options;
}

export default class Main extends Phaser.Scene {
    private filename?: string;
    private dataXML?: string;
    private dataPNG?: string;

    private container?: Phaser.GameObjects.Container;
    private glyph: Phaser.GameObjects.Group;

    private settings = {};

    private dataJSON = [] as any;

    constructor() {
        super({
            key: "Main",
        });
    }

    preload() {
        this.glyph = this.add.group();
    }

    create() {
        const {
            refreshStatic,
            snapshotLayer,
            prepareExports,
            loadPNG,
            loadXML,
            backColor,
            filename,
        } = this.getInputs();

        refreshStatic.addEventListener("click", () => {
            this.dataJSON = [];
            this.loadFont(getInputValue("#fontFamilyName"));
            this.disableLoadButtons();
        });

        snapshotLayer.addEventListener("click", () => {
            this.saveToJSON();

            this.glyph.getChildren().forEach((obj) => {
                const text = obj as Phaser.GameObjects.Text;
                const clone = this.add.text(
                    text.x,
                    text.y,
                    text.text,
                    text.style
                );

                clone.setAlpha(text.alpha);
                clone.setScale(text.scaleX, text.scaleY);
                clone.setAngle(text.angle);
                clone.setOrigin(text.originX, text.originY);

                this.container?.add(clone);
                this.container?.bringToTop(text);
            });

            this.disableLoadButtons();
        });

        prepareExports.addEventListener("click", () => {
            this.saveToJSON();
            this.generateFont();
            this.enableLoadButtons();
        });

        loadPNG.addEventListener("click", () => {
            if (!this.dataPNG || !this.filename) return;
            downloadLink(this.dataPNG, `${this.filename}.png`, "image/png");
        });
        getButton("#loadJSON").addEventListener("click", () => {
            if (!this.dataJSON) return;
            downloadBlob(
                JSON.stringify(this.dataJSON),
                `${this.filename}.json`,
                "text/json"
            );
        });
        loadXML.addEventListener("click", () => {
            if (!this.dataXML || !this.filename) return;
            downloadBlob(this.dataXML, `${this.filename}.xml`, "text/xml");
        });

        this.filename = filename.value;
        filename.addEventListener("change", () => {
            if (!filename.value) filename.value = "font";
            this.filename = filename.value;
            this.disableLoadButtons();
        });
        backColor.addEventListener("change", () => {
            const color = backColor.value;
            this.cameras.main.backgroundColor = new Phaser.Display.Color(
                parseInt(color.substr(1, 2), 16),
                parseInt(color.substr(3, 2), 16),
                parseInt(color.substr(5, 2), 16)
            );
        });

        const fontColor = getInput("#fontColor");
        fontColor.addEventListener("change", () => {
            this.glyph.getChildren().forEach((obj) => {
                const text = obj as Phaser.GameObjects.Text;
                text.setColor(getInputValue("#fontColor"));
            });
            this.disableLoadButtons();
        });

        const strokeSize = getInput("#strokeSize");
        strokeSize.addEventListener("change", () => {
            this.glyph.getChildren().forEach((obj) => {
                const text = obj as Phaser.GameObjects.Text;
                text.setStroke(
                    text.style.stroke,
                    parseInt(getInputValue("#strokeSize"))
                );
            });
            this.disableLoadButtons();
        });

        const strokeColor = getInput("#strokeColor");
        strokeColor.addEventListener("change", () => {
            this.glyph.getChildren().forEach((obj) => {
                const text = obj as Phaser.GameObjects.Text;
                text.setStroke(
                    getInputValue("#strokeColor"),
                    text.style.strokeThickness
                );
            });
            this.disableLoadButtons();
        });

        const fontAlpha = getInput("#fontAlpha");
        fontAlpha.addEventListener("change", () => {
            this.glyph.setAlpha(
                parseFloat(getInputValue("#fontAlpha").replace(",", "."))
            );
            this.disableLoadButtons();
        });

        const fontScaleX = getInput("#fontScaleX");
        fontScaleX.addEventListener("change", () => {
            this.glyph.getChildren().forEach((obj) => {
                const text = obj as Phaser.GameObjects.Text;
                text.scaleX = parseFloat(
                    getInputValue("#fontScaleX").replace(",", ".")
                );
            });
            this.disableLoadButtons();
        });

        const fontScaleY = getInput("#fontScaleY");
        fontScaleY.addEventListener("change", () => {
            this.glyph.getChildren().forEach((obj) => {
                const text = obj as Phaser.GameObjects.Text;
                text.scaleY = parseFloat(
                    getInputValue("#fontScaleY").replace(",", ".")
                );
            });
            this.disableLoadButtons();
        });

        const fontAngle = getInput("#fontAngle");
        fontAngle.addEventListener("change", () => {
            this.glyph.getChildren().forEach((obj) => {
                const text = obj as Phaser.GameObjects.Text;
                text.setAngle(parseInt(getInputValue("#fontAngle")));
            });
            this.disableLoadButtons();
        });

        const posOffsetChange = () => {
            const settings = this.settings as any;

            const fontOffsetX = parseInt(getInputValue("#fontOffsetX"));
            const fontOffsetY = parseInt(getInputValue("#fontOffsetY"));

            Phaser.Actions.GridAlign(this.glyph.getChildren(), {
                width: settings.gridWidth,
                height: settings.gridHeight,
                cellWidth: settings.maxWidth,
                cellHeight: settings.maxHeight,
                position: Phaser.Display.Align.CENTER,
                x: settings.maxWidth / 2 + fontOffsetX,
                y: settings.maxHeight / 2 + fontOffsetY,
            });

            this.disableLoadButtons();
        };
        getInput("#fontOffsetX").addEventListener("change", posOffsetChange);
        getInput("#fontOffsetY").addEventListener("change", posOffsetChange);

        getInput("#gradientAngle").addEventListener("change", () => {
            event.emit("need_update");
        });

        event.on("need_update", () => {
            setTimeout(() => {
                const gradientOpt = getGradients();
                const fontColor = getInputValue("#fontColor");
                const gradientAngle = parseInt(getInputValue("#gradientAngle"));

                this.glyph.getChildren().forEach((obj) => {
                    const text = obj as Phaser.GameObjects.Text;

                    if (gradientOpt.length >= 2) {
                        text.setFill(
                            makeGradient(text, gradientOpt, true, gradientAngle)
                        );
                    } else {
                        text.setColor(fontColor);
                    }
                });

                this.disableLoadButtons();
            }, 100);
        });

        this.loadFont(getInputValue("#fontFamilyName"));
    }

    loadFont(font: string) {
        WebFont.load({
            google: {
                families: [font],
            },
            fontactive: () => {
                this.clearScene();
                this.baseLayer();
            },
            fontinactive: () => {
                alert("Font not found");
            },
        });
    }

    clearScene() {
        if (this.container) this.container.destroy();
        this.dataJSON = [];
    }

    baseLayer() {
        const {
            fontText,
            fontAlpha,
            fontScaleX,
            fontScaleY,
            fontAngle,
            fontOffsetX,
            fontOffsetY,
            fontColor,
            gradientAngle,
        } = this.getInputs();

        const charArray = [...new Set(fontText.split("")).keys()];

        const widthArray = [] as number[];
        const heightArray = [] as number[];

        const style = this.getFontStyle();

        const objArray = charArray.map((char) => {
            const obj = this.add.text(0, 0, char, style).setOrigin(0.5);

            obj.setAlpha(fontAlpha);
            obj.setScale(fontScaleX, fontScaleY);
            obj.setAngle(fontAngle);

            const gradientOpt = getGradients();
            if (gradientOpt.length >= 2) {
                obj.setFill(
                    makeGradient(obj, gradientOpt, true, gradientAngle)
                );
            } else {
                obj.setColor(fontColor);
            }

            widthArray.push(obj.width);
            heightArray.push(obj.height);

            this.glyph.add(obj);

            return obj;
        });

        this.container = this.add.container(0, 0, objArray);

        const maxWidth = Math.max(...widthArray);
        const maxHeight = Math.max(...heightArray);

        const gridWidth = 10;
        const gridHeight = Math.ceil(charArray.length / gridWidth);

        Phaser.Actions.GridAlign(objArray, {
            width: gridWidth,
            height: gridHeight,
            cellWidth: maxWidth,
            cellHeight: maxHeight,
            position: Phaser.Display.Align.CENTER,
            x: maxWidth / 2 + fontOffsetX,
            y: maxHeight / 2 + fontOffsetY,
        });

        const width = maxWidth * gridWidth;
        const height = maxHeight * gridHeight;

        this.container.width = width;
        this.container.height = height;

        this.scene.scene.scale.once("resize", () => {
            this.settings["gridWidth"] = gridWidth;
            this.settings["gridHeight"] = gridHeight;

            this.settings["gameWidth"] = width;
            this.settings["gameHeight"] = height;

            this.settings["maxWidth"] = maxWidth;
            this.settings["maxHeight"] = maxHeight;

            this.settings["objArray"] = objArray.map((obj) => {
                return {
                    text: obj.text,
                    x: obj.x,
                    y: obj.y,
                    width: obj.width,
                    height: obj.height,
                };
            });
        });

        this.scale.resize(width, height);
    }

    generateFont() {
        const { maxHeight, objArray } = this.settings as any;
        const filename = this.filename;

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
        const { width, height } = this.container!;

        createTexture(this, key, this.container!, width, height).then(
            (data) => {
                this.filename = filename || "";
                this.dataXML = xml;
                this.dataPNG = data.base64;

                console.log("done");
            }
        );
    }

    getFontStyle(): Phaser.Types.GameObjects.Text.TextStyle {
        const {
            fontFamily,
            fontSize,
            fontColor,
            strokeSize,
            strokeColor,
            paddingLeft,
            paddingRight,
            paddingTop,
            paddingBottom,
        } = this.getInputs();

        const style = {
            fontFamily: fontFamily,
            fontSize: fontSize + "px",
            color: fontColor,
            padding: {
                left: paddingLeft,
                right: paddingRight,
                top: paddingTop,
                bottom: paddingBottom,
            },
        } as Phaser.Types.GameObjects.Text.TextStyle;

        if (strokeSize) style["strokeThickness"] = strokeSize;
        if (strokeColor.length) style["stroke"] = strokeColor;

        return style;
    }

    getInputs() {
        const backColor = getInput("#backColor");
        const filename = getInput("#filename");

        const fontText = getInputValue("#fontText");
        const fontFamily = getInputValue("#fontFamilyName");
        const fontSize = parseInt(getInputValue("#fontSize"));
        const fontColor = getInputValue("#fontColor");
        const strokeSize = parseInt(getInputValue("#strokeSize"));
        const strokeColor = getInputValue("#strokeColor");
        const fontAlpha = parseFloat(
            getInputValue("#fontAlpha").replace(",", ".")
        );
        const fontScaleX = parseFloat(
            getInputValue("#fontScaleX").replace(",", ".")
        );
        const fontScaleY = parseFloat(
            getInputValue("#fontScaleY").replace(",", ".")
        );
        const fontAngle = parseInt(getInputValue("#fontAngle"));
        const gradientAngle = parseInt(getInputValue("#gradientAngle"));

        const fontOffsetX = parseInt(getInputValue("#fontOffsetX"));
        const fontOffsetY = parseInt(getInputValue("#fontOffsetY"));

        const paddingLeft = parseInt(getInputValue("#paddingLeft"));
        const paddingRight = parseInt(getInputValue("#paddingRight"));
        const paddingTop = parseInt(getInputValue("#paddingTop"));
        const paddingBottom = parseInt(getInputValue("#paddingBottom"));

        const refreshStatic = getButton("#refreshStatic");
        const snapshotLayer = getButton("#snapshotLayer");
        const prepareExports = getButton("#prepareExports");
        const loadPNG = getButton("#loadPNG");
        const loadXML = getButton("#loadXML");

        return {
            backColor,
            filename,
            fontText,
            fontFamily,
            fontSize,
            fontColor,
            strokeSize,
            strokeColor,
            fontAlpha,
            fontScaleX,
            fontScaleY,
            fontAngle,
            fontOffsetX,
            fontOffsetY,
            refreshStatic,
            prepareExports,
            loadPNG,
            loadXML,
            paddingLeft,
            paddingRight,
            paddingTop,
            paddingBottom,
            snapshotLayer,
            gradientAngle,
        };
    }

    saveToJSON() {
        const {
            filename,
            fontText,
            fontFamily,
            fontSize,
            fontColor,
            strokeSize,
            strokeColor,
            fontAlpha,
            fontScaleX,
            fontScaleY,
            fontAngle,
            fontOffsetX,
            fontOffsetY,
            paddingLeft,
            paddingRight,
            paddingTop,
            paddingBottom,
            gradientAngle,
        } = this.getInputs();
        const gradient = getGradients();

        this.dataJSON.push({
            filename: (filename as any).value,
            fontText,
            fontFamily,
            fontSize,
            fontColor,
            strokeSize,
            strokeColor,
            fontAlpha,
            fontScaleX,
            fontScaleY,
            fontAngle,
            fontOffsetX,
            fontOffsetY,
            paddingLeft,
            paddingRight,
            paddingTop,
            paddingBottom,
            gradientAngle,
            gradient,
        });
    }

    enableLoadButtons() {
        const { loadPNG, loadXML } = this.getInputs();
        const loadJSON = getButton("#loadJSON");

        loadPNG.classList.remove("btn-secondary");
        loadXML.classList.remove("btn-secondary");
        loadJSON.classList.remove("btn-secondary");
        loadPNG.classList.add("btn-primary");
        loadXML.classList.add("btn-primary");
        loadJSON.classList.add("btn-primary");
    }

    disableLoadButtons() {
        const { loadPNG, loadXML } = this.getInputs();
        const loadJSON = getButton("#loadJSON");

        loadPNG.classList.remove("btn-primary");
        loadXML.classList.remove("btn-primary");
        loadJSON.classList.remove("btn-primary");
        loadPNG.classList.add("btn-secondary");
        loadXML.classList.add("btn-secondary");
        loadJSON.classList.add("btn-secondary");

        this.dataPNG = undefined;
        this.dataXML = undefined;
    }
}
