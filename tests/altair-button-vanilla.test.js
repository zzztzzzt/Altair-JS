import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ButtonVanilla } from '@altair3d/UI/altair-button-vanilla.js';

describe('ButtonVanilla Core Functionality Testing', () => {
  it('basic components should be declared', () => {
    const button = new ButtonVanilla(0);

    expect(button.objectType).toBe('button');

    expect(button.mainMesh).toBeInstanceOf(THREE.Mesh);
    expect(button.arrow).toBeInstanceOf(THREE.Mesh);
    expect(button.particleSystem).toBeInstanceOf(THREE.Points);
  });

  it('constructor with color 1 uses second color set', () => {
    const button = new ButtonVanilla(1);
    expect(button.objectType).toBe('button');
    expect(button.mainMesh).toBeInstanceOf(THREE.Mesh);
    expect(button.colorTypeList[1]).toBeDefined();
  });

  it('getMeshes should return all mesh references', async () => {
    const button = new ButtonVanilla(0);
    const meshes = await button.getMeshes();

    expect(meshes.mainMesh).toBe(button.mainMesh);
    expect(meshes.arrow).toBe(button.arrow);
    expect(meshes.particleSystem).toBe(button.particleSystem);
  });

  it('changePosition should move all visual objects together', () => {
    const button = new ButtonVanilla(0);

    button.changePosition(1, 2, 3);

    expect(button.mainMesh.position.toArray()).toEqual([1, 2, 3]);
    expect(button.arrow.position.toArray()).toEqual([1, 2, 3]);
    expect(button.particleSystem.position.toArray()).toEqual([1, 2, 3]);
  });

  it('changeScale should scale all visual objects together', () => {
    const button = new ButtonVanilla(0);

    button.changeScale(2, 2, 2);

    expect(button.mainMesh.scale.toArray()).toEqual([2, 2, 2]);
    expect(button.arrow.scale.toArray()).toEqual([2, 2, 2]);
    expect(button.particleSystem.scale.toArray()).toEqual([2, 2, 2]);
  });

  it('changeScale should update particle size with uniform scale', () => {
    const button = new ButtonVanilla(0);

    button.changeScale(2, 2, 2);

    expect(button.particleSystem.material.size).toBeCloseTo(0.2);
  });

  it('scaleSet and positionSet should delegate to changeScale/changePosition', () => {
    const button = new ButtonVanilla(0);
    button.positionSet(10, 20, 30);
    expect(button.mainMesh.position.toArray()).toEqual([10, 20, 30]);
    button.scaleSet(3, 3, 3);
    expect(button.mainMesh.scale.toArray()).toEqual([3, 3, 3]);
  });

  it('listener getters should return expected handlers', () => {
    const button = new ButtonVanilla(0);

    expect(button.getListenerFunc('click')).toBe(button.whenClick);
    expect(button.getListenerFunc('mousemove')).toBe(button.whenMouseMove);
    expect(button.getListenerFunc('mouseover')).toBe(button.whenMouseOver);
    expect(button.getListenerFunc('notmouseover')).toBe(button.notMouseOver);
    expect(button.getListenerFunc('unknown')).toBeUndefined();
  });

  it('getAnimateFunc should return animateFunc', () => {
    const button = new ButtonVanilla(0);

    expect(button.getAnimateFunc()).toBe(button.animateFunc);
    expect(typeof button.getAnimateFunc()).toBe('function');
  });

  it('animateFunc should rotate arrow and mark particle position as updated', () => {
    const button = new ButtonVanilla(0);
    const animate = button.getAnimateFunc();
    const prevRotX = button.arrow.rotation.x;
    const prevRotY = button.arrow.rotation.y;
    const positionAttr = button.particleSystem.geometry.attributes.position;
    const prevVersion = positionAttr.version;

    animate();

    expect(button.arrow.rotation.x).toBeGreaterThan(prevRotX);
    expect(button.arrow.rotation.y).toBeGreaterThan(prevRotY);
    expect(positionAttr.version).toBeGreaterThan(prevVersion);
  });
});
