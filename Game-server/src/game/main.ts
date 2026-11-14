import {Boot} from './scenes/Boot.ts';
import {GameOver} from './scenes/GameOver.ts';
import {MainGame} from './scenes/MainGame.ts';
import {AUTO, Game, Scale} from 'phaser';
import {Preloader} from './scenes/Preloader.ts';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    // width: 1024,
    // height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scene: [
        Boot,
        Preloader,
        MainGame,
        GameOver
    ],
    scale: {
        mode: Scale.RESIZE,
        autoCenter: Scale.CENTER_BOTH,

        zoom: 1
    },
};

const StartGame = (parent: string) => {

    return new Game({...config, parent});
}

export default StartGame;
