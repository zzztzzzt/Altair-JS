import { describe, it, expect, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { ClickTrackingLilac } from '@altair3d/UI/altair-click-tracking-lilac.js';

describe('ClickTrackingLilac Core Functionality Testing', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('basic components should be declared', () => {
    const tracker = new ClickTrackingLilac(0);

    expect(tracker.objectType).toBe('click-tracking');
    expect(tracker.ballGroup).toBeInstanceOf(THREE.Group);
    expect(tracker.colorTypeList.length).toBe(3);
    expect(tracker.clickLock).toBe(false);
  });

  it('getMeshes should return main mesh reference', async () => {
    const tracker = new ClickTrackingLilac(0);
    const meshes = await tracker.getMeshes();

    expect(meshes.mainMesh).toBe(tracker.ballGroup);
  });

  it('listener getters should return expected handlers', () => {
    const tracker = new ClickTrackingLilac(0);

    expect(tracker.getListenerFunc('click')).toBe(tracker.whenClick);
    expect(tracker.getListenerFunc('mousemove')).toBe(tracker.whenMouseMove);
    expect(tracker.getListenerFunc('mouseover')).toBe(tracker.whenMouseOver);
    expect(tracker.getListenerFunc('notmouseover')).toBe(tracker.notMouseOver);
    expect(tracker.getListenerFunc('unknown')).toBeUndefined();
  });

  it('getAnimateFunc should return animateFunc', () => {
    const tracker = new ClickTrackingLilac(0);

    expect(tracker.getAnimateFunc()).toBe(tracker.animateFunc);
    expect(typeof tracker.getAnimateFunc()).toBe('function');
  });

  it('whenClick should spawn balls and clear them after timeout', () => {
    vi.useFakeTimers();

    const tracker = new ClickTrackingLilac(0);

    tracker.whenClick();

    expect(tracker.clickLock).toBe(true);
    expect(tracker.ballGroup.children.length).toBeGreaterThan(0);

    vi.advanceTimersByTime(tracker.ballsLifetimeMs);

    expect(tracker.clickLock).toBe(false);
    expect(tracker.ballGroup.children.length).toBe(0);
  });

  it('animateFunc should update ball motion and group rotation', () => {
    const tracker = new ClickTrackingLilac(0);

    const geometry = new THREE.SphereGeometry(1, 8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.4,
    });
    const ball = new THREE.Mesh(geometry, material);

    ball.position.set(0, 0, 0);
    ball.userData.velocity = new THREE.Vector3(0.1, 0.2, 0.3);
    ball.userData.spin = new THREE.Vector3(0.01, 0.02, 0);
    ball.userData.seed = 0;

    tracker.ballGroup.add(ball);

    const rotationBefore = tracker.ballGroup.rotation.y;
    const positionBefore = ball.position.clone();
    const velocityBefore = ball.userData.velocity.clone();

    vi.spyOn(performance, 'now').mockReturnValue(1000);

    tracker.animateFunc();

    expect(ball.userData.velocity.y).toBeLessThan(velocityBefore.y);
    expect(ball.position.y).not.toBe(positionBefore.y);
    expect(ball.rotation.x).not.toBe(0);
    expect(ball.rotation.y).not.toBe(0);
    expect(tracker.ballGroup.rotation.y).not.toBe(rotationBefore);
  });
});
