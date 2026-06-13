import * as THREE from "three";
import { setup } from "./src/setup";
import {
    CursorTrailMatcha
} from "./src/components";

const basicScene = setup.jsVer("three-area", "three-area-css");

const CTrail = new CursorTrailMatcha();
basicScene.create(CTrail);