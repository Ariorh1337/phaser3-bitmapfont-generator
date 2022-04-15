import * as js2xmlparser from "js2xmlparser";

export class Swear {
    public state = "pending" as "pending" | "done" | "canceled" | "rejected";
    public promise: Promise<any>;

    private _cancel: boolean;
    private _resolve!: Function;
    private _reject!: Function;

    constructor() {
        this._cancel = false;

        this.promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }

    cancel = () => {
        this._cancel = true;
        this.state = "canceled";
    };

    resolve = (data?: any) => {
        if (this._cancel) return;
        this.state = "done";
        this._resolve(data);
    };

    reject = (data?: any) => {
        if (this._cancel) return;
        this.state = "rejected";
        this._reject(data);
    };
}

export function makeGradient(
    textElm: Phaser.GameObjects.Text,
    options: Array<{ color: string; percent: number }>
) {
    const height = textElm.height;
    const font = Number(textElm.style.fontSize.replace("px", ""));
    const lines = Math.floor(height / font) || 1;

    if (options.length < 2)
        return console.error("at least two colors are expected");

    const gradient = textElm.context.createLinearGradient(
        0,
        0,
        0,
        textElm.height
    );

    new Array(lines).fill("").forEach((item, index) => {
        options.forEach((option) => {
            gradient.addColorStop(
                (1 / lines / 100) * option.percent + (1 / lines) * index,
                option.color
            );
        });
    });

    textElm.setFill(gradient);

    return gradient;
}

export function createTexture(
    scene: Phaser.Scene,
    key: string,
    container: Phaser.GameObjects.Container,
    width: number,
    height: number
): Promise<{ key: string; base64: string }> {
    return new Promise((resolve) => {
        if (scene.textures.get(key).key !== "__MISSING") {
            console.debug(
                `createTexture was used more than once, texture: ${key}`
            );

            return resolve({ key, base64: scene.textures.getBase64(key) });
        }

        const totalTexture = scene.add.renderTexture(0, 0, width, height);

        totalTexture.draw(container);

        totalTexture.snapshot((element) => {
            const base64 = (element as HTMLImageElement).getAttribute("src");
            scene.textures.addBase64(key, base64);

            totalTexture.destroy();

            setTimeout(() => {
                resolve({ key, base64: scene.textures.getBase64(key) });
            }, 100);
        });
    });
}

export function createXML(data: {
    filename: string;
    objArray: Phaser.GameObjects.Text[];
    maxHeight: number;
    fontFamily: string;
    fontSize: number;
    strokeSize: number;
}) {
    const { filename, objArray, maxHeight, fontFamily, fontSize, strokeSize } =
        data;

    const keys = objArray.map((obj) => {
        // Test Generate Data Array
        return {
            "@": {
                id: obj.text.charCodeAt(0),
                char: obj.text,
                x: obj.x,
                y: obj.y,
                width: obj.width,
                height: obj.height,
                xoffset: "0",
                yoffset: maxHeight - obj.height,
                xadvance: obj.width,
                page: "0",
                chnl: "15",
            },
        };
    });

    return js2xmlparser.parse(
        "font",
        {
            info: {
                "@": {
                    face: fontFamily,
                    size: fontSize,
                    bold: "0",
                    italic: "0",
                    charset: "",
                    unicode: "1",
                    stretchH: "100",
                    smooth: "0",
                    aa: "1",
                    padding: "0,0,0,0",
                    spacing: "0,0",
                    outline: String(strokeSize),
                },
            },
            common: {
                "@": {
                    lineHeight: maxHeight,
                    base: maxHeight,
                    scaleW: "512",
                    scaleH: "512",
                    pages: "1",
                    packed: "0",
                    alphaChnl: "0",
                    redChnl: "4",
                    greenChnl: "4",
                    blueChnl: "4",
                },
            },
            pages: {
                pages: {
                    "@": {
                        id: "0",
                        file: filename,
                    },
                },
            },
            chars: {
                "@": {
                    count: keys.length,
                },
                char: keys,
            },
        },
        {
            format: {
                doubleQuotes: true,
            },
        }
    );
}

export function downloadBlob(data: any, filename: string, type: string) {
    const file = new Blob([data], { type: type });

    const a = document.createElement("a");
    const url = URL.createObjectURL(file);

    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();

    setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

export function downloadLink(href: any, filename: string, type: string) {
    const a = document.createElement("a");

    a.href = href;
    a.download = filename;

    document.body.appendChild(a);
    a.click();

    setTimeout(function () {
        document.body.removeChild(a);
    }, 0);
}
