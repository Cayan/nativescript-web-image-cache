/**
 * Created by sumeet on 17-06-2016.
 */
var imageCommon = require("./WebImageCache-common"),
    application = require("application"),
    enums = require("ui/enums"),
    types = require("utils/types"),
    utils = require("utils/utils"),
    fs = require("file-system"),
    appSettings = require("application-settings"),
    isInitialized = false;


var stretchMapping = {};

stretchMapping[enums.Stretch.aspectFit] = com.facebook.drawee.drawable.ScalingUtils.ScaleType.FIT_CENTER;
stretchMapping[enums.Stretch.aspectFill] = com.facebook.drawee.drawable.ScalingUtils.ScaleType.CENTER_CROP;
stretchMapping[enums.Stretch.fill] = com.facebook.drawee.drawable.ScalingUtils.ScaleType.FIT_XY;
stretchMapping[enums.Stretch.none] = com.facebook.drawee.drawable.ScalingUtils.ScaleType.CENTER;

global.moduleMerge(imageCommon, exports);

var ProxyBaseControllerListener = com.facebook.drawee.controller.BaseControllerListener.extend({
    _NSCachedImage: undefined,
    setNSCachedImage: function (img) {
        this._NSCachedImage = img;
    },
    onFinalImageSet: function (id, imageInfo, anim) {
        if (undefined != this._NSCachedImage) {
            this._NSCachedImage.isLoading = false;
        }
    },
    onIntermediateImageSet: function (id, imageInfo) {

    }, onFailure: function (id, throwable) {

    }
});

import { View, Property } from 'ui/core/view';

import { elementRegistry } from 'nativescript-angular/element-registry';

import { WebImageBase, srcProperty } from './WebImageCache-common';

declare var com: any;
declare var android: any;

export class WebImage extends WebImageBase {
    public rounded;
    public placeholderStretch;
    public placeholder;
    public stretch;

    public createNativeView() {
        const draweeView = new com.facebook.drawee.view.SimpleDraweeView(this.context);
        draweeView.getHierarchy().setActualImageScaleType(com.facebook.drawee.drawable.ScalingUtils.ScaleType.CENTER);
        if (undefined !== this.src) {
            this.setSource(this.src);
        }
        if (undefined !== this.stretch) {
            this.setNativeStretch(this.stretch);
        }
        if (undefined !== this.rounded) {
            this.setRounded(this.rounded);
        }
        if (undefined !== this.placeholder) {
            this.setPlaceholder(this.placeholder, this.placeholderStretch);
        }
    };

    public setSource(value) {
        this.android.setImageURI(null, null);
        if (!types.isString(value)) {
            return;
        }

        value = value.trim();
        if (!utils.isFileOrResourcePath(value) && 0 !== value.indexOf("http")) {
            throw new Error("Path \"" + "\" is not a valid file or resource.");
        }

        this.isLoading = true;
        var fileName = "";
        if (0 === value.indexOf("~/")) {
            fileName = fs.path.join(fs.knownFolders.currentApp().path, value.replace("~/", ""));
            fileName = "file:" + fileName;
        } else if (0 == value.indexOf("res")) {
            fileName = value;
            var res = utils.ad.getApplicationContext().getResources();
            var resName = fileName.substr(utils.RESOURCE_PREFIX.length);
            var identifier = res.getIdentifier(resName, 'drawable', utils.ad.getApplication().getPackageName());
            fileName = "res:/" + identifier;
        } else if (0 === value.indexOf("http")) {
            this.isLoading = true;
            fileName = value;
        }

        this.android.setImageURI(android.net.Uri.parse(fileName), null);

        var controllerListener = new ProxyBaseControllerListener();
        controllerListener.setNSCachedImage(this);

        var controller = com.facebook.drawee.backends.pipeline.Fresco.newDraweeControllerBuilder().
            setControllerListener(controllerListener)
            .setUri(android.net.Uri.parse(fileName))
            .build();
        this.android.setController(controller);

        this.requestLayout();
    }

    public setNativeStretch(stretch) {
        const draweeView = new com.facebook.drawee.view.SimpleDraweeView(this.context);

        var frescoStretch = stretchMapping[stretch] || com.facebook.drawee.drawable.ScalingUtils.ScaleType.CENTER;
        draweeView.getHierarchy().setActualImageScaleType(frescoStretch);
        /*switch (stretch) {
            case enums.Stretch.aspectFit:
                draweeHierarchy.setActualImageScaleType(com.facebook.drawee.drawable.ScalingUtils.ScaleType.FIT_CENTER);
                break;
            case enums.Stretch.aspectFill:
                draweeHierarchy.setActualImageScaleType(com.facebook.drawee.drawable.ScalingUtils.ScaleType.CENTER_CROP);
                break;
            case enums.Stretch.fill:
                draweeHierarchy.setActualImageScaleType(com.facebook.drawee.drawable.ScalingUtils.ScaleType.FIT_XY);
                break;
            case enums.Stretch.none:
            default:
                draweeHierarchy.setActualImageScaleType(com.facebook.drawee.drawable.ScalingUtils.ScaleType.CENTER);
                break;
        }*/
    }

