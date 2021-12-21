/**
 * Worker listener for loading tasks
 */
const workercode = () => {
    onmessage = function (e) {
        /**
         * Creates a new game board represented by a 2d array
         * @param rows The number of rows for the array
         * @param columns The number of columns for the array
         * @param defaultValue The default value for each field (0 for empty)
         * @returns The newly created multidimensional array populated with the initial disposition of the board
         */
        if (e.data.cmd === "loadNewGame") {
            // progress
            var PROGRESS_BOARD_LOAD = 0;
            // get params
            const rows = e.data.rows; const columns = e.data.columns; const defaultValue = e.data.defaultValue;
            // creates game tile and resource array as one dimension for faster message transfer
            const tiles = new Int8Array(rows*columns);
            const resources = [];
            // count for the progress calculation
            var count = 0;

            // fills array with default value
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < columns; j++) {
                    tiles[count] = defaultValue;
                    resources[count] = -1;//new Resource({i: i, j: j, id: 0, img: "0_3.png", birth: performance.now(), life: 10, maxLife: 10});
                    // updates count
                    count++;
                    // send message to main UI thread in case progress changes
                    let cProgress =  Math.round(100 * (count / (rows * columns)));
                    if(cProgress !== PROGRESS_BOARD_LOAD)
                        self.postMessage({'cmd': 'updateProgress', 'progress' : cProgress}); // eslint-disable-line no-restricted-globals
                    // updates loading progress
                    PROGRESS_BOARD_LOAD = cProgress;
                }
            }
            // send the newly created game
            self.postMessage({cmd:'loadNewComplete', tiles: tiles.buffer, resources: JSON.stringify(resources)},  // eslint-disable-line no-restricted-globals
                                [tiles.buffer]); // eslint-disable-line no-restricted-globals
            //self.postMessage(tiles.buffer, [tiles.buffer]); // eslint-disable-line no-restricted-globals
        }
    };
    // class Resource {
    //     i = -1;  // current i position of resource
    //     j = -1; // current j position of resource
    //     id = -1; // id of resource
    //     img = null; // image name of resource
    //     birth = -1; // the timestamp of the birth of this resource
    //     life = -1; // the current life of this resource (depleted when <= 0)
    //     maxLife = -1; // the max life of resource
    
    //     // constructor just sets the values received in params
    //     constructor(params = {i:-1, j:-1, id:-1, img:null, birth:-1, life:-1, maxLife:-1}) {
    //         this.i = params.i; this.j = params.j; this.id = params.id; this.maxLife = params.maxLife;
    //         this.img = params.img; this.birth = params.birth; this.life = params.life;
    //     }
    
    //     // sets whole data set of resource
    //     set(params = {i:-1, j:-1, id:-1, img:null, birth:-1, life:-1, maxLife:-1}) {
    //         this.i = params.i; this.j = params.j; this.id = params.id; this.maxLife = params.maxLife;
    //         this.img = params.img; this.birth = params.birth; this.life = params.life;
    //     }
    //  }
};

let code = workercode.toString();
code = code.substring(code.indexOf("{") + 1, code.lastIndexOf("}"));

const blob = new Blob([code], { type: "application/javascript" });
const worker_script = URL.createObjectURL(blob);

export function getWorkerScript() { return worker_script }


// returns board creation progress
//export function getProgressBoardLoad() { return PROGRESS_BOARD_LOAD; }