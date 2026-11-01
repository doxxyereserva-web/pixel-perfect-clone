import { describe, it, expect } from 'vitest';
import { libraryAssets } from '@/lib/asset-library';
import { presetLuau, vfxPresets } from '@/lib/vfx-presets';
describe('real assets and requested particle presets', () => {
  it.each(['Slash', 'Intro', 'Explosion', 'Gunfire'])('includes downloadable %s particle presets', category => {
    const rows = libraryAssets.filter(a => a.type === 'VFX particles' && a.category === category);
    expect(rows).toHaveLength(3);
    expect(rows.every(a => a.download.startsWith('/__l5e/assets-v1/'))).toBe(true);
  });
  it('keeps verified pack counts distinct from individual duplicates', () => {
    const packs = libraryAssets.filter(a => a.type === '3D packs');
    expect(packs).toHaveLength(8);
    expect(packs.reduce((sum, p) => sum + p.count, 0)).toBe(1040);
    expect(libraryAssets.filter(a => a.type === '3D models')).toHaveLength(20);
    expect(packs.every(a => a.license === 'CC0' && a.creator === 'Kenney')).toBe(true);
  });
  it('exports cosmetic particles with explicit texture ownership and cleanup', () => {
    const p = vfxPresets.find(p => p.id === 'muzzle-flash');
    if (!p) throw new Error('Missing requested muzzle flash');
    const code = presetLuau(p);
    expect(code).toContain('emitter:Emit(6)');
    expect(code).toContain('Debris:AddItem(anchor, 0.37)');
    expect(code).toContain('Supply your uploaded texture asset ID');
  });
});