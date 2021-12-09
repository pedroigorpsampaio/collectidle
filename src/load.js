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
        if (e.data.cmd === "loadMap") {
            // progress
            var PROGRESS_BOARD_LOAD = 0;
            // get params
            const rows = e.data.rows; const columns = e.data.columns; const defaultValue = e.data.defaultValue;
            // creates game array as one dimension for faster message transfer
            const tiles = new Uint8Array(rows*columns);
            // count for the progress calculation
            var count = 0;

            // fills array with default value
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < columns; j++) {
                    tiles[count] = defaultValue;
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
            // send the newly created board
            self.postMessage({cmd:'receiveBoard', tiles: tiles.buffer}, [tiles.buffer]); // eslint-disable-line no-restricted-globals
            //self.postMessage(tiles.buffer, [tiles.buffer]); // eslint-disable-line no-restricted-globals
        }
    };
};

let code = workercode.toString();
code = code.substring(code.indexOf("{") + 1, code.lastIndexOf("}"));

const blob = new Blob([code], { type: "application/javascript" });
const worker_script = URL.createObjectURL(blob);

export function getWorkerScript() { return worker_script }


// returns board creation progress
//export function getProgressBoardLoad() { return PROGRESS_BOARD_LOAD; }