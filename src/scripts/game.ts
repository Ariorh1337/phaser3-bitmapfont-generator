import "phaser";
import Main from "./scenes/Main";
import { event } from "./util/globals";

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
    gradientUI();

    new Phaser.Game(config);
});

function gradientUI() {
    function createLine() {
        const color_value = (document.querySelector("#gradientColor") as any)
            .value;
        const percent_value = (document.querySelector("#gradientValue") as any)
            .value;

        const line = document.createElement("div");

        line.classList.add("gradientLine");

        line.setAttribute("name", "gradientLine");
        line.setAttribute("data-color", color_value);
        line.setAttribute("data-percent", percent_value);

        const color = document.createElement("span");
        color.textContent = color_value;
        color.style.borderLeft = `20px solid ${color_value}`;

        const percent = document.createElement("span");
        percent.textContent = percent_value;

        const remove = document.createElement("button");
        remove.textContent = "x";
        remove.classList.add("btn");
        remove.classList.add("btn-primary");
        remove.onclick = () => {
            event.emit("need_update");
            line.remove();
        };

        line.appendChild(color);
        line.appendChild(percent);
        line.appendChild(remove);

        return line;
    }

    const getId = (id: string) => {
        return document.querySelector(id) as any;
    };

    getId("#gradientAdd").addEventListener("click", () => {
        const line = createLine();
        getId("#gradientList").appendChild(line);
        event.emit("need_update");
    });

    ["gradientColor", "fontColor", "backColor", "strokeColor"].forEach((id) => {
        getId(`#${id}2`)?.addEventListener("change", () => {
            if (getId(`#${id}2`).value === getId(`#${id}`).value) return;
            getId(`#${id}`).value = getId(`#${id}2`).value;
            getId(`#${id}`).dispatchEvent(new CustomEvent("change"));
        });
        getId(`#${id}`)?.addEventListener("change", () => {
            if (getId(`#${id}2`).value === getId(`#${id}`).value) return;
            getId(`#${id}2`).value = getId(`#${id}`).value;
            getId(`#${id}`).dispatchEvent(new CustomEvent("change"));
        });
    });
}
