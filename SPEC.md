# HTML PNG Inspector - Specification

## Overview
Single HTML file tool for inspecting image metadata. Runs entirely in the browser with all dependencies bundled via Vite.

## MVP Scope (Milestone 1)
Essential-only metadata display for common image formats (PNG initially).

## Architecture

### Overall Pattern
Orchestrator pattern with pluggable parsers.

### Data Flow
1. User drops/selects image file
2. UI immediately displays image preview (object URL)
3. ImageInspector receives File object
4. Inspector calls `canParse(file)` on each parser until one returns true
5. Matched parser extracts metadata using appropriate library
6. Parser returns standardized metadata object
7. UI displays JSON.stringify(data, null, 2) in `<pre>`

### Components

**ImageInspector (orchestrator)**
- Constructor receives array of parser instances
- `async analyze(file)`: Iterates parsers calling `canParse(file)`, uses first match
- Returns standardized metadata object
- No format detection logic itself

**PNGParser (parser)**
- `canParse(file)`: Checks extension + PNG magic bytes (`89 50 4E 47`)
- `async parse(file)`: Uses library to extract metadata
- Returns object matching standard structure

**UI Controller**
- Handles drag-and-drop + file input events
- On file selected: Immediately displays preview (create object URL)
- Then calls ImageInspector.analyze() and renders result to `<pre>`
- Cleans up object URLs

### Standard Metadata Structure (MVP)
```js
{
  format: 'PNG',
  file: {
    name: 'example.png',
    size: 245680
  },
  dimensions: {
    width: 1920,
    height: 1080,
  },
  color: {
    colorType: 'RGB',
    bitDepth: 8,
  },
  // ... parser-specific basics
}
```

## Technology Stack
- Vanilla JS for UI (no framework)
- Image parsing libraries (format-specific)
- Vite for bundling into single HTML file with embedded dependencies
- No CDN dependencies

## UI Design
- Left side: File input + drag-and-drop zone, image preview
- Right side: Large `<pre>` displaying metadata JSON

## Error Handling (MVP)
Display errors in the `<pre>` element.

## Future Work
- Evaluate using a Worker for the analysis
- Implement additional formats (JPEG, WEBP, etc.)
- Detect and report non-lethal problems in the files
- Milestone 2: Comprehensive metadata (EXIF, PNG chunks, ICC profiles)
- Milestone 3: Technical deep-dive (hex viewer, color histograms, raw chunk data)
