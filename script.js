import * as THREE from "three";
import { setup } from "./src/setup";
import {
    MovieWater,
    MovieStarRing,
    ButtonRadiant,
} from "./src/components";

import examplePureSky from '@hdr/example_puresky_1k.hdr';

const basicScene = setup.jsVer("three-area", "three-area-css");

const envMap = await basicScene.loadEnvironment(examplePureSky, 0, Math.PI * 5 / 9, 0);


const ocean = new MovieWater(basicScene, envMap);
basicScene.create(ocean);


const starRing = new MovieStarRing();
basicScene.create(starRing);

await starRing.loadModelAsync();
starRing.scaleSet(10, 10, 10);
starRing.positionSet(-20, 0, -120);
starRing.rotationSet(Math.PI / 6, 0, -Math.PI / 4);


const matelFlower = new ButtonRadiant();
basicScene.create(matelFlower);

matelFlower.positionSet(20, 10, -100);
matelFlower.scaleSet(7, 7, 7);


const matelFlower2 = new ButtonRadiant();
basicScene.create(matelFlower2);

matelFlower2.positionSet(0, 0, -20);