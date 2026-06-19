import * as THREE from "three";
import { setup } from "./src/setup";
import {
    ButtonMatcha,
    CursorTrailMatcha,
} from "./src/components";

const useEnvMap = false;

const FOV = 20;
const cameraZ = 20;
const basicScene = setup.jsVer("three-area", "three-area-css", FOV, cameraZ, useEnvMap);

const btn = new ButtonMatcha(0 /* Color Style */, useEnvMap);
basicScene.create(btn);

const CTrail = new CursorTrailMatcha();
basicScene.create(CTrail);
