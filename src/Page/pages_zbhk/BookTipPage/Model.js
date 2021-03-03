import {AbstractModel} from "../../../Abstract/scene/AbstractModel"
class Model extends AbstractModel {
    constructor() {
        super();
    }

    modelUpdateData(args){
        super.modelUpdateData(args);
        args.callback();
    }
    
}
export const model = new Model();
export default { model }