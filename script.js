import * as THREE from "three";
import { setup } from "./src/setup";
import {
    ButtonAurora,
    CursorTrailAurora,
} from "./src/components";

const basicScene = setup.jsVer("three-area", "three-area-css");

const testBtn = new ButtonAurora();
basicScene.create(testBtn);

const testCTrail = new CursorTrailAurora();
basicScene.create(testCTrail);