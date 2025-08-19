import versionInfo from '../../version.json'

export default function VersionBadge() {
  return (
    <div className="fixed bottom-4 left-4 bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-mono opacity-75 hover:opacity-100 transition-opacity">
      {versionInfo.stage} v{versionInfo.version}.{versionInfo.buildNumber.toString().padStart(2, '0')}
    </div>
  )
}
