interface Props {
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onFullscreen: () => void
  onDownload: () => void
}

export default function MapControls({ onZoomIn, onZoomOut, onFit, onFullscreen, onDownload }: Props) {
  return (
    <div className="map-controls">
      <button className="map-ctrl-btn" onClick={onZoomIn} title="放大">+</button>
      <button className="map-ctrl-btn" onClick={onZoomOut} title="缩小">−</button>
      <button className="map-ctrl-btn" onClick={onFit} title="适应屏幕">⊡</button>
      <button className="map-ctrl-btn" onClick={onFullscreen} title="全屏">⛶</button>
      <button className="map-ctrl-btn" onClick={onDownload} title="下载 MD">↓</button>
    </div>
  )
}
