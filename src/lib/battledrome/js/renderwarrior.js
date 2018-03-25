RenderWarrior = {
    base_width: 300,
    base_height: 448,
    files: [
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
    ],
    images: {},

    render: async (elementId, warriorData) => {
        var warriorImg = document.getElementById(elementId);
        var context = warriorImg.getContext("2d");
        var g = "";
        context.imageSmoothingEnabled = false;
        if(warriorData.gender<0.5){
            g = "m";
        }else{
            g = "f";
        }
        while(RenderWarrior.incomplete()) {
            await RenderWarrior.sleep(100);
        }
        //Clear the canvas:
        context.clearRect(0, 0, warriorImg.width, warriorImg.height);

        //Render Layers
        RenderWarrior.renderLayer(context,warriorImg.width,warriorImg.height,g,"base",warriorData.skintone);
        RenderWarrior.renderLayer(context,warriorImg.width,warriorImg.height,g,"weapon",warriorData.weapontype);
        RenderWarrior.renderLayer(context,warriorImg.width,warriorImg.height,g,"armor",warriorData.armortype);
        if(warriorData.shieldtype>0) RenderWarrior.renderLayer(context,warriorImg.width,warriorImg.height,g,"shield",warriorData.shieldtype);
        RenderWarrior.renderLayer(context,warriorImg.width,warriorImg.height,g,"mouth",warriorData.mouth);
        RenderWarrior.renderLayer(context,warriorImg.width,warriorImg.height,g,"eyes",warriorData.eyes);
        RenderWarrior.renderLayer(context,warriorImg.width,warriorImg.height,g,"nose",warriorData.nose);
        RenderWarrior.renderLayer(context,warriorImg.width,warriorImg.height,g,"hair",warriorData.hair);

        //Do the color shifting:
        var newHue = warriorData.color;
        var tHSV = [334,95,75];
        var tolHSV = [40,40,50];
        var newHSV = [newHue,60,0];
        RenderWarrior.shiftHue(context,RenderWarrior.base_width,RenderWarrior.base_height,tHSV,newHSV,tolHSV);
    },

    renderLayer: function (context,width,height,gender_char,layer_name,data) {
        if(data!=undefined){
            var imageName = gender_char+"_"+layer_name+"_"+data;
            //console.log("Rendering "+imageName);
            var img = RenderWarrior.images[imageName].image;
            context.drawImage(img,0,0,img.width,img.height,0,0,width,height);
        }else{
            console.log("Undefined Render Data For:"+layer_name);
        }
    },

    precache: async () => {
        $.each(RenderWarrior.files, function (index, fileName) {
            var fileBaseName = fileName.split(".")[0];
            var img = {
                image: new Image(),
                loaded: false
            };
            img.image.width = RenderWarrior.base_width;
            img.image.height = RenderWarrior.base_height;            
            img.image.onload = function() {
                img.loaded = true;
            }
            img.image.src = '/images/warrior/'+fileName;
            RenderWarrior.images[fileBaseName] = img;
        });
    },

    incomplete: function () {
        return RenderWarrior.files.length != Object.keys(RenderWarrior.images).length || Object.keys(RenderWarrior.images).find(function(key){
            return !RenderWarrior.images[key].loaded;
        });
    },

    sleep: function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    HSVTORGB: function (hsv) {
        var rgb = [];
        var h = hsv[0];
        var s = hsv[1];
        var v = hsv[2];
    
        // The HUE should be at range [0, 1], convert 1.0 to 0.0 if needed.
        if (h >= 1.0) h -= 1.0;
    
        h *= 6.0;
        var index = Math.floor(h);
    
        var f = h - index;
        var p = v * (1.0 - s);
        var q = v * (1.0 - s * f);
        var t = v * (1.0 - s * (1.0 - f));
    
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
        }
    },

    RGB2HSV: function (r, g, b) {
        var hsv = [];
        var K = 0.0,
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
        var chroma = r - (g < b ? g : b);
        hsv[0] = Math.abs(K + (g - b) / (6.0 * chroma + 1e-20));
        hsv[1] = chroma / (r + 1e-20);
        hsv[2] = r;
        return hsv;
    },
    
    shiftHue: function (context, width, height, tgtHSV, newHSV, tolHSV) {
        // normalize inputs
        var normalTargetHue = tgtHSV[0] / 360;
        var normalTargetSat = tgtHSV[1] / 100;
        var normalTargetVal = tgtHSV[2];
        var normalNewHue = newHSV[0] / 360;
        var normalNewSat = newHSV[1] / 100;
        var normalNewVal = newHSV[2];
        var normalToleranceHue = tolHSV[0] / 360;
        var normalToleranceSat = tolHSV[1] / 100;
        var normalToleranceVal = tolHSV[2];

        //Setup Image Data
        var imgData = context.getImageData(0, 0, width, height);
        var data = imgData.data;
        var lastIndex = width * height * 4;
        var rgb = [0, 0, 0];
        var hsv = [0.0, 0.0, 0.0];

        // Scan the pixels:
        for (var i = 0; i < lastIndex; i += 4) {
            // retrieve r,g,b (! ignoring alpha !) 
            var r = data[i];
            var g = data[i + 1];
            var b = data[i + 2];
            
            // convert to hsv
            hsv = RenderWarrior.RGB2HSV(r, g, b);
            // change color if hue near enough from tgtHue
            var hueDelta = hsv[0] - normalTargetHue;
            var satDelta = hsv[1] - normalTargetSat;
            var valDelta = hsv[2] - normalTargetVal;
            if (Math.abs(hueDelta) < normalToleranceHue && Math.abs(satDelta) < normalToleranceSat) {
                // adjust hue

                hsv[0] = normalNewHue + hueDelta;
                hsv[1] = normalNewSat + satDelta;
                hsv[2] = normalNewVal + valDelta;

                // clamp hsv to valid range:
                hsv[0] = Math.min(Math.max(hsv[0],0),1);
                //hsv[1] = Math.min(Math.max(hsv[0],0),1);
                //hsv[2] = Math.min(Math.max(hsv[0],0),1);

                // convert back to rgb
                rgb = RenderWarrior.HSVTORGB(hsv);
                
                // store
                data[i] = rgb[0];
                data[i + 1] = rgb[1];
                data[i + 2] = rgb[2];
            }
        }
        context.putImageData(imgData, 0, 0);
    }
    
};
