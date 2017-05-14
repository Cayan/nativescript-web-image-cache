/**
 * Created by sumeet on 17-06-2016.
 */
import { View, Property } from 'ui/core/view';

export class WebImageBase extends View {
    public src;
    public isLoading;
}

export const srcProperty = new Property<WebImageBase, string>({
    name: "src",
    // undefined
});
srcProperty.register(WebImageBase);

export const isLoadingProperty = new Property<WebImageBase, string>({
    name: "isLoading",
    // true
});
isLoadingProperty.register(WebImageBase);
