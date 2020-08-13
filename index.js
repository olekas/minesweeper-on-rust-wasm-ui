import { MinesweeperBind} from "./wasm/minesweeper_on_rust";
import { memory } from "./wasm/minesweeper_on_rust_bg";

let game = null;
const DEFAULT_CELL_SIZE = 2;

const MIN_GAME_GRID_ROWS = 5;
const MAX_GAME_GRID_ROWS = 1000;
const MIN_GAME_GRID_COLS = 5;
const MAX_GAME_GRID_COLS = 100;

const MIN_MINED_PERCENTAGE = 0.1;
const MAX_MINED_PERCENTAGE = 0.9;
const DEFAULT_MINED_PERCENTAGE = 0.4;

const MIN_CELL_SIZE = 1;
const MAX_CELL_SIZE = 5;

const PIXELS_PER_REM = parseFloat(getComputedStyle(document.documentElement).fontSize);

const play = document.querySelector(".game-container");
const grid = document.querySelector(".grid-container");
const labelCountDown = document.querySelector("#count-down-value");
const inputNumRows = document.querySelector("#rows-value");
const inputNumCols = document.querySelector("#cols-value");
const inputPercentageMined = document.querySelector("#mined-pers-value");
const infoNumRowsNow = document.querySelector("#rows-value-now");
const infoNumColsNow = document.querySelector("#cols-value-now");
const infoPercentageMinedNow = document.querySelector("#mined-pers-value-now");
const btnReplay = document.querySelector("#game-btn-replay");
const btnRecreate = document.querySelector("#game-btn-recreate");
const inputCellSize = document.querySelector("#game-cell-size");
const btnResetFitH = document.querySelector("#game-btn-fit-height");
const btnResetFitW = document.querySelector("#game-btn-fit-width");

const resetToFitScreenHeight = function(ratio = 1){
    inputNumRows.value = Math.floor(window.innerHeight / (inputCellSize.value*PIXELS_PER_REM+3)*ratio)
}

const resetToFitScreenWidth = function(ratio = 1){
    inputNumCols.value = Math.floor((window.innerWidth-PIXELS_PER_REM*8) / (inputCellSize.value*PIXELS_PER_REM+3)*ratio)-1
}

const initGameScreen = function() {
    inputNumRows.min = MIN_GAME_GRID_ROWS
    inputNumRows.max = MAX_GAME_GRID_ROWS
    inputNumRows.value = Math.floor(inputNumRows.max * 0.7);

    inputNumCols.min = MIN_GAME_GRID_COLS
    inputNumCols.max = MAX_GAME_GRID_COLS
    inputNumCols.value = Math.floor(inputNumCols.max * 0.7);

    inputCellSize.min = MIN_CELL_SIZE;
    inputCellSize.max = MAX_CELL_SIZE;
    inputCellSize.value = DEFAULT_CELL_SIZE;

    inputPercentageMined.min = Math.floor(MIN_MINED_PERCENTAGE*100);
    inputPercentageMined.max = Math.floor(MAX_MINED_PERCENTAGE*100);
    inputPercentageMined.value = Math.floor(DEFAULT_MINED_PERCENTAGE*100);

    resetToFitScreenHeight(0.7);
    resetToFitScreenWidth(0.7);
    createNewGame();
}

const createNewGame = function() {
    let grid_rows = inputNumRows.value;
    let grid_cols = inputNumCols.value;
    let mined_percentage = inputPercentageMined.value/100.0;

    game = MinesweeperBind.new(grid_rows, grid_cols, mined_percentage);

    buildGameGrid();

    infoNumRowsNow.value = inputNumRows.value;
    infoNumColsNow.value = inputNumCols.value;
    infoPercentageMinedNow.value = inputPercentageMined.value;
    labelCountDown.value = game.count_remaining_cells();
}

const replayGame = function() {
    game.replay();
    buildGameGrid();
    labelCountDown.value = game.count_remaining_cells();
}

const onSellSizeChange = function(e) {
    grid.querySelectorAll(".cell").forEach(cell => {
        cell.classList.remove('cell-size-1', 'cell-size-2', 'cell-size-3', 'cell-size-4', 'cell-size-5')
        cell.classList.add(`cell-size-${inputCellSize.value}`)
    })
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
                play.className = "game-container game-win";            
            } else {
                play.className = "game-container game-lose";
            }
            grid.className = "grid-container game-over";
        }
        e.preventDefault();
    }
}


const updateCell = function(row, col, current_row=null, current_col=null) {
    const cell = grid.querySelector(`#cell_${row}x${col}`);
    const cellSize = inputCellSize.value
    if (!game.is_cell_hidden(row, col)) {
        if (game.is_cell_mined(row, col)) {
            if (row == current_row && col == current_col) {
                cell.className = `cell cell-size-${cellSize} cell-explosion`;
            } else {
                cell.className = `cell cell-size-${cellSize} cell-mined`;
            }
        } else {
            cell.className = `cell cell-size-${cellSize} cell-digged`;
            const neighbors = game.count_cell_neighbors(row, col);
            cell.className = `cell cell-size-${cellSize} cell-digged${neighbors}`;
        }
    } else if (game.is_cell_flagged(row, col)) {
        cell.className = `cell cell-size-${cellSize} cell-flagged`;
    } else {
        cell.className = `cell cell-size-${cellSize} cell-hidden`;
    }
}

const buildGameGrid = function (num_rows, num_cols) {
    grid.innerHTML = "";
    play.className = "game-container";
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
            cell.classList.add(`cell-size-${inputCellSize.value}`);
            cell.classList.add("cell-hidden");
            row.appendChild(cell);        
        }
        grid.appendChild(row);  
    } 
}


inputCellSize.addEventListener("change", onSellSizeChange);

grid.addEventListener('click', onFlagCell);
grid.addEventListener('dblclick', onDigCell);

btnRecreate.addEventListener('click', createNewGame);
btnReplay.addEventListener('click', replayGame);
btnResetFitH.addEventListener('click', e => { resetToFitScreenHeight(1); });
btnResetFitW.addEventListener('click', e => { resetToFitScreenWidth(1); });


initGameScreen();