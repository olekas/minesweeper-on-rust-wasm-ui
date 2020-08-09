import { MinesweeperBind} from "./wasm/minesweeper_on_rust";
import { memory } from "./wasm/minesweeper_on_rust_bg";

let game = null;

const MIN_GAME_GRID_ROWS = 8
const MIN_GAME_GRID_COLS = 8

const MIN_MINED_PERCENTAGE = 0.1;
const MAX_MINED_PERCENTAGE = 0.9;
let DEFAULT_MINED_PERCENTAGE = 0.4;

const PIXELS_PER_REM = parseFloat(getComputedStyle(document.documentElement).fontSize);

const grid = document.querySelector(".grid-container");
const labelCountDown = document.querySelector("#count-down-value");
const inputNumRows = document.querySelector("#rows-value");
const inputNumCols = document.querySelector("#cols-value");
const inputPercentageMined = document.querySelector("#mined-pers-value");
const btnReplay = document.querySelector("#game-btn-replay");
const btnRecreate = document.querySelector("#game-btn-recreate");

const adaptToScreenSize = function(){
    inputNumRows.max = Math.floor(window.innerHeight / (2*PIXELS_PER_REM+4))-1
    inputNumCols.max = Math.floor(window.innerWidth / (2*PIXELS_PER_REM+4))-1

    if (inputNumRows.value < inputNumRows.min) {
        inputNumRows.value = inputNumRows.min
    }

    if (inputNumRows.value > inputNumRows.max) {
        inputNumRows.value = inputNumRows.max
    }

    if (inputNumCols.value < inputNumCols.min) {
        inputNumCols.value = inputNumCols.min
    }

    if (inputNumCols.value > inputNumCols.max) {
        inputNumCols.value = inputNumCols.max
    }
}

const initGameScreen = function() {
    inputNumRows.min = MIN_GAME_GRID_ROWS
    inputNumCols.min = MIN_GAME_GRID_COLS

    inputPercentageMined.min = Math.floor(MIN_MINED_PERCENTAGE*100);
    inputPercentageMined.max = Math.floor(MAX_MINED_PERCENTAGE*100);
    inputPercentageMined.value = Math.floor(DEFAULT_MINED_PERCENTAGE*100);

    adaptToScreenSize();

    inputNumRows.value = Math.floor(inputNumRows.max * 0.7);
    inputNumCols.value = Math.floor(inputNumCols.max * 0.7);

    createNewGame()
}

const createNewGame = function() {
    let grid_rows = inputNumRows.value;
    let grid_cols = inputNumCols.value;
    let mined_percentage = inputPercentageMined.value/100.0;

    game = MinesweeperBind.new(grid_rows, grid_cols, mined_percentage);
    buildGameGrid();
    labelCountDown.value = game.count_remaining_cells();
}

const replayGame = function() {
    game.replay();
    buildGameGrid();
    labelCountDown.value = game.count_remaining_cells();
}

const onFlagCell = function(e) {
    if (e.target.classList.contains("cell")) {
        const row = e.target.dataset.row;
        const col = e.target.dataset.col;
        var update = game.cell_toggle_flag(row, col);
        var i;
        for (i = 0; i < update.length;) {
            updateCell(update[i++], update[i++]);
        }
        
        e.preventDefault();
    }

}

const onDigCell = function(e) {
    if (e.target.classList.contains("cell")) {
        const row = e.target.dataset.row;
        const col = e.target.dataset.col;
        var update = game.cell_dig(row, col);
        labelCountDown.value = game.count_remaining_cells();
        var i;
        for (i = 0; i < update.length;) {
            updateCell(update[i++], update[i++], row, col);
        }
        if (game.is_over()) {
            if (game.is_victory()) {
                grid.className = "grid-container game-win";            
            } else {
                grid.className = "grid-container game-lose";
            }
        }
        e.preventDefault();
    }
}


const updateCell = function(row, col, current_row=null, current_col=null) {
    const cell = grid.querySelector(`#cell_${row}x${col}`);
    if (!game.is_cell_hidden(row, col)) {
        if (game.is_cell_mined(row, col)) {
            if (row == current_row && col == current_col) {
                cell.className = "cell cell-explosion";
            } else {
                cell.className = "cell cell-mined";
            }
        } else {
            cell.className = "cell cell-digged";
            const neighbors = game.count_cell_neighbors(row, col);
            cell.className = `cell cell-digged${neighbors}`;
        }
    } else if (game.is_cell_flagged(row, col)) {
        cell.className = "cell cell-flagged";
    } else {
        cell.className = "cell cell-hidden";
    }
}

const buildGameGrid = function (num_rows, num_cols) {
    grid.innerHTML = "";
    grid.className = "grid-container";
    for (var i = 0; i < game.get_num_rows(); i++) {
        var row = document.createElement("div");
        row.classList.add("row-container");
        for (var j = 0; j < game.get_num_cols(); j++) {
            var cell = document.createElement("div");
            cell.id = `cell_${i}x${j}`;
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.classList.add("cell");
            cell.classList.add("cell-hidden");
            row.appendChild(cell);        
        }
        grid.appendChild(row);  
    } 
}

window.addEventListener('resize', adaptToScreenSize)
btnRecreate.addEventListener('click', createNewGame);
btnReplay.addEventListener('click', replayGame);
grid.addEventListener('click', onFlagCell);
grid.addEventListener('dblclick', onDigCell);


initGameScreen();