/**
 * Resource class for resource data
 */
 export default class Resource {
    i = -1;  // current i position of resource
    j = -1; // current j position of resource
    id = -1; // id of resource
    img = null; // image name of resource
    birth = -1; // the timestamp of the birth of this resource
    life = -1; // the current life of this resource (depleted when <= 0)
    maxLife = -1; // the max life of resource

    // constructor just sets the values received in params
    constructor(params = {i:-1, j:-1, id:-1, img:null, birth:-1, life:-1, maxLife:-1}) {
        this.i = params.i; this.j = params.j; this.id = params.id; this.maxLife = params.maxLife;
        this.img = params.img; this.birth = params.birth; this.life = params.life;
    }

    // sets whole data set of resource
    set(params = {i:-1, j:-1, id:-1, img:null, birth:-1, life:-1, maxLife:-1}) {
        this.i = params.i; this.j = params.j; this.id = params.id; this.maxLife = params.maxLife;
        this.img = params.img; this.birth = params.birth; this.life = params.life;
    }
 }