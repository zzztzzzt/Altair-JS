import { AltairScene } from "@altair3d/altair-setup-beta.js";

const setup = {
  jsVer: (divId, cssDivId, FOV = 20, cameraZ = 20, useEnvMap = false) => {
    return new AltairScene(divId, cssDivId, FOV, cameraZ, useEnvMap);
  },
  altairVue: () => {}
};

export { setup, AltairScene };
