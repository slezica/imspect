export class ImageInspector {
  constructor(parsers) {
    this.parsers = parsers
  }

  async inspect(file) {
    // Find the first parser that can handle this file
    for (const parser of this.parsers) {
      if (await parser.canParse(file)) {
        return await parser.parse(file)
      }
    }

    // No parser found
    throw new Error(`Unsupported file format: ${file.name}`)
  }
}
