/**
 * Vault class for player resources storage
 */
 export default class Vault {
    wood = 0;  // current wood count the player has
    ore = 0; // current ore count the player has
    food = 0; // current food count the player has
    money = 0; // current money count the player has
    // constructor just sets the values received in params
    constructor(wood = 0, ore = 0, food = 0, money = 0) {
        this.wood = wood; this.ore = ore; this.food = food; this.money = money;
    }
 }