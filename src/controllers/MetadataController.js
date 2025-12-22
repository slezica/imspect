export class MetadataController {
  constructor($container) {
    this.$container = $container

    this.state = {
      data: null,
      error: null,
      loading: false,
      showJSON: false
    }

    // Views:
    this.$placeholder = $container.querySelector('.view.placeholder')
    this.$loading = $container.querySelector('.view.loading')
    this.$error = $container.querySelector('.view.error')
    this.$contentPretty = this.$container.querySelector('.view.content.pretty')
    this.$contentJSON = this.$container.querySelector('.view.content.json')

    // Pretty content view fields:
    this.$fileType = this.$contentPretty.querySelector('.file-type')
    this.$fileName = this.$contentPretty.querySelector('.file-name')
    this.$fileSize = this.$contentPretty.querySelector('.file-size')
    this.$dimensionsWidth = this.$contentPretty.querySelector('.dimensions-width')
    this.$dimensionsHeight = this.$contentPretty.querySelector('.dimensions-height')
    this.$dimensionsAspect = this.$contentPretty.querySelector('.dimensions-aspect')
    this.$colorType = this.$contentPretty.querySelector('.color-type')
    this.$colorDepth = this.$contentPretty.querySelector('.color-depth')

    // JSON content view fields:
    this.$jsonPre = this.$contentJSON.querySelector('pre')

    // Error view fields:
    this.$errorMessage = this.$error.querySelector('.message')

    // Controls:
    this.$toggleJSON = $container.querySelector('.toggle-json')

    // Listeners:
    this.$toggleJSON.addEventListener('click', ev => {
      this.setState({ ...this.state, showJSON: !this.state.showJSON })
    })

    this._render()
  }

  setState(newState) {
    this.state = { loading: false, error: null, data: null, showJSON: false, ...newState }
    this._render()
  }

  _render() {
    const state = this.state

    if (state.loading) {
      this._renderLoading()

    } else if (state.error) {
      this._renderError(state.error)

    } else if (state.data && state.showJSON) {
      this._renderContentJSON()

    } else if (state.data && !state.showJSON) {
      this._renderContentPretty()

    } else {
      this._renderPlaceholder()
    }
  }

  _renderContentPretty() {
    this._setView(this.$contentPretty)

    const data = this.state.data

    this.$fileType.textContent = data.format
    this.$fileName.textContent = data.file.name
    this.$fileSize.textContent = this._formatFileSize(data.file.size)

    this.$dimensionsWidth.textContent = `${data.dimensions.width}px`
    this.$dimensionsHeight.textContent = `${data.dimensions.height}px`
    this.$dimensionsAspect.textContent = this._formatAspectRatio(
      data.dimensions.width,
      data.dimensions.height
    )

    this.$colorType.textContent = data.color.colorType
    this.$colorDepth.textContent = `${data.color.bitDepth} bits`
  }

  _renderContentJSON() {
    this._setView(this.$contentJSON)
    console.log(this.state.data)
    this.$jsonPre.textContent = JSON.stringify(this.state.data, null, 2)
  }

  _renderError() {
    this._setView(this.$error)
    this.$errorMessage.textContent = this.state.error.toString()
  }

  _renderLoading() {
    this._setView(this.$loading)
  }

  _renderPlaceholder() {
    this._setView(this.$placeholder)
  }

  _setView($visibleView) {
    const $views = [this.$placeholder, this.$loading, this.$error, this.$contentPretty, this.$contentJSON]

    for (let $view of $views) {
      $view.classList.toggle('hidden', $view != $visibleView)
    }

    if ([this.$contentPretty, this.$contentJSON].includes($visibleView)) {
      this.$toggleJSON.classList.remove('hidden')

      if (this.state.showJSON) {
        this.$toggleJSON.textContent = 'Hide JSON'
      } else {
        this.$toggleJSON.textContent = 'Show JSON'
      }
    } else {
      this.$toggleJSON.classList.add('hidden')
    }
  }

  _formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} bytes`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  _formatAspectRatio(width, height) {
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b)
    const divisor = gcd(width, height)
    return `${width / divisor}:${height / divisor}`
  }
}
