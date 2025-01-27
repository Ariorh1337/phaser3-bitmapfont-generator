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

/**
 * A function to easily create a gradient with settings like in Photoshop
 * @param {Phaser.GameObjects.Text} textElm Phaser text element
 * @param {Array<{ color: string; percent: number }>} options color options such as color and fill percentage
 * @param {} [multiLine=true] use multiline logic while gradient fill
 * @param {number} [angle=-90] top to bottom gradient angle by default (-90 photoshop)
 * @returns {CanvasGradient}
 */
export function makeGradient(
    textElm: Phaser.GameObjects.Text,
    options: Array<{ color: string; percent: number }>,
    multiLine = true,
    angle = 0
) {
    if (options.length < 2) throw new Error("at least two colors are expected");

    const width = textElm.width;
    const height = textElm.height;

    const font = Number(textElm.style.fontSize.replace("px", ""));
    const lines = multiLine ? Math.floor(height / font) || 1 : 1;

    const descent = (textElm.style as any).metrics.descent;
    const ascent = (textElm.style as any).metrics.ascent;

    const rect = new Phaser.Geom.Rectangle(
        0,
        descent * lines,
        width,
        (ascent - descent) * lines
    );

    //Rotation part start
    angle = angle + 45; //this is to support legacy code
    const sides = Array.from({ length: 4 }, (item, index) => {
        return Phaser.Geom.Rectangle.PerimeterPoint(rect, angle + 90 * index);
    });
    const line = new Phaser.Geom.Line(
        Math.min(...sides.map((s) => s.x)),
        Math.min(...sides.map((s) => s.y)),
        Math.max(...sides.map((s) => s.x)),
        Math.max(...sides.map((s) => s.y))
    );
    Phaser.Geom.Line.Rotate(line, Phaser.Math.DegToRad(angle));
    //Rotation part end

    const gradient = textElm.context.createLinearGradient(
        line.x1,
        line.y1,
        line.x2,
        line.y2
    );

    const lineHeight = (1 / lines) * 0.95;
    const lineBreakHeight = 1 / lines - lineHeight;

    const prepareOptions = Array.from({ length: lines }, (item, index) => {
        const breaker = (value) => {
            return {
                length: lineBreakHeight,
                percent: value,
                color: "#000",
            };
        };

        const result = [] as Array<{
            color: string;
            percent: number;
            length: number;
        }>[];

        result.push(
            options.map((option: any) => {
                option.length = lineHeight;
                return option;
            })
        );

        if (index + 1 !== lines) {
            result.push([breaker(0), breaker(100)]);
        }

        return result;
    }).flat();

    const result = [] as Array<{ value: number; color: string }>;
    let i = 0;
    prepareOptions.forEach((optionArr) => {
        i += optionArr.reduce((reducer, option) => {
            const value = Phaser.Math.FromPercent(
                option.percent / 100,
                0,
                option.length
            );

            result.push({
                value: i + value,
                color: option.color,
            });

            return value;
        }, 0);
    });

    result.forEach((option) => {
        gradient.addColorStop(option.value, option.color);
    });

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
    objArray: [
        {
            text: string;
            x: number;
            y: number;
            width: number;
            height: number;
        }
    ];
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
