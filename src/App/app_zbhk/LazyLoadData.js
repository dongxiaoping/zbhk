import {AbstractLazyLoadData} from "../../Abstract/app/AbstractLazyLoadData";

class LazyLoadData extends AbstractLazyLoadData{
    constructor() {
        super();
    }

    start(){
        super.start();
    }
}

export const lazyLoadData = new LazyLoadData();
export default lazyLoadData;