    public setRounded(rounded) {
        const draweeView = new com.facebook.drawee.view.SimpleDraweeView(this.context);

        var roundingParams = new com.facebook.drawee.generic.RoundingParams.fromCornersRadius(0);
        if (rounded) {
            roundingParams.setRoundAsCircle(true);
        } else {
            roundingParams.setRoundAsCircle(false);
        }

        draweeView.getHierarchy().setRoundingParams(roundingParams);
    }

    public setPlaceholder(src, placeholderStretch) {
        const draweeView = new com.facebook.drawee.view.SimpleDraweeView(this.context);

        var drawable = this.getPlaceholderImageDrawable(src),
        nativePlaceholderStretch = stretchMapping[placeholderStretch] || com.facebook.drawee.drawable.ScalingUtils.ScaleType.CENTER;

        if (null == drawable) {
            return;
        }

        draweeView.getHierarchy().setPlaceholderImage(drawable, nativePlaceholderStretch);
    }

    public static initiialize() {
        com.facebook.drawee.backends.pipeline.Fresco.initialize(application.android.context);
    }

    public static initializeOnAngular() {
        if (false !== isInitialized) {
            return;
        }

        elementRegistry.registerElement("WebImage", function () {
            return require("nativescript-web-image-cache").WebImage;
        });
        this.initiialize();
        isInitialized = true;
    };

    public static setCacheLimit(numberOfDays) {
        const noOfSecondsInAMinute = 60;
        const noOfMinutesInAHour = 60;
        const noOfHoursInADay = 24;
        const noOfSecondsADay = noOfSecondsInAMinute * noOfMinutesInAHour * noOfHoursInADay;
        const noOfSecondsInDays = noOfSecondsADay * numberOfDays;

        let currentSeconds = Math.round(new Date().getTime() / 1000);

        if (true == appSettings.getBoolean("isAppOpenedFirstTime") || undefined == appSettings.getBoolean("isAppOpenedFirstTime") || null == appSettings.getBoolean("isAppOpenedFirstTime")) {
            appSettings.setBoolean("isAppOpenedFirstTime", false);
            this.clearCache();
            appSettings.setNumber("cacheTimeReference", currentSeconds);
        } else {
            let referenceTime = appSettings.getNumber("cacheTimeReference");
            if (null == referenceTime || undefined == referenceTime) {
                appSettings.setNumber("cacheTimeReference", currentSeconds);
            } else if ((currentSeconds - referenceTime) > noOfSecondsInDays) {
                this.clearCache();
                appSettings.setNumber("cacheTimeReference", currentSeconds);
            }
        }
    }

    public static clearCache() {
        com.facebook.drawee.backends.pipeline.Fresco.getImagePipeline().clearCaches();
    };

    protected getPlaceholderImageDrawable(value) {
        if (!types.isString(value)) {
            return null;
        }

        value = value.trim();
        if (!utils.isFileOrResourcePath(value)) {
            return null;
        }

        if (0 === value.indexOf("~/")) {
            let fileName = fs.path.join(fs.knownFolders.currentApp().path, value.replace("~/", ""));
            return android.graphics.drawable.Drawable.createFromPath(fileName)
        }
        
        if (0 == value.indexOf("res")) {
            let fileName = value;
            let res = utils.ad.getApplicationContext().getResources();
            let resName = fileName.substr(utils.RESOURCE_PREFIX.length);
            let identifier = res.getIdentifier(resName, 'drawable', utils.ad.getApplication().getPackageName());
            return res.getDrawable(identifier);
        }

        return null;
    }

    [srcProperty.setNative](value: any) {
        this.setSource(value);
    }
}

export const roundedProperty = new Property<WebImage, number>({
    name: "rounded",
    affectsLayout: true,
    valueChanged: (image, oldValue, newValue) => {
        image.setRounded(newValue);
    }
});
roundedProperty.register(WebImage);

export const placeholderStretchProperty = new Property<WebImage, number>({
    name: "placeholderStretch",
    affectsLayout: true
});
placeholderStretchProperty.register(WebImage);

export const placeholderProperty = new Property<WebImage, number>({
    name: "placeholder",
    affectsLayout: true,
    valueChanged: (image, oldValue, newValue) => {
        image.setPlaceholder(newValue);
    }
});
placeholderProperty.register(WebImage);

export const stretchProperty = new Property<WebImage, number>({
    name: "stretch",
    affectsLayout: true,
    valueChanged: (image, oldValue, newValue) => {
        image.setNativeStretch(newValue);
    }
    // WebImage.stretchProperty = new dependencyObservable.Property(STRETCH, IMAGE, new proxy.PropertyMetadata(com.facebook.drawee.drawable.ScalingUtils.ScaleType.CENTER, AffectsLayout,onStretchPropertyChanged));
});
stretchProperty.register(WebImage);
