import * as THREE from "three";
import { setup } from "./src/setup";
import {
    ButtonMatcha,
} from "./src/components";

const basicScene = setup.jsVer("three-area", "three-area-css");

const btn = new ButtonMatcha();
basicScene.create(btn);
