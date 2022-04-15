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
        5,
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
