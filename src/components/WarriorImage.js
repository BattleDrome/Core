import React, { Component } from 'react'

import './WarriorImage.css'

class WarriorImage extends Component {

    static defaultProps = {
        imageSmoothingEnabled: false,
        cosmeticData: {
            color: 180,
            gender: 0,
            skintone: 0,
            eyes: 0,
            nose: 0,
            mouth: 0,
            hair: 0,
            weapontype: 0,
            armortype: 0,
            shieldtype: 0
        }
    }

    static precache() {
        if (!window.warriorImageCachingBusy && !window.warriorImageCachingDone()) {
            console.log("Precaching Images")
            window.warriorImageCachingBusy = true;
            window.warriorImageFiles.forEach((fileName, index) => {
                var fileBaseName = fileName.split(".")[0];
                var img = {
                    image: new Image(),
                    loaded: false
                };
                img.image.width = window.warriorImageBaseWidth;
                img.image.height = window.warriorImageBaseHeight;
                img.image.onload = () => {
                    img.loaded = true;
                }
                img.image.src = '/images/warrior/' + fileName;
                window.cachedWarriorImages[fileBaseName] = img;
            })
        }
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    initializeGlobals() {
        if (!window.warriorRendererInitialized) {
            console.log("Initializing Warrior Renderer Globals...")
            window.warriorRendererInitialized = true
            window.cachedWarriorImages = {}
            window.warriorImageCachingBusy = false
            window.warriorImageFiles = [
                "f_armor_0.png",
                "f_armor_1.png",
                "f_armor_2.png",
                "f_armor_3.png",
                "f_base_0.png",
                "f_base_1.png",
                "f_base_2.png",
                "f_base_3.png",
                "f_eyes_0.png",
                "f_eyes_1.png",
                "f_eyes_2.png",
                "f_eyes_3.png",
                "f_eyes_4.png",
                "f_eyes_5.png",
                "f_hair_0.png",
                "f_hair_1.png",
                "f_hair_2.png",
                "f_hair_3.png",
                "f_hair_4.png",
                "f_hair_5.png",
                "f_mouth_0.png",
                "f_mouth_1.png",
                "f_mouth_2.png",
                "f_mouth_3.png",
                "f_mouth_4.png",
                "f_mouth_5.png",
                "f_nose_0.png",
                "f_nose_1.png",
                "f_nose_2.png",
                "f_nose_3.png",
                "f_nose_4.png",
                "f_nose_5.png",
                "f_shield_1.png",
                "f_shield_2.png",
                "f_shield_3.png",
                "f_weapon_0.png",
                "f_weapon_1.png",
                "f_weapon_2.png",
                "f_weapon_3.png",
                "f_weapon_4.png",
                "f_weapon_5.png",
                "f_weapon_6.png",
                "f_weapon_7.png",
                "f_weapon_8.png",
                "f_weapon_9.png",
                "m_armor_0.png",
                "m_armor_1.png",
                "m_armor_2.png",
                "m_armor_3.png",
                "m_base_0.png",
                "m_base_1.png",
                "m_base_2.png",
                "m_base_3.png",
                "m_eyes_0.png",
                "m_eyes_1.png",
                "m_eyes_2.png",
                "m_eyes_3.png",
                "m_eyes_4.png",
                "m_eyes_5.png",
                "m_hair_0.png",
                "m_hair_1.png",
                "m_hair_2.png",
                "m_hair_3.png",
                "m_hair_4.png",
                "m_hair_5.png",
                "m_mouth_0.png",
                "m_mouth_1.png",
                "m_mouth_2.png",
                "m_mouth_3.png",
                "m_mouth_4.png",
                "m_mouth_5.png",
                "m_nose_0.png",
                "m_nose_1.png",
                "m_nose_2.png",
                "m_nose_3.png",
                "m_nose_4.png",
                "m_nose_5.png",
                "m_shield_1.png",
                "m_shield_2.png",
                "m_shield_3.png",
                "m_weapon_0.png",
                "m_weapon_1.png",
                "m_weapon_2.png",
                "m_weapon_3.png",
                "m_weapon_4.png",
                "m_weapon_5.png",
                "m_weapon_6.png",
                "m_weapon_7.png",
                "m_weapon_8.png",
                "m_weapon_9.png"
            ]
            window.warriorImageBaseWidth = 300
            window.warriorImageBaseHeight = 448
            window.warriorImageCachingDone = () => {
                return window.warriorImageFiles.length === Object.keys(window.cachedWarriorImages).length && !Object.keys(window.cachedWarriorImages).find(function (key) {
                    return !window.cachedWarriorImages[key].loaded;
                })
            }
        }
    }

    constructor(props) {
        super(props)
        this.initializeGlobals()
        WarriorImage.precache()
    }

    async renderWarrior() {
        //Initialize
        let warriorImg = this.refs.canvas
        let context = warriorImg.getContext("2d")
        let g = "";
        context.imageSmoothingEnabled = this.props.imageSmoothingEnabled;

        //Select Gender Prefix
        if (this.props.cosmeticData.gender < 0.5) {
            g = "m"
        } else {
            g = "f"
        }

        //Wait for Precache to complete
        while (!window.warriorImageCachingDone()) {
            await WarriorImage.sleep(100);
        }

        //Clear the current Canvas
        context.clearRect(0, 0, warriorImg.width, warriorImg.height)

        //Render Layers
        this.renderLayer(context, warriorImg.width, warriorImg.height, g, "base", this.props.cosmeticData.skintone);
        this.renderLayer(context, warriorImg.width, warriorImg.height, g, "weapon", this.props.cosmeticData.weapontype);
        this.renderLayer(context, warriorImg.width, warriorImg.height, g, "armor", this.props.cosmeticData.armortype);
        if (this.props.cosmeticData.shieldtype > 0) this.renderLayer(context, warriorImg.width, warriorImg.height, g, "shield", this.props.cosmeticData.shieldtype);
        this.renderLayer(context, warriorImg.width, warriorImg.height, g, "mouth", this.props.cosmeticData.mouth);
        this.renderLayer(context, warriorImg.width, warriorImg.height, g, "eyes", this.props.cosmeticData.eyes);
        this.renderLayer(context, warriorImg.width, warriorImg.height, g, "nose", this.props.cosmeticData.nose);
        this.renderLayer(context, warriorImg.width, warriorImg.height, g, "hair", this.props.cosmeticData.hair);

        //Do the color shifting:
        let newHue = this.props.cosmeticData.color;
        let tHSV = [334, 95, 75];
        let tolHSV = [40, 40, 50];
        let newHSV = [newHue, 60, 0];
        this.shiftHue(context, window.warriorImageBaseWidth, window.warriorImageBaseHeight, tHSV, newHSV, tolHSV);
    }

    renderLayer(context, width, height, gender_char, layer_name, data) {
        if (data !== undefined) {
            let imageName = gender_char + "_" + layer_name + "_" + data;
            let img = window.cachedWarriorImages[imageName].image;
            context.drawImage(img, 0, 0, img.width, img.height, 0, 0, width, height);
        } else {
            console.log("Undefined Render Data For:" + layer_name);
        }
    }

    HSVTORGB(hsv) {
        let rgb = [];
        let h = hsv[0];
        let s = hsv[1];
        let v = hsv[2];

        // The HUE should be at range [0, 1], convert 1.0 to 0.0 if needed.
        if (h >= 1.0) h -= 1.0;

        h *= 6.0;
        let index = Math.floor(h);

        let f = h - index;
        let p = v * (1.0 - s);
        let q = v * (1.0 - s * f);
        let t = v * (1.0 - s * (1.0 - f));

        switch (index) {
            case 0:
                rgb[0] = v;
                rgb[1] = t;
                rgb[2] = p;
                return rgb;
            case 1:
                rgb[0] = q;
                rgb[1] = v;
                rgb[2] = p;
                return rgb;
            case 2:
                rgb[0] = p;
                rgb[1] = v;
                rgb[2] = t;
                return rgb;
            case 3:
                rgb[0] = p;
                rgb[1] = q;
                rgb[2] = v;
                return rgb;
            case 4:
                rgb[0] = t;
                rgb[1] = p;
                rgb[2] = v;
                return rgb;
            case 5:
                rgb[0] = v;
                rgb[1] = p;
                rgb[2] = q;
                return rgb;
            default: //0
                rgb[0] = v;
                rgb[1] = t;
                rgb[2] = p;
                return rgb;

        }
    }

    RGB2HSV(r, g, b) {
        let hsv = [];
        let K = 0.0,
            swap = 0;
        if (g < b) {
            swap = g;
            g = b;
            b = swap;
            K = -1.0;
        }
        if (r < g) {
            swap = r;
            r = g;
            g = swap;
            K = -2.0 / 6.0 - K;
        }
        let chroma = r - (g < b ? g : b);
        hsv[0] = Math.abs(K + (g - b) / (6.0 * chroma + 1e-20));
        hsv[1] = chroma / (r + 1e-20);
        hsv[2] = r;
        return hsv;
    }

    shiftHue(context, width, height, tgtHSV, newHSV, tolHSV) {
        // normalize inputs
        let normalTargetHue = tgtHSV[0] / 360;
        let normalTargetSat = tgtHSV[1] / 100;
        let normalTargetVal = tgtHSV[2];
        let normalNewHue = newHSV[0] / 360;
        let normalNewSat = newHSV[1] / 100;
        let normalNewVal = newHSV[2];
        let normalToleranceHue = tolHSV[0] / 360;
        let normalToleranceSat = tolHSV[1] / 100;

        //Setup Image Data
        let imgData = context.getImageData(0, 0, width, height);
        let data = imgData.data;
        let lastIndex = width * height * 4;
        let rgb = [0, 0, 0];
        let hsv = [0.0, 0.0, 0.0];

        // Scan the pixels:
        for (let i = 0; i < lastIndex; i += 4) {
            // retrieve r,g,b (! ignoring alpha !) 
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // convert to hsv
            hsv = this.RGB2HSV(r, g, b);
            // change color if hue near enough from tgtHue
            let hueDelta = hsv[0] - normalTargetHue;
            let satDelta = hsv[1] - normalTargetSat;
            let valDelta = hsv[2] - normalTargetVal;
            if (Math.abs(hueDelta) < normalToleranceHue && Math.abs(satDelta) < normalToleranceSat) {
                // adjust hue

                hsv[0] = normalNewHue + hueDelta;
                hsv[1] = normalNewSat + satDelta;
                hsv[2] = normalNewVal + valDelta;

                // clamp hsv to valid range:
                hsv[0] = Math.min(Math.max(hsv[0], 0), 1);
                //hsv[1] = Math.min(Math.max(hsv[0],0),1);
                //hsv[2] = Math.min(Math.max(hsv[0],0),1);

                // convert back to rgb
                rgb = this.HSVTORGB(hsv);

                // store
                data[i] = rgb[0];
                data[i + 1] = rgb[1];
                data[i + 2] = rgb[2];
            }
        }
        context.putImageData(imgData, 0, 0);
    }

    componentDidMount() {
        this.renderWarrior()
    }

    render() {
        let compoundClass = "warrior-image " + this.props.className
        return (
            <canvas ref="canvas" className={compoundClass} width="300" height="448"></canvas>
        );
    }
}

export default WarriorImage
