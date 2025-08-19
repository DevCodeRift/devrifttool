import versionInfo from '../../version.json'

export default function VersionBadge() {
  return (
    <div className="fixed bottom-4 left-4 terminal-card px-3 py-1 text-xs font-mono opacity-60 hover:opacity-100 transition-opacity text-gray-400">
      v{versionInfo.version} {versionInfo.stage}
    </div>
  )
}
