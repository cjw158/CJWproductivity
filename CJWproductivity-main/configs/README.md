# Build Configurations

This directory contains different build configurations for CJWproductivity.

## Available Configurations

### free.json
Free edition with basic features:
- ✅ Calendar (基础日历)
- ✅ Notes (基础笔记)
- ❌ Plans (计划画廊)
- ❌ Island (灵动岛)
- ❌ Focus (专注模式)
- ❌ Wallpaper (动态壁纸)

### full.json
Full edition with all features:
- ✅ All modules enabled
- ✅ All skins and themes
- ✅ All effects and sounds

### custom.json (create your own)
Customize which modules to include in your build.

## Usage

```bash
# Build free edition
npm run build -- --config=configs/free.json

# Build full edition
npm run build -- --config=configs/full.json

# Build custom edition
npm run build -- --config=configs/custom.json
```

## Configuration Format

```json
{
  "name": "Edition Name",
  "version": "1.0.0",
  "modules": {
    "calendar": true,
    "notes": true,
    "plans": false,
    ...
  },
  "skins": {
    "themes": ["theme1", "theme2"],
    "island": ["skin1"],
    "effects": ["effect1"],
    "sounds": ["sound1"]
  },
  "license": {
    "type": "free|full|custom",
    "userId": "optional",
    "userName": "optional"
  }
}
```
