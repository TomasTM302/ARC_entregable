export default function Loading() {
  return (
    <div className="bg-white rounded-lg p-6 w-full text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left">
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
              </th>
              <th className="py-3 px-4 text-left">
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
              </th>
              <th className="py-3 px-4 text-left">
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
              </th>
              <th className="py-3 px-4 text-left">
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
              </th>
              <th className="py-3 px-4 text-left">
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[...Array(5)].map((_, index) => (
              <tr key={index}>
                <td className="py-3 px-4">
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="py-3 px-4">
                  <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="py-3 px-4">
                  <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="py-3 px-4">
                  <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="py-3 px-4">
                  <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
