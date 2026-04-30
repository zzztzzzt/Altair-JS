import * as THREE from "three";
import { setup } from "./src/setup";
import {
    ClickTrackingNeonOrange
} from "./src/components";

const basicScene = setup.jsVer("three-area", "three-area-css");


const CT = new ClickTrackingNeonOrange();
basicScene.create(CT);